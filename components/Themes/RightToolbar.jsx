"use client";

import { Pencil, Palette, Sparkles, Music } from "lucide-react";

export default function RightToolbar({ activeRightTab, setActiveRightTab }) {
  const tabs = [
    {
      id: "content",
      label: "Content",
      icon: Pencil,
    },
    {
      id: "theme",
      label: "Design",
      icon: Palette,
    },
    {
      id: "template",
      label: "Templates",
      icon: Sparkles,
    },
    {
      id: "audio",
      label: "Audio",
      icon: Music,
    },
  ];

  return (
    <aside className="my-3 mr-3 bg-white border border-slate-200/90 rounded-2xl shadow-lg flex flex-col items-center py-3 px-2 space-y-1.5 shrink-0 z-20 self-start w-[72px]">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeRightTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveRightTab(isActive ? null : tab.id)}
            className={`w-14 py-2.5 px-1 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer gap-1 ${
              isActive
                ? "bg-purple-100 text-[#7B2FF2] font-semibold"
                : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium"
            }`}
            title={tab.label}
          >
            <IconComponent className="w-5 h-5 stroke-[1.8]" />
            <span className="text-[11px] leading-tight text-center">
              {tab.label}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
