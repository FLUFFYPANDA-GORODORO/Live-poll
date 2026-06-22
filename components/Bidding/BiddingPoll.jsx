"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import { Check, Lock, Sparkles, X, ArrowLeft, ChevronRight, Loader2 } from "lucide-react";

const CATEGORIES = ["Leadership", "Technical", "Cognitive", "Interpersonal"];
const INITIAL_COINS = 100;

export default function BiddingPoll({
  skills,
  poll,
  sessionId,
  sendSelectionChange,
  lockInBids,
  bubbleCounts,
  committedCount,
  theme,
}) {
  const skillCost = poll?.skillCost || 20;
  const maxPicks = Math.floor(INITIAL_COINS / skillCost);
  const isSynergy = theme === "synergy_sphere";
  const isMasterclass = theme === "masterclass";

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isLockedIn, setIsLockedIn] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showConfirmStep2, setShowConfirmStep2] = useState(false);
  const [lockingIn, setLockingIn] = useState(false);
  const [lockError, setLockError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [hoveredSkill, setHoveredSkill] = useState(null);
  const [receiptSkills, setReceiptSkills] = useState([]);

  const categoryRefs = useRef({});
  const containerRef = useRef(null);

  const totalCoinsSpent = selectedIds.size * skillCost;
  const remainingCoins = INITIAL_COINS - totalCoinsSpent;
  const canSelect = remainingCoins >= skillCost && !isLockedIn;

  // Group skills by category
  const categorizedSkills = useMemo(() => {
    const map = {};
    CATEGORIES.forEach((cat) => {
      map[cat] = (skills || []).filter((s) => s.category === cat);
    });
    return map;
  }, [skills]);

  // Toggle selection
  const toggleSkill = useCallback(
    (skillId) => {
      if (isLockedIn) return;
      setLockError(null);

      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(skillId)) {
          next.delete(skillId);
          sendSelectionChange?.(poll?.id, sessionId, skillId, false);
        } else if (next.size < maxPicks) {
          next.add(skillId);
          sendSelectionChange?.(poll?.id, sessionId, skillId, true);
        }
        return next;
      });
    },
    [isLockedIn, maxPicks, poll?.id, sessionId, sendSelectionChange]
  );

  // Open confirm modal
  const handleOpenConfirm = () => {
    if (selectedIds.size === 0) return;
    setShowConfirmModal(true);
    setShowConfirmStep2(false);
  };

  // Lock in bids
  const handleLockIn = async () => {
    if (!showConfirmStep2) {
      setShowConfirmStep2(true);
      return;
    }
    setLockingIn(true);
    setLockError(null);
    try {
      await lockInBids?.(poll?.id, sessionId, Array.from(selectedIds));
      setReceiptSkills(
        skills?.filter((s) => selectedIds.has(s.id)) || []
      );
      setIsLockedIn(true);
      setShowConfirmModal(false);
      setShowConfirmStep2(false);
    } catch (err) {
      setLockError(err.message || "Failed to lock in bids. Please try again.");
    } finally {
      setLockingIn(false);
    }
  };

  // Scroll to category
  const scrollToCategory = (cat) => {
    setActiveCategory(cat);
    const el = categoryRefs.current[cat];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Get vote count for a skill
  const getSkillVotes = (skillId) => {
    return bubbleCounts?.[skillId] || 0;
  };

  // Background styles
  const bgClass = isSynergy
    ? "bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950"
    : isMasterclass
    ? "bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-950"
    : "bg-gradient-to-b from-slate-50 to-white";

  const cardBg = isSynergy
    ? "bg-stone-900/80 border-stone-800"
    : isMasterclass
    ? "bg-slate-900/80 border-slate-800"
    : "bg-white border-slate-200";

  const accentColor = isSynergy ? "#f43f5e" : isMasterclass ? "#10b981" : "#6366f1";
  const textColor = isSynergy || isMasterclass ? "text-white" : "text-slate-900";
  const textMuted = isSynergy || isMasterclass ? "text-white/50" : "text-slate-500";

  // Locked-in receipt view
  if (isLockedIn) {
    return (
      <div className={`min-h-screen ${bgClass} p-6 flex items-center justify-center`}>
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: `${accentColor}20` }}
            >
              <Check className="w-10 h-10" style={{ color: accentColor }} />
            </div>
            <h1 className={`text-2xl font-bold font-[Epilogue] ${textColor}`}>
              Bids Locked In! 🎉
            </h1>
            <p className={`mt-2 text-sm font-[Epilogue] ${textMuted}`}>
              Your Gryphon Coins have been allocated
            </p>
          </div>

          {/* Receipt Card */}
          <div
            className={`rounded-2xl p-6 border ${cardBg} backdrop-blur-sm`}
          >
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
              <span className={`text-sm font-[Epilogue] ${textMuted}`}>Total Coins Spent</span>
              <div className="flex items-center gap-2">
                <Image
                  src="/coin2.png"
                  alt="Coin"
                  width={24}
                  height={24}
                  className="object-contain"
                />
                <span className={`text-xl font-bold font-[Epilogue] ${textColor}`}>
                  {totalCoinsSpent}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {receiptSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5"
                >
                  <div className="text-left">
                    <p className={`text-sm font-semibold font-[Epilogue] ${textColor}`}>
                      {skill.name}
                    </p>
                    <p className={`text-xs font-[Epilogue] ${textMuted}`}>{skill.category}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Image
                      src="/coin2.png"
                      alt="coin"
                      width={16}
                      height={16}
                      className="object-contain"
                    />
                    <span className={`text-sm font-semibold font-[Epilogue] ${textColor}`}>
                      {skillCost}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className={`mt-6 text-xs font-[Epilogue] ${textMuted}`}>
            You selected {selectedIds.size} of {maxPicks} possible skills
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`min-h-screen ${bgClass}`}>
      {/* Sticky Wallet Header */}
      <div
        className={`sticky top-0 z-30 backdrop-blur-xl border-b ${isSynergy || isMasterclass ? "border-white/10 bg-black/60" : "border-slate-200 bg-white/80"}`}
      >
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/coin2.png"
              alt="Gryphon Coins"
              width={32}
              height={32}
              className="object-contain drop-shadow-lg"
              priority
            />
            <div>
              <p className={`text-xs font-[Epilogue] ${textMuted}`}>Wallet</p>
              <p className={`text-lg font-bold font-[Epilogue] ${textColor}`}>
                {remainingCoins}
                <span className={`text-sm font-normal ${textMuted}`}> / {INITIAL_COINS}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Picks counter */}
            <div className="text-center">
              <p className={`text-xs font-[Epilogue] ${textMuted}`}>Picks</p>
              <p className={`text-sm font-bold font-[Epilogue] ${textColor}`}>
                {selectedIds.size}/{maxPicks}
              </p>
            </div>

            {/* Lock In Button */}
            <button
              onClick={handleOpenConfirm}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold font-[Epilogue] transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              style={{
                background: selectedIds.size > 0 ? accentColor : "#333",
                color: "#fff",
              }}
            >
              <Lock className="w-4 h-4" />
              Lock In
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/10">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${(totalCoinsSpent / INITIAL_COINS) * 100}%`,
              background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)`,
            }}
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div
        className={`sticky top-[72px] z-20 backdrop-blur-xl ${isSynergy || isMasterclass ? "bg-black/40" : "bg-slate-50/80"}`}
      >
        <div className="max-w-lg mx-auto flex overflow-x-auto gap-1 px-4 py-2 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const count = categorizedSkills[cat]?.length || 0;
            const selected = skills?.filter((s) => s.category === cat && selectedIds.has(s.id)).length || 0;
            return (
              <button
                key={cat}
                onClick={() => scrollToCategory(cat)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold font-[Epilogue] whitespace-nowrap transition-all flex-shrink-0 ${
                  activeCategory === cat
                    ? "text-white shadow-lg"
                    : `${textMuted} hover:bg-white/10`
                }`}
                style={
                  activeCategory === cat
                    ? { background: accentColor }
                    : {}
                }
              >
                {cat}
                {selected > 0 && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: accentColor }}
                  >
                    {selected}
                  </span>
                )}
                <span className={`text-[10px] ${textMuted}`}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Skills Grid by Category */}
      <div className="max-w-lg mx-auto px-4 pb-32 pt-4 space-y-8">
        {CATEGORIES.map((cat) => {
          const catSkills = categorizedSkills[cat] || [];
          if (catSkills.length === 0) return null;
          return (
            <div
              key={cat}
              ref={(el) => { categoryRefs.current[cat] = el; }}
            >
              {/* Category Header */}
              <div className="flex items-center gap-2 mb-3">
                <h2 className={`text-sm font-bold uppercase tracking-wider font-[Epilogue] ${textMuted}`}>
                  {cat}
                </h2>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Skill Cards */}
              <div className="grid grid-cols-2 gap-3">
                {catSkills.map((skill) => {
                  const isSelected = selectedIds.has(skill.id);
                  const votes = getSkillVotes(skill.id);
                  return (
                    <button
                      key={skill.id}
                      onClick={() => toggleSkill(skill.id)}
                      onMouseEnter={() => setHoveredSkill(skill.id)}
                      onMouseLeave={() => setHoveredSkill(null)}
                      disabled={!isSelected && !canSelect}
                      className={`relative rounded-xl p-4 border text-left transition-all duration-200 ${
                        isSelected
                          ? "border-2 scale-[1.02] shadow-lg"
                          : "border hover:scale-[1.01]"
                      } ${isSynergy || isMasterclass ? "backdrop-blur-sm" : ""} ${
                        !isSelected && !canSelect ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                      } ${cardBg}`}
                      style={
                        isSelected
                          ? {
                              borderColor: accentColor,
                              boxShadow: `0 0 20px ${accentColor}33`,
                            }
                          : {}
                      }
                    >
                      {/* Checkmark overlay */}
                      {isSelected && (
                        <div
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: accentColor }}
                        >
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}

                      {/* Skill Name */}
                      <p className={`text-sm font-bold font-[Epilogue] mb-1 ${textColor}`}>
                        {skill.name}
                      </p>

                      {/* Cost / Votes */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Image
                            src="/coin2.png"
                            alt="coin"
                            width={14}
                            height={14}
                            className="object-contain"
                          />
                          <span className={`text-xs font-semibold font-[Epilogue] ${
                            isSelected ? "text-yellow-400" : textMuted
                          }`}>
                            {skillCost}
                          </span>
                        </div>

                        {votes > 0 && (
                          <span className={`text-[10px] font-[Epilogue] ${textMuted}`}>
                            {votes} vote{votes !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {(!skills || skills.length === 0) && (
          <div className="text-center py-20">
            <p className={`font-[Epilogue] ${textMuted}`}>Loading skills...</p>
          </div>
        )}
      </div>

      {/* Bottom spacer */}
      <div className="h-24" />

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-sm rounded-2xl p-6 border ${cardBg} backdrop-blur-xl`}
          >
            {!showConfirmStep2 ? (
              <>
                {/* Step 1: Summary */}
                <div className="text-center mb-6">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: `${accentColor}20` }}
                  >
                    <Sparkles className="w-8 h-8" style={{ color: accentColor }} />
                  </div>
                  <h3 className={`text-lg font-bold font-[Epilogue] ${textColor}`}>
                    Ready to Lock In?
                  </h3>
                  <p className={`mt-2 text-sm font-[Epilogue] ${textMuted}`}>
                    You're allocating <strong className={textColor}>{totalCoinsSpent}</strong> coins across{" "}
                    <strong className={textColor}>{selectedIds.size}</strong> skills
                  </p>
                </div>

                {/* Selected skills preview */}
                <div className="space-y-2 mb-6 max-h-32 overflow-y-auto">
                  {skills
                    ?.filter((s) => selectedIds.has(s.id))
                    .map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-white/5"
                      >
                        <span className={`text-sm font-[Epilogue] ${textColor}`}>{skill.name}</span>
                        <div className="flex items-center gap-1">
                          <Image src="/coin2.png" alt="coin" width={14} height={14} />
                          <span className={`text-xs font-[Epilogue] ${textColor}`}>{skillCost}</span>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold font-[Epilogue] bg-white/10 text-white/70 hover:bg-white/20 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLockIn}
                    className="flex-1 py-3 rounded-xl text-sm font-bold font-[Epilogue] text-white transition-all hover:scale-105"
                    style={{ background: accentColor }}
                  >
                    Continue
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Step 2: Double Confirm */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className={`text-lg font-bold font-[Epilogue] ${textColor}`}>
                    Are you sure?
                  </h3>
                  <p className={`mt-2 text-sm font-[Epilogue] ${textMuted}`}>
                    This action cannot be undone. Your selections will be permanently recorded.
                  </p>
                </div>

                {lockError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-[Epilogue] text-center">
                    {lockError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowConfirmStep2(false); }}
                    disabled={lockingIn}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold font-[Epilogue] bg-white/10 text-white/70 hover:bg-white/20 transition-all disabled:opacity-50"
                  >
                    <ArrowLeft className="w-4 h-4 inline mr-1" />
                    Back
                  </button>
                  <button
                    onClick={handleLockIn}
                    disabled={lockingIn}
                    className="flex-1 py-3 rounded-xl text-sm font-bold font-[Epilogue] text-white transition-all hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: "#ef4444" }}
                  >
                    {lockingIn ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Locking...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Confirm Lock In
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
