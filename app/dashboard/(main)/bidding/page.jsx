"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { usePollStore } from "@/lib/store/usePollStore";
import toast from "react-hot-toast";
import { parseTheme } from "@/lib/themeHelper";
import { QRCodeSVG } from "qrcode.react";
import {
  Plus,
  Trash2,
  Loader2,
  Award,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Play,
  Eye,
  ExternalLink,
  Calendar,
  MoreVertical,
  Share2,
  RotateCcw,
  X,
  Check,
  Copy,
  Download,
  FolderOpen,
} from "lucide-react";
import Link from "next/link";

const CATEGORIES = ["Leadership", "Technical", "Cognitive", "Interpersonal", "Soft"];

// ── SHARE MODAL COMPONENT ──
function ShareModal({ poll, onClose }) {
  const [copied, setCopied] = useState(false);
  const pollUrl = typeof window !== "undefined"
    ? `${window.location.origin}/bidding-poll/${poll.id}?theme=${poll.theme}`
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
          <h2 className="text-xl font-bold text-slate-900">Share Bidding Session</h2>
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

        {/* Session Code */}
        <div className="text-center mb-6">
          <p className="text-slate-500 text-sm mb-2">Session ID</p>
          <p className="text-3xl font-bold text-[var(--color-primary)] font-mono">{poll.id}</p>
        </div>

        {/* Link */}
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

// ── LAUNCH / EDIT SESSION MODAL ──
function SessionModal({ isOpen, onClose, onSave, skills, initialPoll = null }) {
  const [name, setName] = useState("");
  const [theme, setTheme] = useState("synergy_sphere");
  const [skillCost, setSkillCost] = useState(20);
  const [selectedSkillIds, setSelectedSkillIds] = useState(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialPoll) {
      const { cleanTitle, theme: parsedTheme } = parseTheme(initialPoll.title || "");
      setName(cleanTitle);
      setTheme(parsedTheme || "synergy_sphere");
      setSkillCost(initialPoll.skillCost || 20);
      setSelectedSkillIds(new Set((initialPoll.skills || []).map(s => s.id)));
    } else {
      setName("");
      setTheme("synergy_sphere");
      setSkillCost(20);
      setSelectedSkillIds(new Set(skills.map(s => s.id))); // select all by default for new sessions
    }
  }, [initialPoll, isOpen, skills]);

  if (!isOpen) return null;

  const toggleSkill = (id) => {
    setSelectedSkillIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedSkillIds(new Set(skills.map(s => s.id)));
  };

  const deselectAll = () => {
    setSelectedSkillIds(new Set());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a session name");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        id: initialPoll?.id,
        name: name.trim(),
        theme,
        skillCost,
        skillIds: Array.from(selectedSkillIds)
      });
      onClose();
    } catch (err) {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl animate-fade-in max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <h2 className="text-xl font-bold text-slate-900">
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
              placeholder="e.g. Executive Cohort 2026"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-[var(--color-primary)]/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                Cohort / Theme
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-slate-500 bg-white"
              >
                <option value="synergy_sphere">SynergySphere (HR)</option>
                <option value="masterclass">Masterclass (ACADEMIA)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                Skill Cost (Coins)
              </label>
              <input
                type="number"
                min={5}
                max={100}
                value={skillCost}
                onChange={(e) => setSkillCost(Math.max(5, Math.min(100, parseInt(e.target.value) || 20)))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-slate-500"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Connect Skills to Session ({selectedSkillIds.size} selected)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-[var(--color-primary)] font-bold hover:underline"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-xs text-slate-500 font-bold hover:underline"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 max-h-[300px] overflow-y-auto space-y-4">
              {CATEGORIES.map(cat => {
                const catSkills = skills.filter(s => s.category === cat);
                if (catSkills.length === 0) return null;
                return (
                  <div key={cat} className="space-y-1.5">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-0.5">
                      {cat}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {catSkills.map(s => {
                        const isChecked = selectedSkillIds.has(s.id);
                        return (
                          <label
                            key={s.id}
                            className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                              isChecked
                                ? "bg-white border-[var(--color-primary)] shadow-sm text-slate-900"
                                : "bg-white/40 border-slate-200 text-slate-500 hover:border-slate-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSkill(s.id)}
                              className="rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
                            />
                            <span className="truncate">{s.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
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
              disabled={saving || selectedSkillIds.size === 0}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
              style={{
                background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))"
              }}
            >
              {saving ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </div>
              ) : initialPoll ? "Save Changes" : "Launch Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── CARD COMPONENT FOR BIDDING SESSIONS ──
function BiddingPollCard({ poll, onDelete, onRestart, onShare, onEdit }) {
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
  const skillsCount = poll.skills?.length || 0;

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
        {/* Header */}
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

          {/* Actions Menu */}
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
                  href={`/bidding-present/${poll.id}?theme=${theme}`}
                  target="_blank"
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  onClick={() => setShowMenu(false)}
                >
                  <Play className="w-4 h-4 text-[var(--color-primary)]" /> Present
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
                  <Sparkles className="w-4 h-4 text-indigo-600" /> Manage Skills
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
                  <RotateCcw className="w-4 h-4 text-orange-500" /> Restart
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

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 mb-4 mt-2">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-[var(--color-primary)]">{skillsCount}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Connected Skills</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-[var(--color-secondary)]">{poll.skillCost || 20}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Coins/Skill</div>
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

// ── MAIN BIDDING ADMIN COMPONENT ──
export default function BiddingAdmin() {
  const { user } = useAuth();

  // Store actions/state
  const {
    biddingPolls,
    loading: loadingStore,
    fetchBiddingPolls,
    deleteBiddingPoll,
    restartBiddingPoll,
    createBiddingPoll,
    saveBiddingPoll,
  } = usePollStore();

  const [skills, setSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [activeTab, setActiveTab] = useState("sessions");

  // Skill Directory form state
  const [showAddSkillForm, setShowAddSkillForm] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState(CATEGORIES[0]);
  const [savingSkill, setSavingSkill] = useState(false);
  const [deletingSkillId, setDeletingSkillId] = useState(null);

  // Modals state
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [sharePoll, setSharePoll] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchSkills = useCallback(async () => {
    try {
      const data = await api.getSkills();
      setSkills(data || []);
    } catch (err) {
      console.error("Error fetching skills:", err);
      toast.error("Failed to load skills directory");
    } finally {
      setLoadingSkills(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchBiddingPolls(user.uid);
    }
    fetchSkills();
  }, [user, fetchBiddingPolls, fetchSkills]);

  const handleRefresh = () => {
    if (user) fetchBiddingPolls(user.uid);
    fetchSkills();
  };

  // Launch a new bidding poll session
  const handleLaunchSession = async (sessionData) => {
    const titleWithSuffix = `${sessionData.name} ${sessionData.theme === "synergy_sphere" ? "~SS" : "~MC"}`;
    try {
      const pollId = await createBiddingPoll(
        titleWithSuffix,
        sessionData.theme,
        sessionData.skillCost,
        sessionData.skillIds
      );
      toast.success("Bidding session launched!");
      if (user) fetchBiddingPolls(user.uid);
      window.open(`/bidding-present/${pollId}?theme=${sessionData.theme}`, "_blank");
    } catch (err) {
      toast.error("Failed to launch bidding session");
      throw err;
    }
  };

  // Save changes to an existing session
  const handleSaveSession = async (sessionData) => {
    const titleWithSuffix = `${sessionData.name} ${sessionData.theme === "synergy_sphere" ? "~SS" : "~MC"}`;
    try {
      await saveBiddingPoll(
        sessionData.id,
        titleWithSuffix,
        sessionData.theme,
        sessionData.skillCost,
        sessionData.skillIds
      );
      toast.success("Bidding session updated successfully");
      if (user) fetchBiddingPolls(user.uid);
    } catch (err) {
      toast.error("Failed to update bidding session");
      throw err;
    }
  };

  // Delete session
  const handleDeleteSession = async (pollId) => {
    if (!confirm("Are you sure you want to permanently delete this bidding session?")) return;
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

  // Restart session (Reset bids)
  const handleRestartSession = async (poll) => {
    if (!confirm("Restart bidding? This will clear all votes and locked-in bids.")) return;
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

  // ── Global Skill Catalog Management handlers ──
  const handleAddGlobalSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) {
      toast.error("Please enter a skill name");
      return;
    }
    setSavingSkill(true);
    try {
      await api.addSkill({ name: newSkillName.trim(), category: newSkillCategory });
      toast.success(`"${newSkillName.trim()}" added to global catalog!`);
      setNewSkillName("");
      setShowAddSkillForm(false);
      fetchSkills();
    } catch (err) {
      toast.error("Failed to add skill");
    } finally {
      setSavingSkill(false);
    }
  };

  const handleDeleteGlobalSkill = async (id, name) => {
    if (!confirm(`Delete "${name}" from global catalog? Connected sessions will no longer display this skill.`)) return;
    setDeletingSkillId(id);
    try {
      await api.deleteSkill(id);
      toast.success(`"${name}" deleted from catalog`);
      fetchSkills();
    } catch (err) {
      toast.error("Failed to delete skill");
    } finally {
      setDeletingSkillId(null);
    }
  };

  const groupedGlobalSkills = {};
  CATEGORIES.forEach(cat => {
    groupedGlobalSkills[cat] = skills.filter(s => s.category === cat);
  });

  const loading = loadingStore || loadingSkills;

  return (
    <>
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm z-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Skill Bidding</h1>
            <p className="text-sm text-slate-500 mt-1">Manage all your bidding sessions and the global skills catalog</p>
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

        {/* Tab Selector */}
        <div className="border-b border-slate-200 bg-white px-8 flex gap-6 z-10 shadow-sm">
          <button
            onClick={() => setActiveTab("sessions")}
            className={`py-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === "sessions"
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Bidding Sessions ({biddingPolls.length})
          </button>
          <button
            onClick={() => setActiveTab("catalog")}
            className={`py-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === "catalog"
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Global Skills Directory ({skills.length})
          </button>
        </div>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-auto p-8 bg-slate-50">
          {loading && biddingPolls.length === 0 ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 text-[var(--color-primary)] animate-spin" />
            </div>
          ) : activeTab === "sessions" ? (
            // ── TAB 1: SESSIONS GRID ──
            biddingPolls.length === 0 ? (
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
                  />
                ))}
              </div>
            )
          ) : (
            // ── TAB 2: GLOBAL CATALOG ──
            <div className="max-w-4xl mx-auto space-y-8 pb-10">
              <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <h3 className="font-bold text-slate-900">Manage Global Catalog</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Add or remove skills globally. These serve as the repository when launching sessions.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddSkillForm(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow"
                >
                  <Plus className="w-4 h-4" /> Add Skill to Directory
                </button>
              </div>

              {/* Add skill form */}
              {showAddSkillForm && (
                <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-md animate-fade-in">
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-[var(--color-primary)]" />
                    New Skill details
                  </h4>
                  <form onSubmit={handleAddGlobalSkill} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                        Skill Name
                      </label>
                      <input
                        type="text"
                        value={newSkillName}
                        onChange={(e) => setNewSkillName(e.target.value)}
                        placeholder="e.g. Adaptive Leadership"
                        className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-slate-500"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                        Category
                      </label>
                      <select
                        value={newSkillCategory}
                        onChange={(e) => setNewSkillCategory(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-slate-500 bg-white"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={savingSkill}
                        className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        {savingSkill ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Add Skill
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowAddSkillForm(false); setNewSkillName(""); }}
                        className="py-2 px-4 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all border border-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Catalog list grouped */}
              {skills.length === 0 ? (
                <div className="text-center py-10 rounded-2xl border border-dashed border-slate-300">
                  <p className="text-slate-400 text-sm">No skills found in the directory.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {CATEGORIES.map(cat => {
                    const catSkills = groupedGlobalSkills[cat] || [];
                    if (catSkills.length === 0) return null;
                    return (
                      <div key={cat} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                            {cat}
                          </h4>
                          <span className="text-xs text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-full font-bold">
                            {catSkills.length}
                          </span>
                          <div className="flex-1 h-px bg-slate-200" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {catSkills.map(skill => (
                            <div
                              key={skill.id}
                              className="group flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">
                                  {skill.name}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Added: {new Date(skill.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <button
                                onClick={() => handleDeleteGlobalSkill(skill.id, skill.name)}
                                disabled={deletingSkillId === skill.id}
                                className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                title={`Delete ${skill.name}`}
                              >
                                {deletingSkillId === skill.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
        skills={skills}
      />

      {/* Edit Modal */}
      <SessionModal
        isOpen={editingSession !== null}
        onClose={() => setEditingSession(null)}
        onSave={handleSaveSession}
        skills={skills}
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
