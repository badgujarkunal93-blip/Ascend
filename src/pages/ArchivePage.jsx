import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, Search, Check, ChevronRight, BookOpen, Terminal } from 'lucide-react';

export default function ArchivePage() {
  const { questionsList, userSubmissions } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  const filteredQuestions = questionsList.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          q.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiff = difficultyFilter === 'all' || q.difficulty.toLowerCase() === difficultyFilter.toLowerCase();
    return matchesSearch && matchesDiff;
  });

  const groupedByDate = filteredQuestions.reduce((acc, q) => {
    const dateStr = q.posted_date || 'Unknown';
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(q);
    return acc;
  }, {});

  const datesSorted = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

  const isQuestionPassed = (questionId) => {
    return userSubmissions.some(s => s.question_id === questionId && s.verdict === 'pass');
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-mono">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-[#7D8590]">// ARCHIVE_REPOSITORY</div>
          <h1 className="text-2xl font-bold text-[#E6EDF3] tracking-tight">
            Problem Archive & History
          </h1>
          <p className="text-xs text-[#7D8590] mt-1 font-sans">
            Access past daily problems. No content lockouts.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#7D8590]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="filter_title..."
              className="w-full bg-[#12161B] border border-[#21262D] rounded px-3 py-1.5 pl-9 text-xs text-[#E6EDF3] placeholder-[#7D8590] focus:outline-none focus:border-[#3FB950] transition-colors"
            />
          </div>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="w-full sm:w-auto bg-[#12161B] border border-[#21262D] rounded px-3 py-1.5 text-xs text-[#E6EDF3] focus:outline-none focus:border-[#3FB950] transition-colors cursor-pointer"
          >
            <option value="all">ALL_RATINGS</option>
            <option value="easy">● Easy</option>
            <option value="medium">● Medium</option>
            <option value="hard">● Hard</option>
          </select>
        </div>
      </div>

      {/* Date Groups */}
      {datesSorted.length === 0 ? (
        <div className="judge-card p-12 text-center space-y-2">
          <p className="text-[#7D8590] text-xs">// NO_MATCHING_PROBLEMS</p>
          <button
            onClick={() => { setSearchTerm(''); setDifficultyFilter('all'); }}
            className="text-xs text-[#3FB950] underline font-bold"
          >
            [reset_filters]
          </button>
        </div>
      ) : (
        datesSorted.map(dateStr => {
          const questionsForDate = groupedByDate[dateStr];

          return (
            <div key={dateStr} className="space-y-3">
              <div className="flex items-center space-x-2 pb-1 border-b border-[#21262D] text-xs text-[#7D8590]">
                <Calendar className="w-3.5 h-3.5 text-[#3FB950]" />
                <span className="font-bold text-[#E6EDF3]">{dateStr}</span>
                <span>({questionsForDate.length} problems)</span>
              </div>

              <div className="space-y-2">
                {questionsForDate.map((q, idx) => {
                  const passed = isQuestionPassed(q.id);
                  const borderCol = q.difficulty === 'easy' ? 'border-l-[#4FA8E0]' : q.difficulty === 'medium' ? 'border-l-[#C87DE8]' : 'border-l-[#E0704F]';

                  return (
                    <div
                      key={q.id}
                      onClick={() => navigate(`/solve/${q.id}`)}
                      className={`judge-card p-4 border-l-4 ${borderCol} cursor-pointer transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-[#7D8590]">#{String(idx + 1).padStart(2, '0')}</span>
                          {getDifficultyLabel(q.difficulty)}
                          {passed && (
                            <span className="text-[11px] font-bold text-[#3FB950] flex items-center space-x-1">
                              <Check className="w-3 h-3" />
                              <span>[AC]</span>
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-[#E6EDF3] group-hover:text-[#3FB950] transition-colors">
                          {q.title}
                        </h4>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-[#7D8590] shrink-0">
                        <span className="flex items-center space-x-1">
                          <BookOpen className="w-3.5 h-3.5 text-[#7D8590]" />
                          <span>{q.test_cases?.length || 0} cases</span>
                        </span>
                        <span className="text-[#3FB950] font-bold flex items-center space-x-1">
                          <span>[SOLVE]</span>
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

    </div>
  );
}
