import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Plus, Trash2, Edit3, ShieldCheck, PlusCircle, Check, Eye, EyeOff, 
  BookOpen, AlertTriangle, X, Users, UserX, Clock, Sparkles
} from 'lucide-react';

export default function AdminPage() {
  const { 
    questionsList, addQuestion, updateQuestion, deleteQuestion, 
    studentRoster, fetchStudentRoster, removeStudent, showToast 
  } = useAuth();

  const todayStr = new Date().toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'roster'
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [postedDate, setPostedDate] = useState(todayStr);
  const [description, setDescription] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [testCases, setTestCases] = useState([
    { input: '', expected_output: '' }
  ]);

  const [deletingQuestion, setDeletingQuestion] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchStudentRoster();
  }, []);

  const handleStartEdit = (q) => {
    setEditingId(q.id);
    setTitle(q.title);
    setDifficulty(q.difficulty);
    setPostedDate(q.posted_date || todayStr);
    setDescription(q.description);
    setTestCases(q.test_cases && q.test_cases.length > 0 ? q.test_cases : [{ input: '', expected_output: '' }]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setTestCases([{ input: '', expected_output: '' }]);
    setDifficulty('medium');
    setPostedDate(todayStr);
  };

  const handleAddTestCase = () => {
    setTestCases([...testCases, { input: '', expected_output: '' }]);
  };

  const handleRemoveTestCase = (index) => {
    if (testCases.length === 1) return;
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const handleTestCaseChange = (index, field, value) => {
    const updated = [...testCases];
    updated[index][field] = value;
    setTestCases(updated);
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!title || !description || testCases.some(tc => !tc.input.trim() || !tc.expected_output.trim())) {
      showToast('Please fill out all title, description, and test case fields.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingId) {
        await updateQuestion(editingId, {
          title,
          difficulty,
          posted_date: postedDate,
          description,
          test_cases: testCases
        });
        setEditingId(null);
      } else {
        await addQuestion({
          title,
          difficulty,
          posted_date: postedDate,
          description,
          test_cases: testCases
        });
      }

      setTitle('');
      setDescription('');
      setTestCases([{ input: '', expected_output: '' }]);
      setDifficulty('medium');
      setPostedDate(todayStr);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingQuestion) return;
    await deleteQuestion(deletingQuestion.id);
    setDeletingQuestion(null);
  };

  const confirmRemoveStudent = async () => {
    if (!deletingStudent) return;
    await removeStudent(deletingStudent.id);
    setDeletingStudent(null);
  };

  const getDifficultyLabel = (diff) => {
    switch (diff.toLowerCase()) {
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

  const getInactivityInfo = (lastPassDate) => {
    if (!lastPassDate) {
      return { days: 99, status: 'NO_SUBMISSIONS', color: 'text-[#F85149]', bg: 'bg-[#F85149]/10 border-[#F85149]/30' };
    }
    const diffTime = Math.abs(new Date() - new Date(lastPassDate));
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (days <= 1) {
      return { days, status: '● ACTIVE', color: 'text-[#3FB950]', bg: 'bg-[#3FB950]/10 border-[#3FB950]/30' };
    } else if (days === 2) {
      return { days, status: '● 2 DAYS SKIPPED', color: 'text-[#D29922]', bg: 'bg-[#D29922]/10 border-[#D29922]/30' };
    } else {
      return { days, status: `⚠️ ${days} DAYS SKIPPED (CRITICAL)`, color: 'text-[#F85149]', bg: 'bg-[#F85149]/10 border-[#F85149]/40' };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-mono">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#21262D] pb-4">
        <div>
          <div className="text-xs text-[#C87DE8]">// INSTRUCTOR_CONTROL_ROOM</div>
          <h1 className="text-2xl font-bold text-[#E6EDF3] tracking-tight">
            Admin Management Console
          </h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#12161B] p-1 rounded border border-[#21262D] text-xs">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-1.5 rounded transition-all flex items-center space-x-1.5 ${
              activeTab === 'questions' 
                ? 'bg-[#3FB950] text-[#0B0E11] font-bold' 
                : 'text-[#7D8590] hover:text-[#E6EDF3]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>// QUESTION_MANAGER ({questionsList.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('roster'); fetchStudentRoster(); }}
            className={`px-4 py-1.5 rounded transition-all flex items-center space-x-1.5 ${
              activeTab === 'roster' 
                ? 'bg-[#C87DE8] text-[#0B0E11] font-bold' 
                : 'text-[#7D8590] hover:text-[#E6EDF3]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>// STUDENT_ROSTER ({studentRoster.length})</span>
          </button>
        </div>
      </div>

      {/* Question Delete Confirmation Modal */}
      {deletingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0E11]/80 backdrop-blur-sm">
          <div className="judge-card p-6 max-w-md w-full border border-[#21262D] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[#F85149]">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-sm font-bold text-[#E6EDF3]">// CONFIRM_DELETION</h3>
              </div>
              <button onClick={() => setDeletingQuestion(null)} className="text-[#7D8590] hover:text-[#E6EDF3]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#E6EDF3] font-sans">
              Delete problem <span className="font-mono font-bold text-[#F85149]">"{deletingQuestion.title}"</span>? This will permanently erase it from student dashboards.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeletingQuestion(null)}
                className="px-3 py-1.5 rounded bg-[#161B22] border border-[#21262D] text-xs text-[#7D8590]"
              >
                [CANCEL]
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1.5 rounded bg-[#F85149] text-[#0B0E11] text-xs font-bold"
              >
                [DELETE_NOW]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Removal Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0E11]/80 backdrop-blur-sm">
          <div className="judge-card p-6 max-w-md w-full border border-[#F85149]/40 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[#F85149]">
                <UserX className="w-5 h-5" />
                <h3 className="text-sm font-bold text-[#E6EDF3]">// REMOVE_STUDENT_FROM_BATCH</h3>
              </div>
              <button onClick={() => setDeletingStudent(null)} className="text-[#7D8590] hover:text-[#E6EDF3]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-sans text-[#E6EDF3]">
              <p>
                Are you sure you want to remove <span className="font-mono font-bold text-[#F85149]">{deletingStudent.full_name} ({deletingStudent.email})</span> from the programme?
              </p>
              <p className="text-[#7D8590] font-mono text-[11px] bg-[#161B22] p-2.5 rounded border border-[#21262D]">
                Reason: Student has skipped practice for 3+ consecutive days.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeletingStudent(null)}
                className="px-3 py-1.5 rounded bg-[#161B22] border border-[#21262D] text-xs text-[#7D8590]"
              >
                [CANCEL]
              </button>
              <button
                onClick={confirmRemoveStudent}
                className="px-3 py-1.5 rounded bg-[#F85149] text-[#0B0E11] text-xs font-bold"
              >
                [REMOVE_STUDENT]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: QUESTION MANAGER */}
      {activeTab === 'questions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Creation Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="judge-card p-6 space-y-5">
              <div className="text-xs text-[#7D8590]">
                {editingId ? '// EDIT_PROBLEM_DEFINITION' : '// NEW_PROBLEM_ENTRY'}
              </div>

              <form onSubmit={handleSubmitQuestion} className="space-y-4 text-xs">
                
                <div className="space-y-1">
                  <label className="text-[#7D8590]">title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Binary Tree Traversal"
                    className="w-full bg-[#0B0E11] border border-[#21262D] rounded px-3 py-2 text-[#E6EDF3] focus:outline-none focus:border-[#3FB950]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[#7D8590]">rating</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full bg-[#0B0E11] border border-[#21262D] rounded px-3 py-2 text-[#E6EDF3] focus:outline-none focus:border-[#3FB950] cursor-pointer"
                    >
                      <option value="easy">● Easy</option>
                      <option value="medium">● Medium</option>
                      <option value="hard">● Hard</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#7D8590]">posted_date</label>
                    <input
                      type="date"
                      required
                      value={postedDate}
                      onChange={(e) => setPostedDate(e.target.value)}
                      className="w-full bg-[#0B0E11] border border-[#21262D] rounded px-3 py-2 text-[#E6EDF3] focus:outline-none focus:border-[#3FB950]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[#7D8590]">markdown_statement</label>
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="text-[#3FB950] hover:underline flex items-center space-x-1"
                    >
                      {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPreview ? '[edit]' : '[preview]'}</span>
                    </button>
                  </div>

                  {showPreview ? (
                    <div className="bg-[#0B0E11] border border-[#21262D] rounded p-3 min-h-[140px] prose prose-invert font-sans text-xs">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {description || '*No statement specified.*'}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <textarea
                      rows={6}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="### Problem Statement..."
                      className="w-full bg-[#0B0E11] border border-[#21262D] rounded p-3 text-[#E6EDF3] font-mono focus:outline-none focus:border-[#3FB950]"
                    ></textarea>
                  )}
                </div>

                {/* Dynamic Test Cases */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[#7D8590]">test_cases ({testCases.length})</label>
                    <button
                      type="button"
                      onClick={handleAddTestCase}
                      className="text-[#3FB950] text-xs font-bold border border-[#3FB950]/30 px-2 py-0.5 rounded bg-[#3FB950]/10 flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>[add_case]</span>
                    </button>
                  </div>

                  {testCases.map((tc, idx) => (
                    <div key={idx} className="bg-[#0B0E11] p-3 rounded border border-[#21262D] space-y-2">
                      <div className="flex items-center justify-between text-[#7D8590]">
                        <span>Case #{idx + 1}</span>
                        {testCases.length > 1 && (
                          <button type="button" onClick={() => handleRemoveTestCase(idx)} className="hover:text-[#F85149]">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <textarea
                          rows={2}
                          required
                          value={tc.input}
                          onChange={(e) => handleTestCaseChange(idx, 'input', e.target.value)}
                          placeholder="stdin input"
                          className="bg-[#12161B] border border-[#21262D] p-2 rounded text-xs text-[#E6EDF3] font-mono"
                        ></textarea>
                        <textarea
                          rows={2}
                          required
                          value={tc.expected_output}
                          onChange={(e) => handleTestCaseChange(idx, 'expected_output', e.target.value)}
                          placeholder="expected stdout"
                          className="bg-[#12161B] border border-[#21262D] p-2 rounded text-xs text-[#3FB950] font-mono"
                        ></textarea>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2 rounded bg-[#3FB950] text-[#0B0E11] font-bold text-xs hover:bg-[#3FB950]/90 transition-colors"
                  >
                    {editingId ? '[UPDATE_QUESTION]' : '[PUBLISH_QUESTION]'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-3 py-2 rounded bg-[#161B22] border border-[#21262D] text-[#7D8590] text-xs"
                    >
                      [CANCEL]
                    </button>
                  )}
                </div>

              </form>
            </div>
          </div>

          {/* Existing Questions Data Table */}
          <div className="lg:col-span-5 space-y-4">
            <div className="text-xs text-[#7D8590]">// PUBLISHED_PROBLEMS ({questionsList.length})</div>

            <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
              {questionsList.map((q) => (
                <div key={q.id} className="judge-card p-4 space-y-2 text-xs">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {getDifficultyLabel(q.difficulty)}
                        <span className="text-[#7D8590]">{q.posted_date}</span>
                      </div>
                      <h3 className="font-bold text-[#E6EDF3]">{q.title}</h3>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleStartEdit(q)}
                        className="p-1 text-[#7D8590] hover:text-[#3FB950]"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingQuestion(q)}
                        className="p-1 text-[#7D8590] hover:text-[#F85149]"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-[#7D8590] pt-1 border-t border-[#21262D] flex justify-between">
                    <span>{q.test_cases?.length || 0} cases</span>
                    <span className="text-[#3FB950]">[PUBLISHED]</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: STUDENT ROSTER & INACTIVITY TRACKER */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          
          <div className="judge-card p-4 border border-[#21262D] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#7D8590] font-mono">
              <span className="text-[#E6EDF3] font-bold">// INACTIVITY_POLICY:</span> Students who skip daily problem solving for <span className="text-[#F85149] font-bold">3 consecutive days</span> are flagged for removal from the programme.
            </div>
            <button
              onClick={fetchStudentRoster}
              className="px-3 py-1.5 rounded bg-[#161B22] border border-[#21262D] hover:border-[#30363D] text-xs font-mono text-[#C87DE8] shrink-0"
            >
              [refresh_roster]
            </button>
          </div>

          <div className="judge-card p-6 space-y-4">
            <div className="text-xs text-[#7D8590] font-mono flex items-center justify-between">
              <span>// BATCH_STUDENTS_ROSTER ({studentRoster.length})</span>
              <span className="text-[#F85149]">
                {studentRoster.filter(s => getInactivityInfo(s.last_pass_date).days >= 3).length} At-Risk Students
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#21262D] text-[#7D8590]">
                    <th className="pb-3 font-semibold">STUDENT</th>
                    <th className="pb-3 font-semibold">EMAIL</th>
                    <th className="pb-3 font-semibold">SOLVED</th>
                    <th className="pb-3 font-semibold">STREAK</th>
                    <th className="pb-3 font-semibold">LAST ACTIVE</th>
                    <th className="pb-3 font-semibold">INACTIVITY STATUS</th>
                    <th className="pb-3 font-semibold text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#21262D]/60">
                  {studentRoster.map(student => {
                    const info = getInactivityInfo(student.last_pass_date);
                    return (
                      <tr key={student.id} className="hover:bg-[#161B22]/50 transition-colors">
                        <td className="py-3.5 font-bold text-[#E6EDF3]">
                          {student.full_name}
                        </td>
                        <td className="py-3.5 text-[#7D8590]">
                          {student.email}
                        </td>
                        <td className="py-3.5 text-[#4FA8E0] font-bold">
                          {student.solved_count || 0} solved
                        </td>
                        <td className="py-3.5 text-[#3FB950] font-bold">
                          {student.streak_count || 0}D
                        </td>
                        <td className="py-3.5 text-[#7D8590]">
                          {student.last_pass_date || 'Never'}
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${info.bg} ${info.color}`}>
                            {info.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => setDeletingStudent(student)}
                            className="px-2.5 py-1 rounded bg-[#F85149]/10 text-[#F85149] border border-[#F85149]/30 hover:bg-[#F85149]/20 transition-colors text-[11px] font-bold"
                          >
                            [DROP_STUDENT]
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
