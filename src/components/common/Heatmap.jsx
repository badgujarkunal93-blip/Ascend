import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Heatmap() {
  const { userSubmissions, profile } = useAuth();

  // Generate array of last 28 days (4 weeks x 7 days)
  const days = [];
  const today = new Date();
  
  // Create dates set for passed submissions
  const passedDateSet = new Set(
    (userSubmissions || [])
      .filter(s => s.verdict === 'pass')
      .map(s => s.submitted_at ? s.submitted_at.split('T')[0] : null)
      .filter(Boolean)
  );

  // If in demo mode with streak > 0, mock recent days passed
  if (passedDateSet.size === 0 && profile?.streak_count > 0) {
    for (let i = 0; i < profile.streak_count; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      passedDateSet.add(d.toISOString().split('T')[0]);
    }
  }

  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const isPassed = passedDateSet.has(dateStr);
    days.push({
      dateStr,
      isPassed,
      dayNum: d.getDate(),
      isToday: i === 0
    });
  }

  return (
    <div className="flex items-center space-x-3 px-3.5 py-1.5 rounded-md bg-[#12161B] border border-[#21262D]">
      <div className="flex flex-col text-left">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#7D8590]">
          Activity Grid
        </span>
        <span className="text-xs font-mono font-bold text-[#3FB950]">
          {profile?.streak_count || 0}D STREAK
        </span>
      </div>

      {/* 28-day Heatmap Squares (4 rows x 7 cols or 7 cols x 4 rows) */}
      <div className="grid grid-rows-2 grid-flow-col gap-1">
        {days.map((day, idx) => (
          <div
            key={idx}
            title={`${day.dateStr}: ${day.isPassed ? 'Solved' : 'No pass'}`}
            className={`w-2.5 h-2.5 rounded-[2px] transition-colors ${
              day.isPassed
                ? 'bg-[#3FB950] border border-[#3FB950]'
                : day.isToday
                ? 'bg-[#161B22] border border-[#D29922]'
                : 'bg-[#161B22] border border-[#21262D]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
