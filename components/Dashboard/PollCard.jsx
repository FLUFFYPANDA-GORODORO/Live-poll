"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, Play, Share2, Edit2, RotateCcw, Trash2, Calendar, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PollCard({ poll, onDelete, onRestart, onShare }) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const totalVotes = poll.voteCounts ? Object.values(poll.voteCounts).reduce((a, b) => a + b, 0) : 0;
  const questionCount = poll.questions?.length || 0;
  const createdDate = poll.createdAt?.toLocaleDateString?.() || "—";
  
  const getStatusColor = (status) => {
    switch (status) {
      case "live": return "bg-green-100 text-green-700";
      case "ended": return "bg-slate-100 text-slate-500";
      default: return "bg-amber-100 text-amber-700";
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-all group relative">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${getStatusColor(poll.status)}`}>
              {poll.status || "Draft"}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
               <Calendar className="w-3 h-3" />
               {createdDate}
            </span>
          </div>
          <h3 className="font-bold text-lg text-slate-900 line-clamp-1" title={poll.title}>
            {poll.title || "Untitled Poll"}
          </h3>
        </div>
        
        {/* Action Menu Information */}
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 -mr-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
            >
                <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-10 py-1 animation-fade-in origin-top-right">
                    <button 
                         onClick={() => { setShowMenu(false); router.push(`/present/${poll.id}`); }}
                         className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                        <Play className="w-4 h-4 text-[var(--color-primary)]" /> Present
                    </button>
                    <button 
                         onClick={() => { setShowMenu(false); onShare(poll); }}
                         className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                        <Share2 className="w-4 h-4 text-blue-600" /> Share
                    </button>
                    {poll.status === 'draft' && (
                         <button 
                            onClick={() => { setShowMenu(false); router.push(`/dashboard/edit/${poll.id}`); }}
                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                            <Edit2 className="w-4 h-4 text-slate-600" /> Edit
                        </button>
                    )}
                    <button 
                         onClick={() => { setShowMenu(false); onRestart(poll); }}
                         className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4 text-orange-500" /> Restart
                    </button>
                    <div className="h-px bg-slate-100 my-1" />
                    <button 
                         onClick={() => { setShowMenu(false); onDelete(poll.id); }}
                         className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" /> Delete
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* Stats Mockup visuals */}
      <div className="grid grid-cols-2 gap-3 mb-4">
         <div className="bg-slate-50 rounded-xl p-3 text-center">
             <div className="text-xl font-bold text-[var(--color-primary)]">{questionCount}</div>
             <div className="text-[10px] uppercase font-bold text-slate-400">Questions</div>
         </div>
         <div className="bg-slate-50 rounded-xl p-3 text-center">
             <div className="text-xl font-bold text-[var(--color-secondary)] text-shadow-sm">{totalVotes}</div>
             <div className="text-[10px] uppercase font-bold text-slate-400">Total Votes</div>
         </div>
      </div>

      {/* Quick Action visual */}
      <div className="mt-2 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1">
             <BarChart3 className="w-4 h-4" />
             View Analytics
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-primary)] flex items-center gap-1">
              Open <span aria-hidden="true">&rarr;</span>
          </div>
      </div>

    </div>
  );
}
