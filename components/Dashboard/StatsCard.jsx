"use client";

export default function StatsCard({ label, value, icon: Icon, subtext }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-slate-500">{label}</h3>
          <div className="text-3xl font-bold text-slate-900 mt-2">{value}</div>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl">
           <Icon className="w-5 h-5 text-[var(--color-primary)]" />
        </div>
      </div>
      {subtext && (
        <p className="text-xs text-slate-400 font-medium">
          {subtext}
        </p>
      )}
    </div>
  );
}
