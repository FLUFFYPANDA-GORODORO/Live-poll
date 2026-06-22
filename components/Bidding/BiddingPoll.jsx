"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import { Check, Lock, Sparkles, X, ArrowLeft, Loader2, Minus, Plus } from "lucide-react";

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

  const [selections, setSelections] = useState({}); // { [skillId]: count }
  const selectionsRef = useRef({});

  // Sync ref with selections state
  useEffect(() => {
    selectionsRef.current = selections;
  }, [selections]);

  const [isLockedIn, setIsLockedIn] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showConfirmStep2, setShowConfirmStep2] = useState(false);
  const [lockingIn, setLockingIn] = useState(false);
  const [lockError, setLockError] = useState(null);
  const [hoveredSkill, setHoveredSkill] = useState(null);
  const [receiptSkills, setReceiptSkills] = useState([]);
  const [coinAnimations, setCoinAnimations] = useState([]);

  const walletRef = useRef(null);
  const containerRef = useRef(null);

  const totalCoinsSpent = Object.values(selections).reduce((acc, count) => acc + count, 0) * skillCost;
  const remainingCoins = INITIAL_COINS - totalCoinsSpent;
  const canSelect = remainingCoins >= skillCost && !isLockedIn;

  // Add coin to skill
  const addCoin = useCallback(
    (skillId, event) => {
      if (isLockedIn) return;

      const currentSelections = selectionsRef.current;
      const currentSpent = Object.values(currentSelections).reduce((acc, count) => acc + count, 0) * skillCost;
      const currentRemaining = INITIAL_COINS - currentSpent;

      if (currentRemaining < skillCost) return; // budget exceeded

      const nextSelections = {
        ...currentSelections,
        [skillId]: (currentSelections[skillId] || 0) + 1,
      };

      selectionsRef.current = nextSelections;
      setSelections(nextSelections);
      setLockError(null);

      sendSelectionChange?.(poll?.id, sessionId, skillId, true);

      // Trigger coin drop animation
      if (event && walletRef.current) {
        const walletRect = walletRef.current.getBoundingClientRect();
        const targetRect = event.currentTarget.getBoundingClientRect();
        
        const startX = walletRect.left + walletRect.width / 2;
        const startY = walletRect.top + walletRect.height / 2;
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;

        const animId = Math.random().toString(36).substring(2, 9);
        setCoinAnimations((prev) => [
          ...prev,
          { id: animId, startX, startY, endX, endY },
        ]);
      }
    },
    [isLockedIn, skillCost, poll?.id, sessionId, sendSelectionChange]
  );

  // Remove coin from skill
  const removeCoin = useCallback(
    (skillId, event) => {
      if (isLockedIn) return;
      event.stopPropagation(); // Avoid triggering addCoin on bubble click

      const currentSelections = selectionsRef.current;
      const currentCount = currentSelections[skillId] || 0;
      if (currentCount <= 0) return;

      const nextSelections = { ...currentSelections };
      nextSelections[skillId] = currentCount - 1;
      if (nextSelections[skillId] === 0) {
        delete nextSelections[skillId];
      }

      selectionsRef.current = nextSelections;
      setSelections(nextSelections);
      setLockError(null);

      sendSelectionChange?.(poll?.id, sessionId, skillId, false);

      // Trigger coin fly back to wallet animation
      if (event && walletRef.current) {
        const walletRect = walletRef.current.getBoundingClientRect();
        const targetRect = event.currentTarget.getBoundingClientRect();
        
        const startX = targetRect.left + targetRect.width / 2;
        const startY = targetRect.top + targetRect.height / 2;
        const endX = walletRect.left + walletRect.width / 2;
        const endY = walletRect.top + walletRect.height / 2;

        const animId = Math.random().toString(36).substring(2, 9);
        setCoinAnimations((prev) => [
          ...prev,
          { id: animId, startX, startY, endX, endY },
        ]);
      }
    },
    [isLockedIn, poll?.id, sessionId, sendSelectionChange]
  );

  // Open confirm modal
  const handleOpenConfirm = () => {
    const selectedCount = Object.values(selections).reduce((acc, count) => acc + count, 0);
    if (selectedCount === 0) return;
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
      const allSelectedIds = [];
      Object.entries(selections).forEach(([skillId, count]) => {
        for (let i = 0; i < count; i++) {
          allSelectedIds.push(parseInt(skillId));
        }
      });

      await lockInBids?.(poll?.id, sessionId, allSelectedIds);
      setReceiptSkills(
        skills?.filter((s) => (selections[s.id] || 0) > 0) || []
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

  const totalPicks = Object.values(selections).reduce((acc, count) => acc + count, 0);

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
          <div className={`rounded-2xl p-6 border ${cardBg} backdrop-blur-sm`}>
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
                      {skillCost * (selections[skill.id] || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className={`mt-6 text-xs font-[Epilogue] ${textMuted}`}>
            You allocated {totalPicks} bid coins across {receiptSkills.length} skills
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`min-h-screen ${bgClass} overflow-x-hidden`}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes coin-fly {
          0% {
            transform: translate(calc(var(--start-x) - 12px), calc(var(--start-y) - 12px)) scale(1.3);
            opacity: 1;
          }
          80% {
            transform: translate(calc(var(--end-x) - 12px), calc(var(--end-y) - 12px)) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(calc(var(--end-x) - 12px), calc(var(--end-y) - 12px)) scale(0.6);
            opacity: 0;
          }
        }
        .animate-coin-fly {
          animation: coin-fly 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes float-bubble {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(1deg);
          }
        }
        .float-bubble {
          animation: float-bubble 6s ease-in-out infinite;
        }
      `}} />

      {/* Coin Fly Animations Container */}
      {coinAnimations.map((coin) => (
        <div
          key={coin.id}
          className="fixed z-50 pointer-events-none animate-coin-fly"
          style={{
            "--start-x": `${coin.startX}px`,
            "--start-y": `${coin.startY}px`,
            "--end-x": `${coin.endX}px`,
            "--end-y": `${coin.endY}px`,
            left: 0,
            top: 0,
          }}
          onAnimationEnd={() => {
            setCoinAnimations((prev) => prev.filter((c) => c.id !== coin.id));
          }}
        >
          <Image
            src="/coin2.png"
            alt="coin"
            width={24}
            height={24}
            className="object-contain drop-shadow-md"
          />
        </div>
      ))}

      {/* Sticky Wallet Header */}
      <div
        className={`sticky top-0 z-30 backdrop-blur-xl border-b ${isSynergy || isMasterclass ? "border-white/10 bg-black/60" : "border-slate-200 bg-white/80"}`}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className={`text-xl font-bold font-[Epilogue] ${textColor}`}>
              {poll?.title ? poll.title.replace(/~(SS|MC)$/, "").trim() : "Bidding Arena"}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            {/* Lock In Button */}
            <button
              onClick={handleOpenConfirm}
              disabled={totalPicks === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold font-[Epilogue] transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-md"
              style={{
                background: totalPicks > 0 ? accentColor : "#333",
                color: "#fff",
              }}
            >
              <Lock className="w-4 h-4" />
              Lock In
            </button>

            {/* Wallet Info (Top Right) */}
            <div
              ref={walletRef}
              className="flex items-center gap-2.5 bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 rounded-2xl shadow-inner"
            >
              <Image
                src="/coin2.png"
                alt="Gryphon Coins"
                width={28}
                height={28}
                className="object-contain drop-shadow-md animate-pulse"
                priority
              />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-500">Wallet</p>
                <p className="text-base font-black font-[Epilogue] text-yellow-400">
                  {remainingCoins}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game board: scattered/distributed circles */}
      <div className="max-w-5xl mx-auto px-6 py-12 pb-32">
        <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
          {(skills || []).map((skill, index) => {
            const skillCount = selections[skill.id] || 0;
            const isSelected = skillCount > 0;
            const votes = getSkillVotes(skill.id);
            
            // Generate some playful styling based on the index
            const delay = `${(index % 5) * 0.3}s`;
            
            return (
              <div
                key={skill.id}
                onClick={(e) => addCoin(skill.id, e)}
                onMouseEnter={() => setHoveredSkill(skill.id)}
                onMouseLeave={() => setHoveredSkill(null)}
                className={`relative rounded-full flex flex-col items-center justify-center text-center p-4 aspect-square w-28 h-28 sm:w-36 sm:h-36 transition-all duration-300 float-bubble border ${
                  isSelected
                    ? "border-2 scale-[1.05] shadow-lg"
                    : "hover:scale-[1.03]"
                } ${isSynergy || isMasterclass ? "backdrop-blur-sm" : ""} ${
                  !isSelected && !canSelect ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                } ${cardBg}`}
                style={{
                  animationDelay: delay,
                  borderColor: isSelected ? accentColor : undefined,
                  boxShadow: isSelected ? `0 0 25px ${accentColor}44` : undefined,
                }}
              >
                {/* Skill Name */}
                <p className={`text-xs sm:text-sm font-bold font-[Epilogue] leading-tight px-1 ${textColor}`}>
                  {skill.name}
                </p>

                {/* Votes Count (if any) */}
                {votes > 0 && (
                  <span className={`absolute top-2 text-[9px] font-bold font-[Epilogue] px-1.5 py-0.5 rounded-full bg-white/10 ${textMuted}`}>
                    {votes} votes
                  </span>
                )}

                {/* Coin Badge showing selection multiplier */}
                {isSelected && (
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-yellow-500 border-2 border-white flex items-center justify-center shadow-lg animate-bounce">
                    <Image src="/coin2.png" alt="coin" width={18} height={18} />
                    {skillCount > 1 && (
                      <span className="absolute -top-2.5 -right-2 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white">
                        x{skillCount}
                      </span>
                    )}
                  </div>
                )}

                {/* Minus Button Overlay (to remove one coin) */}
                {isSelected && (
                  <button
                    onClick={(e) => removeCoin(skill.id, e)}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-white border border-white/20 flex items-center justify-center shadow-md transition-transform active:scale-90"
                    title="Remove 1 Coin"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

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
          <div className={`w-full max-w-sm rounded-2xl p-6 border ${cardBg} backdrop-blur-xl`}>
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
                    <strong className={textColor}>{totalPicks}</strong> bids
                  </p>
                </div>

                {/* Selected skills preview */}
                <div className="space-y-2 mb-6 max-h-32 overflow-y-auto">
                  {skills
                    ?.filter((s) => (selections[s.id] || 0) > 0)
                    .map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-white/5"
                      >
                        <span className={`text-sm font-[Epilogue] ${textColor}`}>{skill.name}</span>
                        <div className="flex items-center gap-1.5">
                          <Image src="/coin2.png" alt="coin" width={14} height={14} />
                          <span className={`text-xs font-semibold font-[Epilogue] ${textColor}`}>
                            {skillCost * (selections[skill.id] || 0)}
                          </span>
                          {selections[skill.id] > 1 && (
                            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-md text-white/70">
                              {selections[skill.id]} bids
                            </span>
                          )}
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
