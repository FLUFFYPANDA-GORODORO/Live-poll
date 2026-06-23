"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePollStore } from "@/lib/store/usePollStore";
import toast from "react-hot-toast";
import { parseTheme } from "@/lib/themeHelper";
import { QRCodeSVG } from "qrcode.react";
import {
  Plus,
  Trash2,
  Loader2,
  Sparkles,
  RefreshCw,
  Play,
  Eye,
  Calendar,
  MoreVertical,
  Share2,
  RotateCcw,
  X,
  Check,
  Copy,
  FolderOpen,
  CopyIcon,
  Layers,
} from "lucide-react";
import Link from "next/link";



// ── SHARE MODAL COMPONENT ──
function ShareModal({ poll, onClose }) {
  const [copied, setCopied] = useState(false);
  const clickTargetRef = useRef(null);
  const pollUrl = typeof window !== "undefined"
    ? `${window.location.origin}/bidding-poll/${poll.id}?theme=${poll.theme}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(pollUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMouseDown = (e) => {
    clickTargetRef.current = e.target;
  };

  const handleMouseUp = (e) => {
    if (clickTargetRef.current === e.currentTarget && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in"
        onMouseDown={e => e.stopPropagation()}
        onMouseUp={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Share Bidding Session</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex justify-center mb-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <QRCodeSVG value={pollUrl} size={180} />
          </div>
        </div>

        <div className="text-center mb-6">
          <p className="text-slate-500 text-sm mb-2">Session ID</p>
          <p className="text-3xl font-bold text-[var(--color-primary)] font-mono">{poll.id}</p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={pollUrl}
            readOnly
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
          />
          <button
            onClick={copyLink}
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] flex items-center gap-2 transition-colors font-semibold text-sm"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SessionModal({ isOpen, onClose, onSave, initialPoll = null }) {
  const [name, setName] = useState("");
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const clickTargetRef = useRef(null);

  const handleMouseDown = (e) => {
    clickTargetRef.current = e.target;
  };

  const handleMouseUp = (e) => {
    if (clickTargetRef.current === e.currentTarget && e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    if (initialPoll) {
      const { cleanTitle } = parseTheme(initialPoll.title || "");
      setName(cleanTitle);
      setQuestions(initialPoll.questions || []);
    } else {
      setName("");
      setQuestions([
        {
          text: "Sample Question 1",
          skills: [
            { name: "Communication & Presentation", category: "General" },
            { name: "Negotiation & Persuasion", category: "General" }
          ]
        }
      ]);
    }
  }, [initialPoll, isOpen]);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        text: "",
        skills: []
      }
    ]);
  };

  const handleRemoveQuestion = (qIdx) => {
    setQuestions(prev => prev.filter((_, idx) => idx !== qIdx));
  };

  const handleQuestionChange = (qIdx, field, val) => {
    setQuestions(prev => prev.map((q, idx) => idx === qIdx ? { ...q, [field]: val } : q));
  };

  const handleAddSkillToQuestion = (qIdx) => {
    setQuestions(prev => prev.map((q, idx) => {
      if (idx === qIdx) {
        return {
          ...q,
          skills: [...(q.skills || []), { name: "", category: "General" }]
        };
      }
      return q;
    }));
  };

  const handleRemoveSkillFromQuestion = (qIdx, sIdx) => {
    setQuestions(prev => prev.map((q, idx) => {
      if (idx === qIdx) {
        return {
          ...q,
          skills: q.skills.filter((_, sIndex) => sIndex !== sIdx)
        };
      }
      return q;
    }));
  };

  const handleSkillChange = (qIdx, sIdx, field, val) => {
    setQuestions(prev => prev.map((q, idx) => {
      if (idx === qIdx) {
        const updatedSkills = q.skills.map((s, sIndex) => {
          if (sIndex === sIdx) {
            return { ...s, [field]: val };
          }
          return s;
        });
        return { ...q, skills: updatedSkills };
      }
      return q;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a session name");
      return;
    }
    if (questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        toast.error(`Question ${i + 1} text cannot be empty`);
        return;
      }
    }

    setSaving(true);
    try {
      await onSave({
        id: initialPoll?.id,
        name: name.trim(),
        theme: "synergy_sphere", // default theme fallback
        questions: questions.map((q, qIdx) => ({
          id: q.id || null,
          text: q.text.trim(),
          index: qIdx,
          skills: q.skills.map((s, sIdx) => ({
            id: s.id || null,
            name: s.name.trim(),
            category: s.category || "General",
            index: sIdx
          })).filter(s => s.name !== "")
        }))
      });
      onClose();
    } catch (err) {
      // Error handled by caller
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div
        className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl animate-fade-in max-h-[90vh] flex flex-col"
        onMouseDown={e => e.stopPropagation()}
        onMouseUp={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <h2 className="text-xl font-bold text-slate-900 font-[Epilogue]">
            {initialPoll ? "Edit Bidding Session" : "Launch Bidding Session"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
              Session Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Executive Cohort Bidding"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-slate-500"
            />
          </div>

          <div className="border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Questions Builder ({questions.length})
              </label>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="text-xs text-[var(--color-primary)] font-bold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Question
              </button>
            </div>

            <div className="space-y-4 max-h-[380px] overflow-y-auto">
              {questions.map((q, qIdx) => (
                <div key={qIdx} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIdx)}
                    className="absolute top-3 right-3 p-1 text-slate-400 hover:text-red-500 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                        Question text
                      </label>
                      <input
                        type="text"
                        value={q.text}
                        onChange={(e) => handleQuestionChange(qIdx, "text", e.target.value)}
                        placeholder="e.g. BD & Sales Skill Bidding"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold focus:outline-none bg-white"
                      />
                    </div>
                  </div>

                  {/* Skills nested builder */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                        Skills / Options ({q.skills?.length || 0})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddSkillToQuestion(qIdx)}
                        className="text-[10px] text-emerald-600 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Add Skill
                      </button>
                    </div>

                    <div className="space-y-2">
                      {q.skills?.map((skill, sIdx) => (
                        <div key={sIdx} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-slate-100">
                          <input
                            type="text"
                            value={skill.name}
                            onChange={(e) => handleSkillChange(qIdx, sIdx, "name", e.target.value)}
                            placeholder="Skill/Option Name"
                            className="flex-1 px-2.5 py-1 rounded-md border border-slate-200 text-xs focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveSkillFromQuestion(qIdx, sIdx)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
              style={{
                background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))"
              }}
            >
              {saving ? "Saving..." : initialPoll ? "Save Changes" : "Launch Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── BIDDING POLL CARD COMPONENT ──
function BiddingPollCard({ poll, onDelete, onRestart, onShare, onEdit, onClone }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { cleanTitle, theme } = parseTheme(poll.title || "");
  const isSynergy = theme === "synergy_sphere";
  const createdDate = poll.createdAt ? new Date(poll.createdAt).toLocaleDateString() : "—";
  const isLive = poll.isBiddingActive;
  const isClosed = poll.biddingClosed;
  const questionsCount = poll.questions?.length || 0;

  const getStatusColor = () => {
    if (isLive) return "bg-green-100 text-green-700";
    if (isClosed) return "bg-slate-100 text-slate-500";
    return "bg-amber-100 text-amber-700";
  };

  const getStatusText = () => {
    if (isLive) return "Live";
    if (isClosed) return "Ended";
    return "Draft";
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-all group relative flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 pr-4 min-w-0">
            <h3 className="font-bold text-lg text-slate-900 truncate mb-1" title={cleanTitle}>
              {cleanTitle || "Untitled Session"}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${getStatusColor()}`}>
                {getStatusText()}
              </span>
              {isSynergy ? (
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  SynergySphere
                </span>
              ) : (
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Masterclass
                </span>
              )}
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 -mr-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-10 py-1 animation-fade-in origin-top-right">
                <Link
                  href={`/bidding-present/${poll.id}?theme=${theme}&cohort=HR`}
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50/50 flex items-center gap-2"
                  onClick={() => setShowMenu(false)}
                >
                  <Play className="w-4 h-4 text-emerald-600" /> Present HR Run
                </Link>
                <Link
                  href={`/bidding-present/${poll.id}?theme=${theme}&cohort=ACADEMIA`}
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50/50 flex items-center gap-2"
                  onClick={() => setShowMenu(false)}
                >
                  <Play className="w-4 h-4 text-indigo-600" /> Present Academia Run
                </Link>
                <Link
                  href={`/bidding-poll/${poll.id}?theme=${theme}`}
                  target="_blank"
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  onClick={() => setShowMenu(false)}
                >
                  <Eye className="w-4 h-4 text-emerald-600" /> Participant View
                </Link>
                <button
                  onClick={() => { setShowMenu(false); onEdit(poll); }}
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Layers className="w-4 h-4 text-indigo-600" /> Manage Questions
                </button>
                <button
                  onClick={() => { setShowMenu(false); onClone(poll.id); }}
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <CopyIcon className="w-4 h-4 text-purple-600" /> Clone config
                </button>
                <button
                  onClick={() => { setShowMenu(false); onShare(poll); }}
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4 text-blue-600" /> Share
                </button>
                <button
                  onClick={() => { setShowMenu(false); onRestart(poll); }}
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4 text-orange-500" /> Restart Run
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  onClick={() => { setShowMenu(false); onDelete(poll.id); }}
                  className="w-full text-left px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Run Progress Tags */}
        <div className="mt-3 border-t border-slate-100 pt-3 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-500">HR Cohort Run</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isLive && poll.currentCohort?.toUpperCase() === "HR" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
            }`}>
              {isLive && poll.currentCohort?.toUpperCase() === "HR" ? "In Progress" : "Standby"}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-500">Academia Cohort Run</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isLive && poll.currentCohort?.toUpperCase() === "ACADEMIA" ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-400"
            }`}>
              {isLive && poll.currentCohort?.toUpperCase() === "ACADEMIA" ? "In Progress" : "Standby"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 mb-4 mt-3">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-[var(--color-primary)]">{questionsCount}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Bidding Questions</div>
          </div>
        </div>
      </div>

      <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mt-2 border-t border-slate-100 pt-2">
        <Calendar className="w-3.5 h-3.5" />
        Launched: {createdDate}
      </div>
    </div>
  );
}

