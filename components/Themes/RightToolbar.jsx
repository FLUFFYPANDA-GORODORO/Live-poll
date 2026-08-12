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
    <aside className="my-3 mr-3 bg-white border border-slate-200/90 rounded-md shadow-md flex flex-col items-center py-3 px-1.5 space-y-1.5 shrink-0 z-20 self-start w-[80px]">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeRightTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveRightTab(isActive ? null : tab.id)}
            className={`w-full py-2 px-1 rounded-md flex flex-col items-center justify-center transition-all cursor-pointer gap-1 ${
              isActive
                ? "bg-slate-950 text-white font-bold shadow-xs"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 font-medium"
            }`}
            title={tab.label}
          >
            <IconComponent className="w-4 h-4 stroke-[1.8]" />
            <span className="text-[10px] leading-none text-center truncate max-w-full">
              {tab.label}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
