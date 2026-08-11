"use client";

import { useEffect, useState, useRef } from "react";
import { usePollStore } from "@/lib/store/usePollStore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";
import { 
  Plus, 
  Upload, 
  MoreHorizontal,
  Play,
  Share2,
  Edit,
  Copy,
  Download,
  Trash2,
  RotateCcw,
  ArrowRight,
  X
} from "lucide-react";
import { parseTheme } from "@/lib/themeHelper";

// Share Modal Component
function ShareModal({ poll, onClose }) {
  const [copied, setCopied] = useState(false);
  const pollUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/poll/${poll.id}` 
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(pollUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Share Poll</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <QRCodeSVG value={pollUrl} size={180} />
          </div>
        </div>

        {/* Poll Code */}
        <div className="text-center mb-6">
          <p className="text-slate-500 text-sm mb-2">Poll Code</p>
          <p className="text-3xl font-bold text-[#6366F1] font-mono">{poll.id}</p>
        </div>

        {/* Link */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={pollUrl}
            readOnly
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#6366F1]/20"
          />
          <button 
            onClick={copyLink}
            className="px-4 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#5558DD] flex items-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyPresentationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const {
    polls,
    loading,
    fetchPolls,
    deletePoll,
    restartPoll,
    createPoll,
    fetchPollById
  } = usePollStore();

  const [openMenuId, setOpenMenuId] = useState(null);
  const [shareModal, setShareModal] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (user) fetchPolls(user.uid);
  }, [user, fetchPolls]);

  // Click outside to close actions dropdown menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Action Handlers
  const handleCreateNew = () => {
    router.push("/home/create");
  };

  const handleImportPoll = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const importData = JSON.parse(event.target.result);
          if (!importData || !Array.isArray(importData.questions)) {
            toast.error("Invalid JSON format. Must contain a 'questions' array.");
            return;
          }

          const cleanedQuestions = [];
          for (let i = 0; i < importData.questions.length; i++) {
            const q = importData.questions[i];
            if (!q.text || typeof q.text !== "string" || !q.text.trim()) {
              toast.error(`Question ${i + 1} is missing text`);
              return;
            }

            const isQWordCloud = q.type === "WordCloud" || q.type === 1 || String(q.type).toLowerCase() === "wordcloud" || !q.options || q.options.length === 0;

            if (isQWordCloud) {
              cleanedQuestions.push({
                text: q.text.trim(),
                type: "WordCloud",
                options: []
              });
            } else {
              if (!Array.isArray(q.options) || q.options.length < 2) {
                toast.error(`Question ${i + 1} needs at least 2 options`);
                return;
              }
              const validOptions = q.options
                .map(o => typeof o === "string" ? o.trim() : (o.text || "").trim())
                .filter(opt => opt !== "");

              if (validOptions.length < 2) {
                toast.error(`Question ${i + 1} needs at least 2 non-empty options`);
                return;
              }
              cleanedQuestions.push({
                text: q.text.trim(),
                type: "MultipleChoice",
                options: validOptions
              });
            }
          }

          const loadingToast = toast.loading("Importing poll...");
          const newPoll = await createPoll(
            importData.title?.trim() || "Imported Presentation",
            cleanedQuestions,
            importData.theme || "11111111-1111-1111-1111-111111111111"
          );

          await fetchPolls(user.uid);
          toast.dismiss(loadingToast);
          toast.success("Poll imported successfully!");

          if (newPoll && newPoll.id) {
            router.push(`/present/${newPoll.id}`);
          }
        } catch (err) {
          console.error("Error importing JSON:", err);
          toast.error("Failed to parse JSON file");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleDeletePoll = async (pollId) => {
    if (!confirm("Delete this presentation permanently?")) return;
    try {
      await deletePoll(pollId);
      toast.success("Presentation deleted");
    } catch (err) {
      toast.error("Failed to delete presentation");
    }
  };

  const handleClonePoll = async (poll) => {
    const loadingToast = toast.loading("Cloning presentation...");
    try {
      const fullPoll = await fetchPollById(poll.id);
      if (!fullPoll || !fullPoll.questions) {
        toast.dismiss(loadingToast);
        toast.error("Failed to load presentation details");
        return;
      }

      const { cleanTitle } = parseTheme(fullPoll.title || "");
      const clonedQuestions = fullPoll.questions.map((q) => ({
        text: q.text,
        type: q.type,
        options: q.options ? q.options.map((o) => (typeof o === "string" ? o : (o.text || ""))) : [],
      }));

      await createPoll(`${cleanTitle} (Copy)`, clonedQuestions, fullPoll.themeId || "11111111-1111-1111-1111-111111111111");
      await fetchPolls(user.uid);
      toast.dismiss(loadingToast);
      toast.success("Presentation cloned!");
    } catch (err) {
      console.error("Error cloning poll:", err);
      toast.dismiss(loadingToast);
      toast.error("Failed to clone presentation");
    }
  };

  const handleExportPoll = async (poll) => {
    const loadingToast = toast.loading("Exporting presentation...");
    try {
      const fullPoll = await fetchPollById(poll.id);
      if (!fullPoll || !fullPoll.questions) {
        toast.dismiss(loadingToast);
        toast.error("Failed to load details");
        return;
      }

      const exportData = {
        title: fullPoll.title,
        theme: fullPoll.theme || "11111111-1111-1111-1111-111111111111",
        questions: fullPoll.questions.map((q) => ({
          text: q.text,
          type: q.type,
          options: q.options ? q.options.map((o) => (typeof o === "string" ? o : (o.text || ""))) : [],
        })),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const { cleanTitle } = parseTheme(fullPoll.title || "");
      a.href = url;
      a.download = `${cleanTitle || "presentation"}-config.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.dismiss(loadingToast);
      toast.success("Exported successfully!");
    } catch (err) {
      console.error("Error exporting poll:", err);
      toast.dismiss(loadingToast);
      toast.error("Failed to export JSON");
    }
  };

  const formatRelativeDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "a day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Row with Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">My presentations</h1>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-[#7B2FF2] hover:bg-[#6a22e0] text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New presentation
          </button>
          <button
            onClick={handleImportPoll}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            Import
          </button>
        </div>
      </div>

      {/* Card Grid Layout for Projects */}
      {loading ? (
        <div className="grid grid-cols-5 gap-4.5 w-full">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-full h-[155px] rounded-xl bg-slate-100 animate-pulse"
            />
          ))}
        </div>
      ) : polls.length === 0 ? (
        <div className="py-16 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-white">
          <p className="text-slate-500 text-sm mb-3">
            No presentations found. Create or import your first presentation!
          </p>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 bg-[#7B2FF2] hover:bg-[#6a22e0] text-white px-5 py-2.5 rounded-xl font-semibold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create new presentation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-4.5 w-full">
          {(polls || []).map((poll) => {
            const themeBg = poll.theme;
            const cardBgStyle = themeBg?.backgroundType === "image" && themeBg?.backgroundValue
              ? { backgroundImage: `url("${themeBg.backgroundValue}")`, backgroundSize: "cover", backgroundPosition: "center" }
              : { backgroundColor: themeBg?.backgroundValue?.startsWith("#") ? themeBg.backgroundValue : "#0F172A" };

            return (
              <div
                key={poll.id}
                onClick={() => router.push(`/home/edit/${poll.id}`)}
                className="group w-full h-[155px] flex flex-col justify-between rounded-xl bg-white border border-slate-200/80 hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-1 relative"
              >
                {/* More Menu (Direct child of outer card so overflow-hidden doesn't clip the dropdown) */}
                <div className="absolute top-1.5 right-1.5 z-30" ref={openMenuId === poll.id ? menuRef : null}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === poll.id ? null : poll.id);
                    }}
                    className="p-1 rounded-md bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
                  >
                    {openMenuId === poll.id ? (
                      <X className="w-3.5 h-3.5" />
                    ) : (
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {openMenuId === poll.id && (
                    <div className="absolute right-0 top-7 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 min-w-[150px] text-xs font-medium text-slate-700">
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); router.push(`/present/${poll.id}`); }}
                        className="flex items-center gap-2 px-3.5 py-1.5 w-full hover:bg-slate-50 text-emerald-600 font-semibold cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" /> Present
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); setShareModal(poll); }}
                        className="flex items-center gap-2 px-3.5 py-1.5 w-full hover:bg-slate-50 text-slate-700 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5 text-slate-400" /> Share
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); router.push(`/home/edit/${poll.id}`); }}
                        className="flex items-center gap-2 px-3.5 py-1.5 w-full hover:bg-slate-50 text-slate-700 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-400" /> Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleClonePoll(poll); }}
                        className="flex items-center gap-2 px-3.5 py-1.5 w-full hover:bg-slate-50 text-slate-700 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-400" /> Clone
                      </button>
                      <div className="border-t border-slate-100 my-1" />
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleExportPoll(poll); }}
                        className="flex items-center gap-2 px-3.5 py-1.5 w-full hover:bg-slate-50 text-slate-700 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-600" /> Export JSON
                      </button>
                      <div className="border-t border-slate-100 my-1" />
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleDeletePoll(poll.id); }}
                        className="flex items-center gap-2 px-3.5 py-1.5 w-full hover:bg-red-50 text-red-600 font-medium cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Bar chart preview thumbnail */}
                <div
                  className="h-[105px] flex items-end justify-end gap-3 pl-12 pr-4 relative rounded-t-xl overflow-hidden shrink-0"
                  style={cardBgStyle}
                >
                  {/* Two wider bars touching bottom with headroom */}
                  <div className="w-16 bg-[#6366F1] rounded-t-md" style={{ height: "42px" }} />
                  <div className="w-16 bg-[#818CF8] rounded-t-md" style={{ height: "70px" }} />
                </div>

                {/* Compact Poll title + timestamp footer */}
                <div className="px-3 py-2 border-t border-slate-100 bg-white shrink-0 rounded-b-xl">
                  <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                    {poll.title || "Untitled"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-none">
                    Edited {formatRelativeDate(poll.updatedAt || poll.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share Modal */}
      {shareModal && (
        <ShareModal poll={shareModal} onClose={() => setShareModal(null)} />
      )}
    </div>
  );
}