// ── MAIN BIDDING ADMIN DASHBOARD ──
export default function BiddingAdmin() {
  const { user } = useAuth();

  const {
    biddingPolls,
    loading,
    fetchBiddingPolls,
    deleteBiddingPoll,
    restartBiddingPoll,
    createBiddingPoll,
    saveBiddingPoll,
    cloneBiddingPoll,
  } = usePollStore();

  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [sharePoll, setSharePoll] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBiddingPolls(user.uid);
    }
  }, [user, fetchBiddingPolls]);

  const handleRefresh = () => {
    if (user) fetchBiddingPolls(user.uid);
  };

  const handleLaunchSession = async (sessionData) => {
    const titleWithSuffix = `${sessionData.name} ${sessionData.theme === "synergy_sphere" ? "~SS" : "~MC"}`;
    try {
      const pollId = await createBiddingPoll({
        title: titleWithSuffix,
        theme: sessionData.theme,
        questions: sessionData.questions,
      });
      toast.success("Bidding session launched!");
      if (user) fetchBiddingPolls(user.uid);
      window.open(`/bidding-present/${pollId}?theme=${sessionData.theme}`, "_self");
    } catch (err) {
      toast.error("Failed to launch bidding session");
      throw err;
    }
  };

  const handleSaveSession = async (sessionData) => {
    const titleWithSuffix = `${sessionData.name} ${sessionData.theme === "synergy_sphere" ? "~SS" : "~MC"}`;
    try {
      await saveBiddingPoll(sessionData.id, {
        title: titleWithSuffix,
        theme: sessionData.theme,
        questions: sessionData.questions,
      });
      toast.success("Bidding session updated successfully");
      if (user) fetchBiddingPolls(user.uid);
    } catch (err) {
      toast.error("Failed to update bidding session");
      throw err;
    }
  };

  const handleDeleteSession = async (pollId) => {
    if (!confirm("Delete this bidding session permanently?")) return;
    setIsProcessing(true);
    try {
      await deleteBiddingPoll(pollId);
      toast.success("Session deleted successfully");
    } catch (err) {
      toast.error("Failed to delete session");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestartSession = async (poll) => {
    if (!confirm("Restart bidding session run? This clears active bids.")) return;
    setIsProcessing(true);
    try {
      await restartBiddingPoll(poll.id);
      toast.success("Session bids restarted");
      if (user) fetchBiddingPolls(user.uid);
    } catch (err) {
      toast.error("Failed to restart bids");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloneSession = async (pollId) => {
    setIsProcessing(true);
    try {
      await cloneBiddingPoll(pollId);
      toast.success("Bidding session configuration cloned!");
      if (user) fetchBiddingPolls(user.uid);
    } catch (err) {
      toast.error("Failed to clone session");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col h-screen overflow-hidden font-[Epilogue]">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm z-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Skill Bidding Arena</h1>
            <p className="text-sm text-slate-500 mt-1">Manage and launch bidding sessions with hierarchical configurations</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="p-2.5 text-slate-400 hover:text-[var(--color-primary)] hover:bg-slate-50 rounded-xl transition-all border border-slate-200"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowLaunchModal(true)}
              className="bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-[var(--color-primary)]/20 hover:bg-[var(--color-primary-hover)] hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Launch Session
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-auto p-8 bg-slate-50">
          {loading && biddingPolls.length === 0 ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 text-[var(--color-primary)] animate-spin" />
            </div>
          ) : biddingPolls.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm max-w-2xl mx-auto">
              <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">No Bidding Sessions yet</h3>
              <p className="text-slate-500 mb-6">Launch a session using custom themes to start the bidding game.</p>
              <button
                onClick={() => setShowLaunchModal(true)}
                className="text-[var(--color-primary)] font-bold hover:underline"
              >
                Launch Bidding Session
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
              {biddingPolls.map((poll) => (
                <BiddingPollCard
                  key={poll.id}
                  poll={poll}
                  onDelete={handleDeleteSession}
                  onRestart={handleRestartSession}
                  onShare={(p) => setSharePoll(p)}
                  onEdit={(p) => setEditingSession(p)}
                  onClone={handleCloneSession}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Share Modal */}
      {sharePoll && (
        <ShareModal
          poll={sharePoll}
          onClose={() => setSharePoll(null)}
        />
      )}

      {/* Launch Modal */}
      <SessionModal
        isOpen={showLaunchModal}
        onClose={() => setShowLaunchModal(false)}
        onSave={handleLaunchSession}
      />

      {/* Edit Modal */}
      <SessionModal
        isOpen={editingSession !== null}
        onClose={() => setEditingSession(null)}
        onSave={handleSaveSession}
        initialPoll={editingSession}
      />

      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs">
          <div className="bg-white p-4 rounded-xl shadow-lg flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)]" />
            <span className="text-sm font-semibold text-slate-700">Processing...</span>
          </div>
        </div>
      )}
    </>
  );
}
