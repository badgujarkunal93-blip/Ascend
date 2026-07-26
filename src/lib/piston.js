const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';
const PISTON_RUNTIMES_URL = 'https://emkc.org/api/v2/piston/runtimes';
const WANDBOX_API_URL = 'https://wandbox.org/api/compile.json';

let cachedRuntimes = null;

/**
 * Dynamically fetches available Piston language runtimes
 */
export async function fetchPistonRuntimes() {
  if (cachedRuntimes) return cachedRuntimes;
  try {
    const res = await fetch(PISTON_RUNTIMES_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    cachedRuntimes = data;
    return data;
  } catch (err) {
    return null;
  }
}

/**
 * Resolves runtime version for Piston
 */
export async function getLanguageVersion(langId) {
  const runtimes = await fetchPistonRuntimes();
  if (runtimes && Array.isArray(runtimes)) {
    const target = langId.toLowerCase();
    const match = runtimes.find(r => 
      r.language.toLowerCase() === target ||
      (r.aliases && r.aliases.map(a => a.toLowerCase()).includes(target))
    );
    if (match && match.version) {
      return match.version;
    }
  }

  const fallbacks = {
    cpp: '10.2.0',
    java: '15.0.2',
    python: '3.10.0'
  };
  return fallbacks[langId.toLowerCase()] || '*';
}

/**
 * Wandbox Compiler Map Fallback
 */
const WANDBOX_COMPILERS = {
  cpp: 'gcc-head',
  java: 'openjdk-jdk-21+35',
  python: 'cpython-3.12.7'
};

/**
 * Fallback code execution via Wandbox public API
 */
async function runWandboxExecution(language, code, stdin) {
  const langKey = language.toLowerCase();
  const compiler = WANDBOX_COMPILERS[langKey] || 'gcc-head';
  
  // Format code for Java Wandbox engine
  let formattedCode = code;
  if (langKey === 'java') {
    formattedCode = code.replace(/public\s+class\s+Main/, 'class Main');
  }

  const res = await fetch(WANDBOX_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      compiler,
      code: formattedCode,
      stdin: stdin || ''
    })
  });

  if (!res.ok) {
    throw new Error(`Wandbox HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  const exitCode = Number(data.status || 0);

  return {
    compile: {
      code: data.compiler_error && data.compiler_error.trim().length > 0 ? 1 : 0,
      stderr: data.compiler_error || ''
    },
    run: {
      code: exitCode,
      stdout: data.program_output || '',
      stderr: data.program_error || ''
    }
  };
}

/**
 * Executes code against a single test case with zero-auth Piston request and Wandbox fallback
 */
export async function runSingleTestCase(code, language, version, stdin, retries = 2) {
  // 1. Try Public Piston API (strictly NO authentication headers)
  try {
    const res = await fetch(PISTON_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        language,
        version,
        files: [{ content: code }],
        stdin: stdin || ''
      })
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }

    // If Piston returned 401 Unauthorized (due to 2/15/2026 whitelist policy) or 404/5xx, switch to Wandbox fallback
    if (res.status === 401 || res.status === 404) {
      return await runWandboxExecution(language, code, stdin);
    }

    if (res.status === 429 || res.status >= 500) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 1000));
        return runSingleTestCase(code, language, version, stdin, retries - 1);
      }
      // Try Wandbox as secondary judge
      return await runWandboxExecution(language, code, stdin);
    }
  } catch (err) {
    // If network error on Piston, fallback to Wandbox
    try {
      return await runWandboxExecution(language, code, stdin);
    } catch (wandboxErr) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 1000));
        return runSingleTestCase(code, language, version, stdin, retries - 1);
      }
      return {
        isSystemError: true,
        error: 'Judge temporarily busy — please try running again'
      };
    }
  }

  // Final fallback to Wandbox
  try {
    return await runWandboxExecution(language, code, stdin);
  } catch (e) {
    return {
      isSystemError: true,
      error: 'Judge temporarily busy — please try running again'
    };
  }
}

/**
 * Runs code sequentially against all test cases for a question
 */
export async function runAllTestCases(languageConfig, code, testCases) {
  const results = [];
  let allPassed = true;
  let hasSystemError = false;

  const pistonLang = languageConfig.pistonLang || languageConfig.id;
  const resolvedVersion = await getLanguageVersion(pistonLang);

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const res = await runSingleTestCase(code, pistonLang, resolvedVersion, tc.input);

    // 300ms buffer delay between sequential calls
    if (i < testCases.length - 1) {
      await new Promise(r => setTimeout(r, 300));
    }

    // System error check
    if (res.isSystemError) {
      results.push({
        testCaseIndex: i + 1,
        input: tc.input,
        expected: tc.expected_output,
        actual: '',
        passed: false,
        status: 'System Error',
        error: res.error || 'Judge temporarily busy — please try running again'
      });
      allPassed = false;
      hasSystemError = true;
      break;
    }

    // Compile Error check
    if (res.compile && (res.compile.code !== 0 || (res.compile.stderr && res.compile.stderr.trim().length > 0))) {
      results.push({
        testCaseIndex: i + 1,
        input: tc.input,
        expected: tc.expected_output,
        actual: '',
        passed: false,
        status: 'Compile Error',
        error: (res.compile.stderr || res.compile.output || 'Compilation failed').trim()
      });
      allPassed = false;
      break;
    }

    const runOutput = res.run || {};

    // Runtime Error check (exit code non-zero or runtime stderr present)
    if (runOutput.code !== 0 || (runOutput.stderr && runOutput.stderr.trim().length > 0)) {
      results.push({
        testCaseIndex: i + 1,
        input: tc.input,
        expected: tc.expected_output,
        actual: (runOutput.stdout || '').trim(),
        passed: false,
        status: 'Runtime Error',
        error: (runOutput.stderr || runOutput.output || `Process exited with code ${runOutput.code}`).trim()
      });
      allPassed = false;
      continue;
    }

    // Compare trimmed stdout vs expected_output
    const actualTrimmed = (runOutput.stdout || '').trim();
    const expectedTrimmed = (tc.expected_output || '').trim();
    const isPass = actualTrimmed === expectedTrimmed;

    if (!isPass) {
      allPassed = false;
    }

    results.push({
      testCaseIndex: i + 1,
      input: tc.input,
      expected: tc.expected_output,
      actual: actualTrimmed,
      passed: isPass,
      status: isPass ? 'Passed' : 'Wrong Answer',
      stderr: null
    });
  }

  return {
    allPassed,
    hasSystemError,
    results
  };
}
