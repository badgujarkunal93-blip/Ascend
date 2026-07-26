import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Terminal, Calendar, ChevronRight, BookOpen, AlertCircle, Check } from 'lucide-react';

export default function DashboardPage() {
  const { profile, questionsList, userSubmissions, loading } = useAuth();
  const navigate = useNavigate();

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter today's questions
  const todayQuestions = questionsList.filter(q => q.posted_date === todayStr);

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

  const isQuestionPassed = (questionId) => {
    return userSubmissions.some(s => s.question_id === questionId && s.verdict === 'pass');
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex items-center space-x-2 text-xs font-mono text-[#7D8590]">
          <div className="w-4 h-4 border-2 border-[#3FB950] border-t-transparent rounded-full animate-spin"></div>
          <span>FETCHING_TODAYS_BATCH...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner - Terminal Comment Style */}
      <div className="judge-card p-6 border-l-4 border-l-[#3FB950] space-y-2">
        <div className="text-xs font-mono text-[#7D8590]">// DAILY_PRACTICE_SYSTEM</div>
        <h1 className="text-xl sm:text-2xl font-mono font-bold text-[#E6EDF3] tracking-tight">
          System.welcome("{profile?.full_name?.split(' ')[0] || 'Coder'}");
        </h1>
        <p className="text-xs font-mono text-[#7D8590]">
          3 problems posted today. Submit accepted solutions in C++, Java, or Python to advance streak.
        </p>
      </div>

      {/* Main Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="space-y-1">
          <h2 className="text-sm font-mono font-bold text-[#E6EDF3] flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-[#3FB950]" />
            <span>// TODAY'S BATCH</span>
            <span className="text-xs font-mono text-[#7D8590] ml-2">
              [{todayStr}]
            </span>
          </h2>
        </div>

        <button
          onClick={() => navigate('/archive')}
          className="inline-flex items-center space-x-1.5 text-xs font-mono font-semibold text-[#4FA8E0] hover:underline self-start sm:self-auto"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>open_archive()</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Questions List / File Rows */}
      {todayQuestions.length === 0 ? (
        <div className="judge-card p-12 text-center space-y-4 max-w-lg mx-auto">
          <AlertCircle className="w-8 h-8 text-[#D29922] mx-auto" />
          <div className="font-mono text-sm font-bold text-[#E6EDF3]">// NO_QUESTIONS_POSTED_TODAY</div>
          <p className="text-xs text-[#7D8590] font-mono leading-relaxed">
            Instructors have not posted questions for today yet. Explore previous problems in the archive.
          </p>
          <button
            onClick={() => navigate('/archive')}
            className="px-4 py-2 rounded bg-[#161B22] border border-[#21262D] hover:border-[#30363D] text-xs font-mono text-[#4FA8E0] font-bold transition-colors"
          >
            [OPEN_ARCHIVE]
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {todayQuestions.map((q, idx) => {
            const passed = isQuestionPassed(q.id);
            const borderCol = q.difficulty === 'easy' ? 'border-l-[#4FA8E0]' : q.difficulty === 'medium' ? 'border-l-[#C87DE8]' : 'border-l-[#E0704F]';
            
            return (
              <div
                key={q.id}
                onClick={() => navigate(`/solve/${q.id}`)}
                className={`judge-card p-5 border-l-4 ${borderCol} cursor-pointer transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono text-[#7D8590]">
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                    {getDifficultyLabel(q.difficulty)}
                    {passed && (
                      <span className="text-[11px] font-mono font-bold text-[#3FB950] flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>[AC]</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-mono font-bold text-[#E6EDF3] group-hover:text-[#3FB950] transition-colors">
                    {q.title}
                  </h3>
                  
                  <p className="text-xs text-[#7D8590] line-clamp-1 font-mono">
                    {q.description.replace(/[#*`]/g, '')}
                  </p>
                </div>

                <div className="flex items-center space-x-4 shrink-0 font-mono text-xs text-[#7D8590]">
                  <span className="flex items-center space-x-1">
                    <BookOpen className="w-3.5 h-3.5 text-[#7D8590]" />
                    <span>{q.test_cases?.length || 0} cases</span>
                  </span>
                  <span className="text-[#3FB950] font-bold group-hover:translate-x-0.5 transition-transform flex items-center space-x-1">
                    <span>{passed ? '[REVIEW]' : '[SOLVE]'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Callout - Terminal box */}
      <div className="judge-card p-4 border border-[#21262D] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs font-mono text-[#7D8590]">
          <span className="text-[#E6EDF3] font-bold">// PAST_PRACTICE:</span> Access historical daily problem sets anytime from the archive repository.
        </div>
        <button
          onClick={() => navigate('/archive')}
          className="px-3 py-1.5 rounded bg-[#161B22] border border-[#21262D] hover:border-[#30363D] text-xs font-mono text-[#E6EDF3] shrink-0"
        >
          browse_archive()
        </button>
      </div>

    </div>
  );
}
