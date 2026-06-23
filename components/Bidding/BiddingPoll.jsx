"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Trophy, Info } from "lucide-react";
import toast from "react-hot-toast";

// Simple debounce helper
const useDebounce = () => {
  const timeoutRef = useRef(null);
  return useCallback((callback, delay) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(callback, delay);
  }, []);
};

export default function BiddingPoll({
  poll,
  sessionId,
  theme,
  sendEmoji,
  activeQuestionIndex = -1,
  currentCohort = "",
  sendBidChange,
  placeBid,
}) {
  const [transactions, setTransactions] = useState({}); // { [questionIdx_skillId]: amount }
  const [submittedQuestions, setSubmittedQuestions] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debounceCall = useDebounce();

  const isSynergy = currentCohort ? currentCohort.toUpperCase() === "HR" : theme === "synergy_sphere";
  const isMasterclass = currentCohort ? currentCohort.toUpperCase() === "ACADEMIA" : theme === "masterclass";

  // Load transactions and submitted status from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTransactions = JSON.parse(localStorage.getItem("bidding_transactions_v2") || "{}");
      setTransactions(savedTransactions);
      const savedSubmitted = JSON.parse(localStorage.getItem("bidding_submitted_v2") || "{}");
      setSubmittedQuestions(savedSubmitted);
    }
  }, []);

  const saveTransactions = (newTxs) => {
    setTransactions(newTxs);
    localStorage.setItem("bidding_transactions_v2", JSON.stringify(newTxs));
  };

  // Calculate remaining coins: 100 - sum of all bids
  const totalSpent = Object.values(transactions).reduce((sum, val) => sum + val, 0);
  const remainingCoins = 100 - totalSpent;

  // Active question details from the presenter state
  const activeQuestion = poll?.questions?.[activeQuestionIndex];
  const activeSkills = activeQuestion?.skills || [];

  const handleSendCoinReaction = () => {
    sendEmoji?.(poll?.id, "coin2");
  };

  const handleSetBid = (skillId, val) => {
    const key = `${activeQuestionIndex}_${skillId}`;
    const currentBid = transactions[key] || 0;
    
    const maxAllowed = currentBid + remainingCoins;
    const newBid = Math.min(maxAllowed, Math.max(0, val));

    const updatedTransactions = {
      ...transactions,
      [key]: newBid,
    };
    if (newBid === 0) {
      delete updatedTransactions[key];
    }

    saveTransactions(updatedTransactions);
  };

  const isQuestionSubmitted = submittedQuestions[activeQuestionIndex] === true;

  const handleSubmitBids = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const activeQuestionBids = activeSkills.map(skill => ({
        biddingSkillId: skill.id,
        coinsSpent: transactions[`${activeQuestionIndex}_${skill.id}`] || 0
      }));

      // Submit bids SEQUENTIALLY (not in parallel) to prevent a race condition
      // where concurrent PlaceBidAsync calls read the tracker before seeing each
      // other's bids, potentially bypassing the 100-coin budget validation.
      for (const bid of activeQuestionBids) {
        await placeBid?.(poll?.id, {
          questionIndex: activeQuestionIndex,
          sessionId,
          cohort: currentCohort || "HR",
          biddingSkillId: bid.biddingSkillId,
          coinsSpent: bid.coinsSpent
        });
      }

      // After successful submission, broadcast final bid amounts to trigger
      // coin shooting animation on the presenter screen
      for (const bid of activeQuestionBids) {
        if (bid.coinsSpent > 0) {
          sendBidChange?.(poll?.id, activeQuestionIndex, sessionId, bid.biddingSkillId, bid.coinsSpent);
        }
      }

      // Save submission state locally
      const newSubmitted = { ...submittedQuestions, [activeQuestionIndex]: true };
      setSubmittedQuestions(newSubmitted);
      localStorage.setItem("bidding_submitted_v2", JSON.stringify(newSubmitted));

      toast.success("Bids submitted successfully!");
    } catch (err) {
      toast.error("Failed to submit bids: " + (err.message || err));
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerBgStyle = isSynergy
    ? { backgroundImage: "url('/SynegrysphereBG.png')", backgroundSize: "cover", backgroundPosition: "center" }
    : isMasterclass
    ? { backgroundImage: "url('/MasterClassNewBg.png')", backgroundSize: "cover", backgroundPosition: "center" }
    : { background: "radial-gradient(circle at center, #102c1b 0%, #040f08 100%)" };

  return (
    <div
      className="h-screen w-full relative flex flex-col items-center justify-between py-4 px-4 font-[Epilogue] text-white overflow-hidden select-none"
      style={containerBgStyle}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/45 pointer-events-none z-0" />

      {/* Top Header Logos */}
      <div className="w-full max-w-md flex items-center justify-between z-10 shrink-0">
        <img
          src="/GryphonWhite.png"
          alt="Gryphon Logo"
          className="h-8 w-auto object-contain filter drop-shadow-md"
        />
        {isSynergy ? (
          <img src="/SNSlogo.png" alt="Synergy Sphere" className="h-8 w-auto object-contain" />
        ) : (
          <img src="/mc01.png" alt="Masterclass 3.0" className="h-8 w-auto object-contain" />
        )}
      </div>

      {/* Standby/Waiting Screen when no question is active */}
      {activeQuestionIndex === -1 ? (
        <div className="w-full max-w-md bg-white/95 text-slate-900 rounded-[28px] p-6 shadow-2xl z-10 text-center border border-white/10 my-auto flex flex-col justify-center items-center backdrop-blur-md">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-emerald-600 animate-pulse" />
          </div>
          <h2 className="text-xl font-black mb-2 text-slate-950">
            Waiting Arena
          </h2>
          <p className="text-slate-500 text-xs mb-4 max-w-xs leading-relaxed">
            Waiting for the facilitator to open the cohort question...
          </p>
          <div className="flex items-center gap-2 text-slate-400 text-xs mt-2 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            <span>Ready to receive live questions</span>
          </div>
        </div>
      ) : (
        /* Active Question Bidding Screen */
        <div className="w-full max-w-md z-10 flex flex-col justify-center my-auto">
          {/* Dynamic Circular/Horizontal Budget Bar */}
          <div className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/coin2.png" alt="Coin" className="w-8 h-8 object-contain" />
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">Remaining Budget</span>
                <span className="text-base font-black text-yellow-400">{remainingCoins} Coins</span>
              </div>
            </div>
            {/* Visual Progress Ring */}
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="18"
                  className="stroke-white/10"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="18"
                  className="stroke-amber-400 transition-all duration-300"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 18}
                  strokeDashoffset={2 * Math.PI * 18 * (1 - remainingCoins / 100)}
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-white">{remainingCoins}%</span>
            </div>
          </div>

          {/* Main Question & Stepper Card */}
          <div className="w-full bg-white text-slate-900 rounded-[28px] p-5 shadow-2xl border border-slate-100 relative flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full">
                Cohort: {currentCohort || "General"}
              </span>
            </div>

            <h2 className="text-lg font-black text-slate-950 mb-4 leading-tight text-center">
              {activeQuestion?.text || activeQuestion?.title}
            </h2>

            {/* Steppers Option List */}
            <div className="space-y-2.5 mb-2 max-h-[45vh] overflow-y-auto pr-1">
              {activeSkills.length === 0 ? (
                <p className="text-slate-400 text-center text-xs py-8 italic">No options defined for this question.</p>
              ) : (
                activeSkills.map((skill) => {
                  const currentBid = transactions[`${activeQuestionIndex}_${skill.id}`] || 0;

                  return (
                    <div
                      key={skill.id}
                      className={`w-full p-3 rounded-xl border transition-all flex items-center justify-between text-xs ${
                        currentBid > 0
                          ? "border-emerald-500 bg-emerald-50/30 text-emerald-950 font-bold"
                          : "border-slate-100 text-slate-700 bg-slate-50/40"
                      }`}
                    >
                      <div className="pr-3 leading-snug flex-1">
                        <p className="font-semibold text-slate-800 text-sm">{skill.name}</p>
                      </div>

                      {/* Coins Input */}
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={currentBid || ""}
                          disabled={isQuestionSubmitted}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            handleSetBid(skill.id, val);
                          }}
                          className="w-16 text-center text-sm font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-lg py-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-75"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Submit Button */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col items-center">
              {isQuestionSubmitted ? (
                <div className="w-full py-3 bg-emerald-50 text-emerald-700 font-bold rounded-xl text-center text-sm border border-emerald-100 flex items-center justify-center gap-2">
                  <span>Bids Submitted Successfully</span>
                  <span className="text-base font-black">✓</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitBids}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-bold rounded-xl text-center text-sm transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Bids...</span>
                    </>
                  ) : (
                    <span>Submit Bids</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Static Floating Coin Reaction Button (Bottom Right Corner) */}
      <div className="fixed bottom-4 right-4 z-40 shrink-0">
        <button
          onClick={handleSendCoinReaction}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 border-2 border-yellow-300 flex items-center justify-center shadow-lg transition-transform active:scale-90"
          title="Spam Coin to Presenter"
        >
          <img src="/coin2.png" alt="Coin Reaction" className="w-8 h-8 object-contain" />
        </button>
      </div>
    </div>
  );
}
