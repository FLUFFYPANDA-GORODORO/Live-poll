"use client";

import { Sparkles, Settings, Palette, LayoutTemplate, Music } from "lucide-react";

export default function RightToolbar({ activeRightTab, setActiveRightTab }) {
  return (
    <aside className="my-3 mr-3 bg-white border border-slate-200/90 rounded-2xl shadow-lg flex flex-col items-center py-3 px-2 space-y-2 shrink-0 z-20 self-start">
      {/* Content (Edit) Icon */}
      <button
        type="button"
        onClick={() => setActiveRightTab(activeRightTab === "content" ? null : "content")}
        className={`w-10 h-10 rounded-md flex items-center justify-center transition-all cursor-pointer ${
          activeRightTab === "content"
            ? "bg-indigo-100/90 text-[#6366F1]"
            : "text-slate-600 hover:bg-slate-100"
        }`}
        title="Edit Content"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Theme Icon */}
      <button
        type="button"
        onClick={() => setActiveRightTab(activeRightTab === "theme" ? null : "theme")}
        className={`w-10 h-10 rounded-md flex items-center justify-center transition-all cursor-pointer ${
          activeRightTab === "theme"
            ? "bg-indigo-100/90 text-[#6366F1]"
            : "text-slate-600 hover:bg-slate-100"
        }`}
        title="Themes"
      >
        <Palette className="w-5 h-5" />
      </button>

      {/* Templates Icon */}
      <button
        type="button"
        onClick={() => setActiveRightTab(activeRightTab === "template" ? null : "template")}
        className={`w-10 h-10 rounded-md flex items-center justify-center transition-all cursor-pointer ${
          activeRightTab === "template"
            ? "bg-indigo-100/90 text-[#6366F1]"
            : "text-slate-600 hover:bg-slate-100"
        }`}
        title="Templates"
      >
        <LayoutTemplate className="w-5 h-5" />
      </button>

      {/* Audio / Music Icon */}
      <button
        type="button"
        onClick={() => setActiveRightTab(activeRightTab === "audio" ? null : "audio")}
        className={`w-10 h-10 rounded-md flex items-center justify-center transition-all cursor-pointer ${
          activeRightTab === "audio"
            ? "bg-indigo-100/90 text-[#6366F1]"
            : "text-slate-600 hover:bg-slate-100"
        }`}
        title="Audio & Soundtracks"
      >
        <Music className="w-5 h-5" />
      </button>
    </aside>
  );
}
