"use client";

import { useMemo } from "react";

export default function PollsDistribution({ polls }) {
  const stats = useMemo(() => {
    const s = { active: 0, draft: 0, ended: 0 };
    polls.forEach(p => {
      const status = p.status || "draft";
      if (s[status] !== undefined) s[status]++;
    });
    return s;
  }, [polls]);

  const total = polls.length;

  if (total === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
        No polls created
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Active */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-slate-700">Active / Live</span>
          <span className="font-bold text-slate-900">{stats.active}</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 rounded-full" 
            style={{ width: `${(stats.active / total) * 100}%` }} 
          />
        </div>
      </div>

      {/* Draft */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-slate-700">Drafts</span>
          <span className="font-bold text-slate-900">{stats.draft}</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-slate-400 rounded-full" 
            style={{ width: `${(stats.draft / total) * 100}%` }} 
          />
        </div>
      </div>

      {/* Ended */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-slate-700">Ended</span>
          <span className="font-bold text-slate-900">{stats.ended}</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-orange-400 rounded-full" 
            style={{ width: `${(stats.ended / total) * 100}%` }} 
          />
        </div>
      </div>
    </div>
  );
}
