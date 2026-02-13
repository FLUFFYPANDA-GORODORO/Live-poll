"use client";

import { useMemo } from "react";

export default function VotesBarChart({ polls }) {
  const chartData = useMemo(() => {
    // Top 5 polls by vote count
    const data = polls
      .map(p => ({
        title: p.title,
        votes: p.voteCounts ? Object.values(p.voteCounts).reduce((a, b) => a + b, 0) : 0
      }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 5);
      
    const maxVotes = Math.max(...data.map(d => d.votes), 1);
    return { data, maxVotes };
  }, [polls]);

  if (chartData.data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        No voting data available
      </div>
    );
  }

  return (
    <div className="h-64 flex flex-col justify-end gap-4">
      <div className="flex-1 flex items-end justify-between gap-4 px-2">
        {chartData.data.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
            <div className="text-xs font-bold text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.votes}
            </div>
            <div className="w-full bg-slate-100 rounded-t-lg relative flex items-end h-40 overflow-hidden">
               <div 
                  className="w-full bg-[var(--color-primary)] opacity-80 group-hover:opacity-100 transition-all duration-500 rounded-t-lg"
                  style={{ height: `${(item.votes / chartData.maxVotes) * 100}%` }}
               />
            </div>
            <div className="text-xs text-slate-600 font-medium truncate w-20 text-center" title={item.title}>
              {item.title || "Untitled"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
