import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../context/AuthContext';
import { LANGUAGES, STARTER_TEMPLATES } from '../lib/constants';
import { runAllTestCases } from '../lib/piston';
import { 
  Play, Check, X, AlertTriangle, Clock, RotateCcw, 
  ArrowLeft, Terminal, Cpu, BookOpen, AlertCircle
} from 'lucide-react';

export default function SolvePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { questionsList, recordSubmission, showToast } = useAuth();

  const question = questionsList.find(q => q.id === id);

  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(STARTER_TEMPLATES['cpp']);
  const [isRunning, setIsRunning] = useState(false);
  const [runResults, setRunResults] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  
  const [cooldown, setCooldown] = useState(0);
  const [runCount, setRunCount] = useState(0);

  const handleLangChange = (langId) => {
    const langObj = LANGUAGES.find(l => l.id === langId);
    if (langObj) {
      setSelectedLang(langObj);
      setCode(STARTER_TEMPLATES[langId] || '');
      setRunResults(null);
    }
  };

  const handleResetCode = () => {
    setCode(STARTER_TEMPLATES[selectedLang.id] || '');
  };

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  if (!question) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="judge-card p-8 text-center space-y-4 max-w-md font-mono">
          <AlertTriangle className="w-8 h-8 text-[#D29922] mx-auto" />
          <h2 className="text-sm font-bold text-[#E6EDF3]">// QUESTION_NOT_FOUND</h2>
          <p className="text-xs text-[#7D8590]">
            The requested problem ID does not exist in the database.
          </p>
          <Link
            to="/"
            className="inline-block px-4 py-2 rounded bg-[#161B22] border border-[#21262D] text-xs font-bold text-[#3FB950]"
          >
            [RETURN_HOME]
          </Link>
        </div>
      </div>
    );
  }

  const handleRunCode = async () => {
    if (cooldown > 0 || isRunning) return;
    
    if (runCount >= 20) {
      showToast('Session execution limit reached (20 runs max). Take a break before trying again.', 'error');
      return;
    }

    setIsRunning(true);
    setRunResults(null);
    setActiveTab('results');

    setCooldown(2);
    setRunCount(prev => prev + 1);

    try {
      const evaluation = await runAllTestCases(selectedLang, code, question.test_cases || []);
      setRunResults(evaluation);

      await recordSubmission(
        question.id,
        evaluation.allPassed ? 'pass' : 'fail',
        code,
        selectedLang.id,
        evaluation.results
      );

      if (evaluation.allPassed) {
        showToast('[ACCEPTED] Solution passed all test cases!', 'success');
      } else if (evaluation.hasSystemError) {
        showToast('Judge temporarily busy — please try running again', 'info');
      } else {
        showToast('[WRONG_ANSWER] Evaluation finished with failures.', 'info');
      }
    } catch (err) {
      console.error(err);
      showToast('Judge temporarily busy — please try running again', 'info');
      setRunResults({
        allPassed: false,
        hasSystemError: true,
        results: [
          {
            testCaseIndex: 1,
            input: '',
            expected: '',
            actual: '',
            passed: false,
            status: 'System Error',
            error: 'Judge temporarily busy — please try running again'
          }
        ]
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return <span className="text-xs font-mono font-semibold text-[#4FA8E0]">● Easy</span>;
      case 'medium':
        return <span className="text-xs font-mono font-semibold text-[#C87DE8]">● Medium</span>;
      case 'hard':
        return <span className="text-xs font-mono font-semibold text-[#E0704F]">● Hard</span>;
      default:
        return null;
    }
  };

  const getVerdictBadge = (res) => {
    switch (res.status) {
      case 'Passed':
        return <span className="text-xs font-mono font-bold text-[#3FB950] bg-[#3FB950]/10 px-2 py-0.5 rounded border border-[#3FB950]/30">[AC] ACCEPTED</span>;
      case 'Compile Error':
        return <span className="text-xs font-mono font-bold text-[#D29922] bg-[#D29922]/10 px-2 py-0.5 rounded border border-[#D29922]/30">[CE] COMPILE_ERROR</span>;
      case 'Runtime Error':
        return <span className="text-xs font-mono font-bold text-[#E0704F] bg-[#E0704F]/10 px-2 py-0.5 rounded border border-[#E0704F]/30">[RE] RUNTIME_ERROR</span>;
      case 'System Error':
        return <span className="text-xs font-mono font-bold text-[#D29922] bg-[#D29922]/10 px-2 py-0.5 rounded border border-[#D29922]/30">[BUSY] JUDGE_BUSY</span>;
      default:
        return <span className="text-xs font-mono font-bold text-[#F85149] bg-[#F85149]/10 px-2 py-0.5 rounded border border-[#F85149]/30">[WA] WRONG_ANSWER</span>;
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-[#0B0E11] overflow-hidden font-sans">
      
      {/* Top Header Bar */}
      <div className="px-4 py-2 bg-[#12161B] border-b border-[#21262D] flex flex-wrap items-center justify-between gap-3 shrink-0 font-mono">
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/')}
            className="p-1 rounded text-[#7D8590] hover:text-[#E6EDF3] hover:bg-[#161B22] transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#7D8590]">// PROBLEM:</span>
            <h1 className="text-sm font-bold text-[#E6EDF3] truncate max-w-xs sm:max-w-md">
              {question.title}
            </h1>
            {getDifficultyLabel(question.difficulty)}
            {(userSubmissions || []).some(s => s.question_id === question.id && s.verdict === 'pass') && (
              <span className="text-[11px] font-mono font-bold text-[#3FB950] bg-[#3FB950]/10 border border-[#3FB950]/30 px-2 py-0.5 rounded flex items-center space-x-1">
                <Check className="w-3 h-3" />
                <span>[AC] COMPLETED</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          
          <select
            value={selectedLang.id}
            onChange={(e) => handleLangChange(e.target.value)}
            className="bg-[#161B22] border border-[#21262D] rounded px-2.5 py-1 text-xs font-mono font-semibold text-[#E6EDF3] focus:outline-none focus:border-[#3FB950] transition-colors cursor-pointer"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleResetCode}
            title="Reset code template"
            className="p-1.5 rounded text-[#7D8590] hover:text-[#E6EDF3] hover:bg-[#161B22] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleRunCode}
            disabled={isRunning || cooldown > 0}
            className={`px-3 py-1 rounded text-xs font-mono font-bold flex items-center space-x-1.5 transition-all ${
              cooldown > 0 || isRunning
                ? 'bg-[#161B22] text-[#7D8590] border border-[#21262D] cursor-not-allowed'
                : 'bg-[#3FB950] text-[#0B0E11] hover:bg-[#3FB950]/90 font-bold'
            }`}
          >
            {isRunning ? (
              <>
                <div className="w-3 h-3 border-2 border-[#0B0E11] border-t-transparent rounded-full animate-spin"> microscopic</div>
                <span>[EXECUTING...]</span>
              </>
            ) : cooldown > 0 ? (
              <>
                <Clock className="w-3.5 h-3.5" />
                <span>WAIT_{cooldown}S</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-[#0B0E11]" />
                <span>[RUN_JUDGE] ({20 - runCount})</span>
              </>
            )}
          </button>

        </div>
      </div>

      {/* Main Split Interface */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Left Side: Statement & Test Cases */}
        <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#21262D] flex flex-col h-1/2 lg:h-full overflow-hidden bg-[#12161B]">
          
          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 px-3 py-1.5 border-b border-[#21262D] bg-[#161B22] shrink-0 font-mono text-xs">
            <button
              onClick={() => setActiveTab('description')}
              className={`px-3 py-1 rounded transition-colors flex items-center space-x-1.5 ${
                activeTab === 'description' 
                  ? 'bg-[#12161B] text-[#3FB950] font-bold border border-[#21262D]' 
                  : 'text-[#7D8590] hover:text-[#E6EDF3]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Statement</span>
            </button>

            <button
              onClick={() => setActiveTab('testcases')}
              className={`px-3 py-1 rounded transition-colors flex items-center space-x-1.5 ${
                activeTab === 'testcases' 
                  ? 'bg-[#12161B] text-[#3FB950] font-bold border border-[#21262D]' 
                  : 'text-[#7D8590] hover:text-[#E6EDF3]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Cases ({question.test_cases?.length || 0})</span>
            </button>

            {runResults && (
              <button
                onClick={() => setActiveTab('results')}
                className={`px-3 py-1 rounded transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'results' 
                    ? runResults.allPassed 
                      ? 'bg-[#3FB950]/10 text-[#3FB950] border border-[#3FB950]/40 font-bold' 
                      : runResults.hasSystemError
                      ? 'bg-[#D29922]/10 text-[#D29922] border border-[#D29922]/40 font-bold'
                      : 'bg-[#F85149]/10 text-[#F85149] border border-[#F85149]/40 font-bold'
                    : 'text-[#7D8590] hover:text-[#E6EDF3]'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Verdict ({runResults.allPassed ? 'AC' : runResults.hasSystemError ? 'BUSY' : 'WA'})</span>
              </button>
            )}
          </div>

          {/* Panel Contents */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {activeTab === 'description' && (
              <div className="prose prose-invert max-w-none text-[#E6EDF3] text-xs sm:text-sm leading-relaxed font-sans">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {question.description}
                </ReactMarkdown>
              </div>
            )}

            {activeTab === 'testcases' && (
              <div className="space-y-4 font-mono">
                <div className="text-xs text-[#7D8590]">// VISIBLE_TEST_CASES</div>
                {question.test_cases?.map((tc, idx) => (
                  <div key={idx} className="judge-card p-4 space-y-2 text-xs">
                    <div className="text-[#7D8590] font-bold">Case #{idx + 1}</div>
                    <div className="space-y-1">
                      <div className="text-[#7D8590]">Input:</div>
                      <pre className="bg-[#0B0E11] p-2 rounded text-[#E6EDF3] border border-[#21262D]">{tc.input}</pre>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[#7D8590]">Expected Output:</div>
                      <pre className="bg-[#0B0E11] p-2 rounded text-[#3FB950] border border-[#21262D]">{tc.expected_output}</pre>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'results' && runResults && (
              <div className="space-y-6 font-mono">
                
                {/* Overall Verdict Status */}
                <div className={`p-4 rounded border flex items-center space-x-3 ${
                  runResults.allPassed 
                    ? 'bg-[#3FB950]/10 border-[#3FB950]/40 text-[#3FB950]' 
                    : runResults.hasSystemError
                    ? 'bg-[#D29922]/10 border-[#D29922]/40 text-[#D29922]'
                    : 'bg-[#F85149]/10 border-[#F85149]/40 text-[#F85149]'
                }`}>
                  {runResults.allPassed ? (
                    <Check className="w-8 h-8 shrink-0 text-[#3FB950]" />
                  ) : runResults.hasSystemError ? (
                    <AlertTriangle className="w-8 h-8 shrink-0 text-[#D29922]" />
                  ) : (
                    <X className="w-8 h-8 shrink-0 text-[#F85149]" />
                  )}
                  <div>
                    <div className="text-sm font-bold">
                      {runResults.allPassed 
                        ? '[AC] ACCEPTED — ALL TEST CASES PASSED' 
                        : runResults.hasSystemError
                        ? '[SYS_BUSY] JUDGE TEMPORARILY BUSY'
                        : '[WA] EVALUATION FAILED'}
                    </div>
                    <div className="text-xs opacity-80 mt-0.5">
                      {runResults.allPassed 
                        ? 'Submission verified by judge. Streak updated.' 
                        : runResults.hasSystemError
                        ? 'The public judge engine is rate-limited. Please wait a moment and click Run again.'
                        : 'Review per-test-case output diff below.'}
                    </div>
                  </div>
                </div>

                {/* Test case diff comparison */}
                <div className="space-y-4">
                  <div className="text-xs text-[#7D8590]">// TEST_CASE_OUTPUT_DIFF</div>

                  {runResults.results.map((res, i) => (
                    <div key={i} className={`judge-card p-4 space-y-3 text-xs border ${
                      res.passed ? 'border-[#3FB950]/30' : 'border-[#F85149]/30'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#E6EDF3]">Test #{res.testCaseIndex}</span>
                        {getVerdictBadge(res)}
                      </div>

                      {res.error ? (
                        <div className="space-y-1">
                          <div className="text-[#F85149] font-bold">Execution Error:</div>
                          <pre className="bg-[#0B0E11] p-3 rounded text-[#F85149] border border-[#F85149]/30 overflow-x-auto whitespace-pre-wrap">
                            {res.error}
                          </pre>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <div className="text-[#7D8590]">Expected Output:</div>
                            <pre className="bg-[#0B0E11] p-2 rounded text-[#3FB950] border border-[#21262D] mt-1">{res.expected}</pre>
                          </div>
                          <div>
                            <div className="text-[#7D8590]">Actual Output:</div>
                            <pre className={`p-2 rounded border mt-1 ${
                              res.passed 
                                ? 'bg-[#3FB950]/10 text-[#3FB950] border-[#3FB950]/30' 
                                : 'bg-[#F85149]/10 text-[#F85149] border-[#F85149]/30'
                            }`}>{res.actual || '(empty stdout)'}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

              </div>
            )}

          </div>
        </div>

        {/* Right Side: Editor with macOS/Terminal Chrome */}
        <div className="lg:col-span-7 flex flex-col h-1/2 lg:h-full overflow-hidden bg-[#0B0E11]">
          
          {/* Terminal Window Header Bar (3 dots + tab) */}
          <div className="px-4 py-2 bg-[#161B22] border-b border-[#21262D] flex items-center justify-between font-mono text-xs shrink-0">
            {/* macOS 3 dots */}
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F85149]/80 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#D29922]/80 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#3FB950]/80 inline-block"></span>
              
              {/* File Tab */}
              <span className="ml-3 px-3 py-1 bg-[#12161B] text-[#E6EDF3] border-t-2 border-t-[#3FB950] border-x border-x-[#21262D] rounded-t text-xs font-bold">
                solution.{selectedLang.id === 'cpp' ? 'cpp' : selectedLang.id === 'java' ? 'java' : 'py'}
              </span>
            </div>

            <span className="text-[11px] text-[#7D8590]">
              Piston Runtime v{selectedLang.pistonVersion}
            </span>
          </div>

          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={selectedLang.monacoLang}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12, bottom: 12 },
                lineNumbers: 'on',
                smoothScrolling: true,
                tabSize: 4
              }}
            />
          </div>
        </div>

      </div>

    </div>
  );
}
