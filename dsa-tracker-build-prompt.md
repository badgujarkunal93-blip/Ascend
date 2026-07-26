# Build Prompt: DSA Daily Practice Tracker

Paste this into Antigravity to kick off the build.

---

Build a web app called **DSA Tracker** — a daily DSA (Data Structures & Algorithms) practice platform for a college batch of ~50 students, replacing a WhatsApp group + spreadsheet workflow. Seniors post 3 questions a day; students solve them in an in-browser code editor and get instant pass/fail feedback.

## Tech stack
- **Frontend:** React + Vite + Tailwind CSS
- **Backend/DB/Auth:** Supabase (Postgres + built-in auth)
- **Code editor:** Monaco Editor (`@monaco-editor/react`)
- **Code execution/judging:** Piston API (free, public, no API key needed) — `https://emkc.org/api/v2/piston/execute`
- **Design:** dark theme, visually striking, not a generic bootstrap-y look — use a deep dark background (near-black, not pure black), a single accent color, generous spacing, and clean typography (Inter or similar)

## Data model (Supabase tables)
1. **profiles** — id (uuid, references auth.users), email, full_name, role (`'student'` | `'admin'`), streak_count, created_at
2. **questions** — id, title, description (markdown supported), difficulty (`'easy'|'medium'|'hard'`), test_cases (jsonb array of `{input, expected_output}`), posted_date (date), posted_by (references profiles), created_at
3. **submissions** — id, student_id (references profiles), question_id (references questions), code (text), language (`'cpp'|'java'|'python'`), verdict (`'pass'|'fail'|'pending'`), test_results (jsonb — per-test-case pass/fail), submitted_at

## Auth requirements
- Supabase email/password or magic-link auth
- On signup, restrict to a specific college email domain (make the domain a config variable, e.g. `@mitaoe.ac.in`) — reject signups outside it with a clear error message
- New users default to `role: 'student'`. Admin role assigned manually via Supabase table editor (no self-serve admin signup)

## Core features

### Admin panel (role === 'admin' only, route-protected)
- Form to post a new question: title, description (markdown textarea), difficulty, and a dynamic list of test cases (input/expected-output pairs, add/remove rows)
- Set posted_date (defaults to today)
- List/edit/delete previously posted questions

### Student dashboard
- **Today's 3 questions** shown prominently as cards (title, difficulty badge)
- **Archive view** — calendar or list of all past dates, so students who missed a day can still access old questions (never lock out past content)
- Current streak count displayed
- Clicking a question opens the solve view

### Solve view
- Question description rendered (markdown)
- Language selector: C++ / Java / Python
- Monaco editor, syntax-highlighted per selected language, with a sensible starter template per language (basic main/stdin-stdout scaffold)
- "Run" button — sends code to Piston API for **all test cases** for that question, shows pass/fail per test case with actual vs expected output on failures
- On all-pass, save a submission record with verdict='pass' and increment the student's streak if this is their first pass on a question posted today
- Rate-limit "Run" clicks client-side (e.g. disable button for 2 seconds after each run, cap at ~20 runs per question per session) to avoid hammering the free Piston API

### Piston API integration notes
- Endpoint: `POST https://emkc.org/api/v2/piston/execute`
- Body: `{ language, version, files: [{ content: code }], stdin: testCase.input }`
- Language versions: use Piston's `/runtimes` endpoint once to fetch available versions for cpp/java/python and hardcode the latest stable ones
- Compare `run.stdout` (trimmed) against `expected_output` (trimmed) for pass/fail — exact string match is fine for MVP
- Handle compile errors (`compile.stderr`) and runtime errors (`run.stderr`) distinctly from wrong-answer, and show the actual error to the student

## Non-functional requirements
- Fully responsive (students will use this on phones)
- Loading states for all async actions (especially code execution, which can take a few seconds)
- Clear empty states (e.g. "No questions posted today yet")
- Keep the whole app in a clean, conventional Vite React project structure — components, pages, lib/supabase client, lib/piston client, all clearly separated

## What NOT to build yet
- No payment/subscription system
- No self-hosted judge — Piston's public API only
- No LLM-based code review (may add later as a supplementary feature, not for correctness checking)

Build this as a working MVP end to end — auth, admin posting, student solving with real Piston execution, and the archive view are all must-haves. Ask me before adding anything beyond this scope.
