"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, Play, Share2, Edit2, RotateCcw, Trash2, Calendar, Copy, Download, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { parseTheme } from "@/lib/themeHelper";

export default function PollCard({ poll, onDelete, onRestart, onClone, onShare, onExport }) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const createdDate = poll.createdAt?.toLocaleDateString?.() || "—";
  const { cleanTitle, theme } = parseTheme(poll.title || "");

  const handleExportCsv = () => {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5065").replace(/\/$/, "");
    const link = document.createElement("a");
    link.href = `${apiBase}/api/polls/${poll.id}/export`;
    link.setAttribute("download", `poll-${poll.id}-export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isSynergy = theme === "synergy_sphere";
  const isMasterclass = theme === "masterclass";

  const getStatusColor = (status) => {
    switch (status) {
      case "live":
        return isSynergy
          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
          : isMasterclass
          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
          : "bg-green-100 text-green-700";
      case "ended":
        return isSynergy
          ? "bg-stone-800 text-stone-400 border border-stone-700/50"
          : isMasterclass
          ? "bg-slate-800 text-slate-400 border border-slate-700/50"
          : "bg-slate-100 text-slate-500";
      default:
        return isSynergy
          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
          : isMasterclass
          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
          : "bg-amber-100 text-amber-700";
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // Theme-specific styles
  let cardClass = "bg-white border-slate-200 hover:shadow-lg text-slate-900";
  let titleClass = "text-slate-900";
  let dateClass = "text-slate-400";
  let menuBtnClass = "text-slate-400 hover:bg-slate-100";
  let dropdownClass = "bg-white border-slate-100 text-slate-700";
  let dropdownBtnClass = "text-slate-700 hover:bg-slate-50";

  if (isSynergy) {
    cardClass = "bg-[url('/SynegrysphereBG.png')] bg-cover bg-center border-rose-950/40 text-stone-100 hover:shadow-rose-950/40 hover:shadow-2xl hover:border-rose-500/40";
    titleClass = "text-white group-hover:text-rose-200 drop-shadow-sm";
    dateClass = "text-stone-400";
    menuBtnClass = "text-stone-300 hover:bg-white/10";
    dropdownClass = "bg-stone-950 border-stone-800 text-stone-200";
    dropdownBtnClass = "text-stone-300 hover:bg-stone-900";
  } else if (isMasterclass) {
    cardClass = "bg-[url('/MasterClassNewBg.png')] bg-cover bg-center border-emerald-950/40 text-emerald-100 hover:shadow-emerald-950/40 hover:shadow-2xl hover:border-emerald-500/40";
    titleClass = "text-white group-hover:text-emerald-200 drop-shadow-sm";
    dateClass = "text-slate-400";
    menuBtnClass = "text-slate-300 hover:bg-white/10";
    dropdownClass = "bg-slate-950 border-slate-800 text-slate-200";
    dropdownBtnClass = "text-stone-300 hover:bg-stone-900";
  }

  return (
    <div className={`rounded-2xl border p-4 transition-all group relative min-h-[140px] flex flex-col justify-between ${cardClass}`}>
      
      {/* Header */}
      <div className="flex justify-between items-start w-full">
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className={`font-bold text-base line-clamp-1 transition-colors ${titleClass}`} title={cleanTitle}>
              {cleanTitle || "Untitled Poll"}
            </h3>
            <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${getStatusColor(poll.status)}`}>
              {poll.status || "Draft"}
            </span>
          </div>
        </div>
        
        {/* Action Menu Information */}
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setShowMenu(!showMenu)}
                className={`p-2 -mr-2 rounded-lg transition-colors ${menuBtnClass}`}
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
                <div className={`absolute right-0 top-full mt-1 w-48 rounded-xl shadow-xl border z-20 py-1 animation-fade-in origin-top-right ${dropdownClass}`}>
                    <button 
                         onClick={() => { setShowMenu(false); router.push(`/present/${poll.id}`); }}
                         className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 ${dropdownBtnClass}`}
                    >
                         <Play className="w-4 h-4 text-emerald-500" /> Present
                    </button>
                    <button 
                         onClick={() => { setShowMenu(false); onShare(poll); }}
                         className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 ${dropdownBtnClass}`}
                    >
                         <Share2 className="w-4 h-4 text-blue-500" /> Share
                    </button>
                    {poll.status === 'draft' && (
                         <button 
                            onClick={() => { setShowMenu(false); router.push(`/dashboard/edit/${poll.id}`); }}
                            className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 ${dropdownBtnClass}`}
                        >
                            <Edit2 className="w-4 h-4 text-slate-400" /> Edit
                        </button>
                    )}
                    {/* <button 
                         onClick={() => { setShowMenu(false); onRestart(poll); }}
                         className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 ${dropdownBtnClass}`}
                    >
                         <RotateCcw className="w-4 h-4 text-orange-500" /> Restart
                    </button> */}
                    <button 
                         onClick={() => { setShowMenu(false); onClone(poll); }}
                         className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 ${dropdownBtnClass}`}
                    >
                         <Copy className="w-4 h-4 text-blue-500" /> Clone
                    </button>
                    <div className={`h-px my-1 ${isSynergy || isMasterclass ? "bg-stone-800" : "bg-slate-100"}`} />
                    <button 
                         onClick={() => { setShowMenu(false); onExport(poll); }}
                         className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 ${dropdownBtnClass}`}
                    >
                         <Download className="w-4 h-4 text-emerald-500" /> Export JSON
                    </button>
                    <button 
                         onClick={() => { setShowMenu(false); handleExportCsv(); }}
                         className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 ${dropdownBtnClass}`}
                    >
                         <Download className="w-4 h-4 text-teal-500" /> Export CSV
                    </button>
                    <div className={`h-px my-1 ${isSynergy || isMasterclass ? "bg-stone-800" : "bg-slate-100"}`} />
                    <button 
                         onClick={() => { setShowMenu(false); onDelete(poll.id); }}
                         className={`w-full text-left px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10 flex items-center gap-2`}
                    >
                         <Trash2 className="w-4 h-4" /> Delete
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* Decorative center element to keep card size and show theme graphic */}
      <div className={`h-14 flex items-center justify-center mt-2 w-full rounded-xl border ${
        isSynergy 
          ? "bg-black/40 backdrop-blur-sm border-rose-500/10" 
          : isMasterclass 
          ? "bg-black/40 backdrop-blur-sm border-emerald-500/10" 
          : "bg-slate-50 border-slate-100"
      }`}>
        {isSynergy && (
          <div className="text-center">
            <span className="text-[10px] uppercase tracking-widest font-black text-rose-400 drop-shadow-sm">Synergy Sphere</span>
            <p className="text-[8px] text-stone-400 mt-0.5">Executive Presentation</p>
          </div>
        )}
        {isMasterclass && (
          <div className="text-center">
            <span className="text-[10px] uppercase tracking-widest font-black text-emerald-400 drop-shadow-sm">Masterclass</span>
            <p className="text-[8px] text-slate-400 mt-0.5">Executive Presentation</p>
          </div>
        )}
        {!isSynergy && !isMasterclass && (
          <div className="text-center">
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">Standard Poll</span>
            <p className="text-[8px] text-slate-550 mt-0.5">General Audience</p>
          </div>
        )}
      </div>

    </div>
  );
}
