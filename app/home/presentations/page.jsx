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
  X,
  LayoutGrid,
  List,
  Loader2
} from "lucide-react";
import { parseTheme, getThemeStyles } from "@/lib/themeHelper";

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
      <div className="bg-white rounded-md p-6 max-w-md w-full shadow-2xl animate-fade-in border border-slate-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">Share Poll</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-md transition-colors cursor-pointer">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs">
            <QRCodeSVG value={pollUrl} size={180} />
          </div>
        </div>

        {/* Poll Code */}
        <div className="text-center mb-6">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Poll Code</p>
          <p className="text-2xl font-extrabold text-slate-950 font-mono">{poll.id}</p>
        </div>

        {/* Link */}
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={pollUrl}
            readOnly
            className="flex-1 bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 font-mono outline-none"
          />
          <button 
            onClick={copyLink}
            className="px-4 py-2 bg-slate-950 text-white rounded-md hover:bg-slate-900 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
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
    useTemplate,
    fetchPollById
  } = usePollStore();

  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
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
              const validOptions = q.options.map((o) => typeof o === "string" ? o.trim() : (o.text || "").trim()).filter((opt) => opt !== "");
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
    setOpenMenuId(null);
    if (!confirm("Delete this presentation?")) return;
    try {
      await deletePoll(pollId);
      toast.success("Deleted!");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleClonePoll = async (poll) => {
    try {
      const loadingToast = toast.loading("Cloning presentation...");
      const fullPoll = await fetchPollById(poll.id);
      const clonedQuestions = (fullPoll.questions || []).map((q) => ({
        text: q.text,
        type: q.type,
        options: q.options ? q.options.map((o) => (typeof o === "string" ? o : (o.text || ""))) : [],
      }));

      const newPoll = await createPoll(
        `${fullPoll.title || "Presentation"} (Copy)`,
        clonedQuestions,
        fullPoll.theme?.id || fullPoll.theme || "11111111-1111-1111-1111-111111111111"
      );

      await fetchPolls(user.uid);
      toast.dismiss(loadingToast);
      toast.success("Cloned successfully!");
      if (newPoll?.id) {
        router.push(`/home/edit/${newPoll.id}`);
      }
    } catch (err) {
      console.error("Error cloning poll:", err);
      toast.error("Failed to clone presentation");
    }
  };

  const handleExportPoll = async (poll) => {
    try {
      const loadingToast = toast.loading("Preparing JSON export...");
      const fullPoll = await fetchPollById(poll.id);
      const exportData = {
        title: fullPoll.title || "Presentation",
        theme: fullPoll.theme?.id || fullPoll.theme || "11111111-1111-1111-1111-111111111111",
        questions: (fullPoll.questions || []).map((q) => ({
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
      {/* Top Header Row with Title, View Toggle & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-900">My presentations</h1>

          {/* Table / Grid Toggle Switch (Default: Grid) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "grid"
                  ? "bg-slate-950 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "table"
                  ? "bg-slate-950 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <List className="w-3.5 h-3.5" /> Table
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-white px-4 py-2 rounded-md font-bold text-xs shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New presentation
          </button>
          <button
            onClick={handleImportPoll}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 px-4 py-2 rounded-md font-bold text-xs transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-700" />
            Import
          </button>
        </div>
      </div>

      {/* Main Content Area: Grid vs Table */}
      {loading ? (
        <div className="grid grid-cols-5 gap-4.5 w-full">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-full h-[155px] rounded-md bg-slate-100 animate-pulse"
            />
          ))}
        </div>
      ) : polls.length === 0 ? (
        <div className="py-16 border-2 border-dashed border-slate-300 rounded-md text-center bg-white">
          <p className="text-slate-600 text-xs font-medium mb-3">
            No presentations found. Create or import your first presentation!
          </p>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-white px-5 py-2.5 rounded-md font-bold text-xs shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create new presentation
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW (With z-50 relative positioning on open menu card to fix z-index overlay bug) */
        <div className="grid grid-cols-5 gap-4.5 w-full">
          {(polls || []).map((poll) => {
            const themeStyles = getThemeStyles(poll.theme);
            const isImageTheme = poll.theme?.backgroundType === "image" && Boolean(poll.theme?.backgroundValue);
            const barColor1 = themeStyles.paletteColors[0] || "#6366F1";
            const barColor2 = themeStyles.paletteColors[1] || themeStyles.paletteColors[0] || "#818CF8";
            const isMenuOpen = openMenuId === poll.id;

            return (
              <div
                key={poll.id}
                onClick={() => router.push(`/home/edit/${poll.id}`)}
                className={`group w-full h-[155px] flex flex-col justify-between rounded-md bg-white border border-slate-300 cursor-pointer hover:border-slate-400 hover:shadow-md transition-all ${
                  isMenuOpen ? "z-50 relative" : "z-10 relative"
                }`}
              >
                {/* Options Action Menu (High z-index z-50) */}
                <div className="absolute top-1.5 right-1.5 z-40" ref={isMenuOpen ? menuRef : null}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(isMenuOpen ? null : poll.id);
                    }}
                    className="p-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer shadow-xs"
                  >
                    {isMenuOpen ? (
                      <X className="w-3.5 h-3.5" />
                    ) : (
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {isMenuOpen && (
                    <div className="absolute right-0 top-7 bg-white rounded-md shadow-2xl border border-slate-300 py-1.5 z-50 min-w-[160px] text-xs font-medium text-slate-800 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); router.push(`/present/${poll.id}`); }}
                        className="flex items-center gap-2 px-3.5 py-1.5 w-full hover:bg-slate-100 text-emerald-700 font-bold cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" /> Present
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); setShareModal(poll); }}
                        className="flex items-center gap-2 px-3.5 py-1.5 w-full hover:bg-slate-100 text-slate-800 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5 text-slate-500" /> Share
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); router.push(`/home/edit/${poll.id}`); }}
                        className="flex items-center gap-2 px-3.5 py-1.5 w-full hover:bg-slate-100 text-slate-800 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-500" /> Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleClonePoll(poll); }}
                        className="flex items-center gap-2 px-3.5 py-1.5 w-full hover:bg-slate-100 text-slate-800 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-500" /> Clone
                      </button>
                      <div className="border-t border-slate-200 my-1" />
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleExportPoll(poll); }}
                        className="flex items-center gap-2 px-3.5 py-1.5 w-full hover:bg-slate-100 text-slate-800 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-700" /> Export JSON
                      </button>
                      <div className="border-t border-slate-200 my-1" />
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleDeletePoll(poll.id); }}
                        className="flex items-center gap-2 px-3.5 py-1.5 w-full hover:bg-red-50 text-red-600 font-bold cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Thumbnail preview: renders background image or color + bars */}
                <div
                  className="h-[105px] flex items-end justify-end gap-2.5 pl-12 pr-4 relative rounded-t-md overflow-hidden shrink-0"
                  style={themeStyles.backgroundStyle}
                >
                  {/* Custom Theme Logo or default RapidPolls mark */}
                  {themeStyles.logoUrl ? (
                    <img
                      src={themeStyles.logoUrl}
                      alt="Theme Logo"
                      className="absolute top-2.5 left-3 max-h-4 max-w-[60px] object-contain drop-shadow-sm opacity-90 select-none z-10"
                    />
                  ) : (
                    <img
                      src="/RapidPolls.png"
                      alt="RapidPolls"
                      className="absolute top-2.5 left-3 h-3 w-auto object-contain opacity-50 select-none z-10 filter drop-shadow-sm"
                    />
                  )}

                  {/* Bars rendered ONLY if not an image background theme */}
                  {!isImageTheme && (
                    <>
                      <div
                        className="w-14 rounded-t-xs shadow-2xs transition-colors"
                        style={{ height: "42px", backgroundColor: barColor1 }}
                      />
                      <div
                        className="w-14 rounded-t-xs shadow-2xs transition-colors"
                        style={{ height: "70px", backgroundColor: barColor2 }}
                      />
                    </>
                  )}
                </div>

                {/* Compact Poll title + timestamp footer */}
                <div className="px-3 py-2 border-t border-slate-200 bg-white shrink-0 rounded-b-md">
                  <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                    {poll.title || "Untitled"}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-none font-medium">
                    Edited {formatRelativeDate(poll.updatedAt || poll.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW MODE (overflow-visible container + z-50 relative row positioning to prevent popover clipping) */
        <div className="bg-white border border-slate-300 rounded-md shadow-2xs relative">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4 rounded-tl-md">Presentation</th>
                <th className="py-3 px-4 text-center">Slides</th>
                <th className="py-3 px-4">Last Modified</th>
                <th className="py-3 px-4 text-right rounded-tr-md">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-800">
              {(polls || []).map((poll, idx) => {
                const isMenuOpen = openMenuId === poll.id;
                const themeStyles = getThemeStyles(poll.theme);
                const isNearBottom = idx >= Math.max(0, (polls || []).length - 2) && polls.length > 2;

                return (
                  <tr
                    key={poll.id}
                    onClick={() => router.push(`/home/edit/${poll.id}`)}
                    className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                      isMenuOpen ? "z-50 relative" : "z-10 relative"
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-8 rounded-md border border-slate-200 overflow-hidden flex items-center justify-center shrink-0"
                          style={themeStyles.backgroundStyle}
                        >
                          <span className="text-[9px] font-bold text-slate-900 truncate px-0.5">
                            {(poll.title || "P").substring(0, 3)}
                          </span>
                        </div>
                        <span className="font-bold text-slate-900 truncate max-w-xs">
                          {poll.title || "Untitled Presentation"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      {poll.questions?.length || 1}
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-medium">
                      {formatRelativeDate(poll.updatedAt || poll.createdAt)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2 relative">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); router.push(`/present/${poll.id}`); }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Play className="w-3 h-3" /> Present
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); router.push(`/home/edit/${poll.id}`); }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 rounded-md font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3 h-3" /> Edit
                        </button>

                        <div className="relative" ref={isMenuOpen ? menuRef : null}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(isMenuOpen ? null : poll.id);
                            }}
                            className="p-1 rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {isMenuOpen && (
                            <div className={`absolute right-0 bg-white rounded-md shadow-2xl border border-slate-300 py-1.5 z-50 min-w-[160px] text-xs font-medium text-slate-800 text-left animate-in fade-in duration-100 ${
                              isNearBottom ? "bottom-full mb-2" : "top-8"
                            }`}>
                              <button
                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); setShareModal(poll); }}
                                className="flex items-center gap-2 px-3.5 py-1.5 w-full hover:bg-slate-100 text-slate-800 cursor-pointer"
                              >
                                <Share2 className="w-3.5 h-3.5 text-slate-500" /> Share
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleClonePoll(poll); }}
                                className="flex items-center gap-2 px-3.5 py-1.5 w-full hover:bg-slate-100 text-slate-800 cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5 text-slate-500" /> Clone
                              </button>
                              <div className="border-t border-slate-200 my-1" />
                              <button
                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleExportPoll(poll); }}
                                className="flex items-center gap-2 px-3.5 py-1.5 w-full hover:bg-slate-100 text-slate-800 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5 text-emerald-700" /> Export JSON
                              </button>
                              <div className="border-t border-slate-200 my-1" />
                              <button
                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleDeletePoll(poll.id); }}
                                className="flex items-center gap-2 px-3.5 py-1.5 w-full hover:bg-red-50 text-red-600 font-bold cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Share Modal */}
      {shareModal && (
        <ShareModal poll={shareModal} onClose={() => setShareModal(null)} />
      )}
    </div>
  );
}
