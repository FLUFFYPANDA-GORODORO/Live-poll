"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
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
} from "lucide-react";
import Link from "next/link";
import { usePollStore } from "@/lib/store/usePollStore";

const CATEGORIES = ["Leadership", "Technical", "Cognitive", "Interpersonal", "Soft"];

export default function BiddingAdmin() {
  const { user } = useAuth();
  const { createPoll } = usePollStore();

  // ── Skills State ──
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // ── Bidding Polls State ──
  const [biddingPolls, setBiddingPolls] = useState([]);
  const [loadingPolls, setLoadingPolls] = useState(true);
  const [creatingPoll, setCreatingPoll] = useState(false);
  const [pollName, setPollName] = useState("");
  const [pollTheme, setPollTheme] = useState("synergy_sphere");
  const [pollSkillCost, setPollSkillCost] = useState(20);

  const fetchSkills = useCallback(async () => {
    try {
      const data = await api.getSkills();
      setSkills(data || []);
    } catch (err) {
      console.error("Error fetching skills:", err);
      toast.error("Failed to load skills");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBiddingPolls = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const data = await api.getPolls(user.uid);
      const bidding = (data || []).filter(
        (p) => p.theme === "synergy_sphere" || p.theme === "masterclass"
      );
      setBiddingPolls(bidding);
    } catch (err) {
      console.error("Error fetching polls:", err);
    } finally {
      setLoadingPolls(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchSkills();
    fetchBiddingPolls();
  }, [fetchSkills, fetchBiddingPolls]);

  // ── Skill Handlers ──
  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("Please enter a skill name");
      return;
    }
    setSaving(true);
    try {
      await api.addSkill({ name: newName.trim(), category: newCategory });
      toast.success(`"${newName.trim()}" added!`);
      setNewName("");
      setShowAddForm(false);
      fetchSkills();
    } catch (err) {
      toast.error("Failed to add skill");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSkill = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await api.deleteSkill(id);
      toast.success(`"${name}" deleted`);
      fetchSkills();
    } catch (err) {
      toast.error("Failed to delete skill");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Create Bidding Poll ──
  const handleCreateBiddingPoll = async () => {
    if (!pollName.trim()) {
      toast.error("Please enter a poll title");
      return;
    }
    setCreatingPoll(true);
    try {
      const titleWithSuffix = `${pollName.trim()} ${pollTheme === "synergy_sphere" ? "~SS" : "~MC"}`;
      const pollId = await createPoll(
        titleWithSuffix,
        [{ text: "Skill Bidding", type: "MultipleChoice", options: ["Bid"] }],
        pollTheme,
        pollSkillCost
      );
      toast.success("Bidding poll created!");
      setPollName("");
      fetchBiddingPolls();

      // Open the presenter view
      window.open(`/bidding-present/${pollId}?theme=${pollTheme}`, "_blank");
    } catch (err) {
      toast.error("Failed to create bidding poll");
    } finally {
      setCreatingPoll(false);
    }
  };

  // Group skills by category
  const grouped = {};
  CATEGORIES.forEach((cat) => {
    grouped[cat] = skills.filter((s) => s.category === cat);
  });

  return (
    <div className="flex-1 p-4 md:p-8 space-y-10">
      {/* ═══════════════════════════════════════
         SECTION 1: CREATE BIDDING POLL
         ═══════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Play className="w-6 h-6 text-emerald-600" />
              Launch a Bidding Session
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Create a new live bidding poll participants can join
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                Session Name
              </label>
              <input
                type="text"
                value={pollName}
                onChange={(e) => setPollName(e.target.value)}
                placeholder="e.g. Team Building 2026"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
            <div className="w-44">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                Cohort
              </label>
              <select
                value={pollTheme}
                onChange={(e) => setPollTheme(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white"
              >
                <option value="synergy_sphere">SynergySphere (HR)</option>
                <option value="masterclass">Masterclass (ACADEMIA)</option>
              </select>
            </div>
            <div className="w-28">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                Cost/Skill
              </label>
              <input
                type="number"
                min={5}
                max={100}
                value={pollSkillCost}
                onChange={(e) => setPollSkillCost(Math.max(5, Math.min(100, parseInt(e.target.value) || 20)))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleCreateBiddingPoll}
                disabled={creatingPoll || !pollName.trim()}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 hover:scale-105 flex items-center gap-2 shadow-lg"
                style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}
              >
                {creatingPoll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {creatingPoll ? "Creating..." : "Launch"}
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Max picks per participant: {Math.floor(100 / pollSkillCost)} &middot; Opens presenter view in new tab
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════
         SECTION 2: ACTIVE / PAST BIDDING POLLS
         ═══════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-emerald-600" />
            Bidding Sessions
          </h2>
          <button
            onClick={fetchBiddingPolls}
            className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loadingPolls ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : biddingPolls.length === 0 ? (
          <div className="text-center py-10 rounded-2xl border border-dashed border-slate-300">
            <p className="text-slate-400 text-sm">No bidding sessions yet. Launch one above!</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {biddingPolls.map((p) => {
              const title = p.title?.replace(/ ~(SS|MC)$/, "") || "Untitled";
              const theme = p.theme;
              const isLive = p.isBiddingActive;
              const isClosed = p.biddingClosed;
              const isSynergy = theme === "synergy_sphere";
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-4 rounded-xl border bg-white hover:shadow-sm transition-all"
                  style={{ borderColor: isSynergy ? "#f43f5e33" : "#10b98133" }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${isLive ? "bg-green-500 animate-pulse" : isClosed ? "bg-slate-400" : "bg-amber-400"}`}
                      />
                      <p className="text-sm font-bold text-slate-800 truncate">{title}</p>
                      {isLive && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white bg-green-500">LIVE</span>
                      )}
                      {isClosed && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white bg-slate-400">CLOSED</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isSynergy ? "SynergySphere (HR)" : "Masterclass (ACADEMIA)"}
                      {" · "}Cost: {p.skillCost || 20} coins
                      {" · "}{new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      href={`/bidding-poll/${p.id}?theme=${theme}`}
                      target="_blank"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Participant</span>
                    </Link>
                    <Link
                      href={`/bidding-present/${p.id}?theme=${theme}`}
                      target="_blank"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:scale-105"
                      style={{ background: isSynergy ? "#f43f5e" : "#10b981" }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Present</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════
         SECTION 3: MANAGE SKILLS
         ═══════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-emerald-600" />
              Manage Skills
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Add or remove skills participants can bid on
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 shadow-lg"
            style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}
          >
            <Plus className="w-4 h-4" />
            Add Skill
          </button>
        </div>

        {/* Add Skill Form */}
        {showAddForm && (
          <div className="mb-6 p-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 shadow-sm">
            <form onSubmit={handleAddSkill} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Skill Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Strategic Communication"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  autoFocus
                />
              </div>
              <div className="w-full sm:w-48">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {saving ? "Adding..." : "Add Skill"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setNewName(""); }}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Skills List */}
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : skills.length === 0 ? (
          <div className="text-center py-10 rounded-2xl border border-dashed border-slate-300">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm mb-3">No skills yet</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Your First Skill
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {CATEGORIES.map((cat) => {
              const catSkills = grouped[cat] || [];
              if (catSkills.length === 0) return null;
              return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                    {cat}
                  </h2>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {catSkills.length}
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {catSkills.map((skill) => (
                    <div
                      key={skill.id}
                      className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {skill.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Created {new Date(skill.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteSkill(skill.id, skill.name)}
                        disabled={deletingId === skill.id}
                        className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                        title={`Delete ${skill.name}`}
                      >
                        {deletingId === skill.id ? (
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

          {/* Summary footer */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-400">
              {skills.length} skill{skills.length !== 1 ? "s" : ""} total
              {" · "}Max {Math.floor(100 / 20)} picks per participant at default cost
            </p>
          </div>
        </div>
      )}
      </section>
    </div>
  );
}
