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
  MoreVertical,
  Play,
  Share2,
  Edit,
  Copy,
  Download,
  Trash2,
  RotateCcw,
  Sparkles,
  ChevronDown,
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
            className="px-4 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#5558DD] flex items-center gap-2 transition-colors"
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
  const [sortBy, setSortBy] = useState("recently_edited");
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

  const templatePresets = [
    { id: "blank", title: "Blank", isBlank: true },
    { id: "t1", title: "100 Bad Ideas" },
    { id: "t2", title: "I Know // I Wonder" },
    { id: "t3", title: "2 Truths 1 Lie" },
    { id: "t4", title: "Team Catchphrase" },
    { id: "t5", title: "Back to Work Icebreakers" },
    { id: "t6", title: "Let's Talk About AI" },
  ];

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

  const getUserInitial = () => {
    if (user?.displayName) return user.displayName[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return "U";
  };

  const getUserName = () => {
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split("@")[0];
    return "Gaurav Patil";
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
    <div className="space-y-8 pb-12">
      {/* Top: Start from a Template */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Start from a template</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3.5">
          {templatePresets.map((t) => (
            <div key={t.id} onClick={handleCreateNew} className="group cursor-pointer">
              <div className="h-24 rounded-xl border border-slate-200 bg-white group-hover:border-[#6366F1] group-hover:shadow-md transition-all flex items-center justify-center p-2">
                {t.isBlank ? (
                  <Plus className="w-6 h-6 text-slate-400 group-hover:text-[#6366F1]" />
                ) : (
                  <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-slate-400" />
                  </div>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-700 mt-2 text-center truncate group-hover:text-[#6366F1]">
                {t.title}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Section: My Presentations */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-slate-900">My presentations</h1>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#5558DD] text-white px-4 py-2 rounded-lg font-semibold text-sm shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New presentation
            </button>
            <button
              onClick={handleImportPoll}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              Import
            </button>
          </div>
        </div>

        {/* Presentations Table View */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3.5 px-6 font-semibold">Name</th>
                <th className="py-3.5 px-4 font-semibold">Access code</th>
                <th className="py-3.5 px-4 font-semibold">Created by</th>
                <th className="py-3.5 px-4 font-semibold">Last edited</th>
                <th className="py-3.5 px-4 font-semibold">Created</th>
                <th className="py-3.5 px-4 text-right pr-6 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {polls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                    No presentations found. Create or import your first presentation!
                  </td>
                </tr>
              ) : (
                polls.map((poll) => (
                  <tr key={poll.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Name column */}
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-7 bg-slate-200 rounded-md shrink-0 border border-slate-200" />
                        <span 
                          onClick={() => router.push(`/present/${poll.id}`)}
                          className="hover:text-[#6366F1] cursor-pointer truncate max-w-xs"
                        >
                          {poll.title || "Untitled Presentation"}
                        </span>
                      </div>
                    </td>

                    {/* Access code */}
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-600 text-xs uppercase">
                      {poll.id}
                    </td>

                    {/* Created by */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 text-xs font-semibold flex items-center justify-center">
                          {getUserInitial()}
                        </div>
                        <span className="text-xs text-slate-700 font-medium">{getUserName()}</span>
                      </div>
                    </td>

                    {/* Last edited */}
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {formatRelativeDate(poll.updatedAt || poll.createdAt)}
                    </td>

                    {/* Created */}
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {formatRelativeDate(poll.createdAt)}
                    </td>

                    {/* Action menu */}
                    <td className="py-3.5 px-4 text-right pr-6 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === poll.id ? null : poll.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {openMenuId === poll.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-6 top-10 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 text-left text-xs font-medium text-slate-700 animate-fade-in"
                        >
                          <button
                            onClick={() => { setOpenMenuId(null); router.push(`/present/${poll.id}`); }}
                            className="flex items-center gap-2.5 px-4 py-2 w-full hover:bg-slate-50 text-emerald-600 font-semibold"
                          >
                            <Play className="w-3.5 h-3.5" /> Present
                          </button>
                          <button
                            onClick={() => { setOpenMenuId(null); setShareModal(poll); }}
                            className="flex items-center gap-2.5 px-4 py-2 w-full hover:bg-slate-50 text-slate-700"
                          >
                            <Share2 className="w-3.5 h-3.5 text-slate-400" /> Share
                          </button>
                          <button
                            onClick={() => { setOpenMenuId(null); router.push(`/home/edit/${poll.id}`); }}
                            className="flex items-center gap-2.5 px-4 py-2 w-full hover:bg-slate-50 text-slate-700"
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-400" /> Edit
                          </button>
                          <button
                            onClick={() => { setOpenMenuId(null); handleClonePoll(poll); }}
                            className="flex items-center gap-2.5 px-4 py-2 w-full hover:bg-slate-50 text-slate-700"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-400" /> Clone
                          </button>
                          <div className="border-t border-slate-100 my-1" />
                          <button
                            onClick={() => { setOpenMenuId(null); handleExportPoll(poll); }}
                            className="flex items-center gap-2.5 px-4 py-2 w-full hover:bg-slate-50 text-slate-700"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-600" /> Export JSON
                          </button>
                          <div className="border-t border-slate-100 my-1" />
                          <button
                            onClick={() => { setOpenMenuId(null); handleDeletePoll(poll.id); }}
                            className="flex items-center gap-2.5 px-4 py-2 w-full hover:bg-red-50 text-red-600 font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Share Modal */}
      {shareModal && (
        <ShareModal poll={shareModal} onClose={() => setShareModal(null)} />
      )}
    </div>
  );
}
