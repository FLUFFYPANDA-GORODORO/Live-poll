"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Trophy, Info, QrCode, X } from "lucide-react";
import toast from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";

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

const SPRITE_SEQUENCE = [
  "/character/CharacterSpriteU.png",
  "/character/CharacterSprite2U.png",
  "/character/CharacterSprite3U.png",
  "/character/CharacterSprite2U.png",
  "/character/CharacterSpriteU.png",
  "/character/CharacterSprite4U.png"
];

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
  const [showQr, setShowQr] = useState(false);
  const [spriteIndex, setSpriteIndex] = useState(0);
  const debounceCall = useDebounce();

  useEffect(() => {
    SPRITE_SEQUENCE.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    const interval = setInterval(() => {
      setSpriteIndex((prev) => (prev + 1) % SPRITE_SEQUENCE.length);
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const isSynergy = theme === "synergy_sphere";
  const isMasterclass = theme === "masterclass";

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

  // Calculate remaining coins: 10 - sum of bids for this active question
  const activeQuestionTxs = Object.entries(transactions)
    .filter(([key]) => key.startsWith(`${activeQuestionIndex}_`))
    .map(([_, val]) => val);
  const totalSpent = activeQuestionTxs.reduce((sum, val) => sum + val, 0);
  const remainingCoins = 10 - totalSpent;

  // Active question details from the presenter state
  const activeQuestion = poll?.questions?.[activeQuestionIndex];
  const activeSkills = activeQuestion?.skills || [];

  const handleSendCoinReaction = () => {
    sendEmoji?.(poll?.id, "coin2");
  };

  const stateRef = useRef({ transactions, remainingCoins, activeQuestionIndex });
  useEffect(() => {
    stateRef.current = { transactions, remainingCoins, activeQuestionIndex };
  }, [transactions, remainingCoins, activeQuestionIndex]);

  const changeBidBy = useCallback((skillId, delta) => {
    const { transactions: txs, remainingCoins: coins, activeQuestionIndex: qIdx } = stateRef.current;
    const key = `${qIdx}_${skillId}`;
    const currentBid = txs[key] || 0;

    const maxAllowed = currentBid + coins;
    const newBid = Math.max(0, Math.min(maxAllowed, currentBid + delta));

    const updatedTransactions = {
      ...txs,
      [key]: newBid,
    };
    if (newBid === 0) {
      delete updatedTransactions[key];
    }

    saveTransactions(updatedTransactions);
  }, []);

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

  // Inject Google Fonts and define global CSS for bidding-poll-container
  useEffect(() => {
    const fontId = "bidding-poll-fonts";
    if (!document.getElementById(fontId)) {
      const link = document.createElement("link");
      link.id = fontId;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Epilogue:wght@300;400;500;600;700;800;900&display=swap";
      document.head.appendChild(link);
    }

    const styleId = "bidding-poll-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .bidding-poll-container {
          font-family: 'Epilogue', sans-serif !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const containerBgStyle = isSynergy || isMasterclass
    ? {}
    : { background: "radial-gradient(circle at center, #102c1b 0%, #040f08 100%)" };

  const responsiveBgClass = isSynergy
    ? "bg-[url('/SynergySphereMobileBg.png')] md:bg-[url('/SynegrysphereBG.png')] bg-cover bg-center bg-no-repeat"
    : isMasterclass
      ? "bg-[url('/MasterclassMobileBg.png')] md:bg-[url('/MasterClassNewBg.png')] bg-cover bg-center bg-no-repeat"
      : "";

  const isBiddingClosed = poll?.biddingClosed;

  if (isBiddingClosed) {
    return (
      <div
        className="bidding-poll-container h-screen w-full relative flex flex-col items-center justify-between py-2.5 px-3 md:py-4 md:px-4 text-white overflow-hidden select-none"
        style={isSynergy
          ? { backgroundImage: "url('/SynegrysphereBG.png')", backgroundSize: "cover", backgroundPosition: "center" }
          : isMasterclass
            ? { backgroundImage: "url('/MasterClassNewBg.png')", backgroundSize: "cover", backgroundPosition: "center" }
            : { background: "radial-gradient(circle at center, #102c1b 0%, #040f08 100%)" }}
      >
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-black/45 pointer-events-none z-0" />

        {/* Top Header Logos */}
        <div className="w-full max-w-md flex items-center justify-between z-10 shrink-0">
          <img
            src="/GryphonWhite.png"
            alt="Gryphon Logo"
            className="h-10 w-auto object-contain filter drop-shadow-md"
          />
          {isSynergy ? (
            <img src="/SNSlogo.png" alt="Synergy Sphere" className="h-10 w-auto object-contain" />
          ) : (
            <img src="/mc01.png" alt="Masterclass 3.0" className="h-10 w-auto object-contain" />
          )}
        </div>

        {/* Ending Screen Card */}
        <div className="w-full max-w-md bg-white/95 text-slate-900 rounded-[28px] p-6 shadow-2xl border border-slate-100 z-10 text-center my-auto flex flex-col justify-center items-center backdrop-blur-md">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-emerald-600 animate-bounce" />
          </div>
          <h2 className="text-xl font-black mb-2 text-slate-950">
            Bidding Concluded!
          </h2>
          <p className="text-slate-500 text-xs mb-4 max-w-xs leading-relaxed">
            Thank you for participating in the Skill Bidding Arena. Your final allocations have been locked.
          </p>
          <p className="text-slate-400 text-[10px] italic">
            Check the presenter screen to see the final results!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bidding-poll-container h-screen w-full relative flex flex-col items-center justify-between py-2.5 px-3 md:py-4 md:px-4 text-white overflow-hidden select-none ${responsiveBgClass}`}
      style={containerBgStyle}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/45 pointer-events-none z-0" />

      {/* Top Header Logos */}
      <div className="w-full max-w-md flex items-center justify-between z-10 shrink-0">
        <img
          src="/GryphonWhite.png"
          alt="Gryphon Logo"
          className="h-10 w-auto object-contain filter drop-shadow-md"
        />
        {isSynergy ? (
          <img src="/SNSlogo.png" alt="Synergy Sphere" className="h-10 w-auto object-contain" />
        ) : (
          <img src="/mc01.png" alt="Masterclass 3.0" className="h-10 w-auto object-contain" />
        )}
      </div>

      {/* Standby/Waiting Screen when no question is active */}
      {activeQuestionIndex === -1 ? (
        <div className="w-full max-w-md z-10 my-auto flex flex-col items-center">
          {/* Poll Title */}
          <h1 className="text-white text-xl md:text-2xl font-bold uppercase tracking-widest text-center mt-4 px-4 leading-tight font-mono filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            {poll?.title?.replace(/ ~(SS|MC)$/, "") || "Skill Bidding"}
          </h1>

          {/* Scroll container containing instructions */}
          <div className="w-[calc(100%+1.5rem)] md:w-[calc(100%+2rem)] -mx-3 md:-mx-4 flex flex-col mt-6 relative select-none">
            {/* Scroll Top */}
            <img 
              src={isSynergy ? "/GameSprites/LogFire.webp" : "/GameSprites/ScrollTop.webp"} 
              alt="Scroll Top" 
              className="w-full h-auto object-contain block select-none pointer-events-none relative z-10" 
              style={{ transform: "scale(1.1)", transformOrigin: "bottom center", filter: "drop-shadow(0 6px 4px rgba(0,0,0,0.35))" }}
            />
            
            {/* Scroll Middle (CSS Parchment) */}
            <div 
              className="w-full px-6 py-5 md:py-8 flex flex-col relative z-0 retro-scroll-middle"
              style={{
                backgroundColor: "#dfcaa7",
                backgroundImage: isSynergy 
                  ? "linear-gradient(to bottom, rgba(249, 115, 22, 0.25) 0%, rgba(249, 115, 22, 0) 15%, rgba(59, 130, 246, 0) 85%, rgba(59, 130, 246, 0.25) 100%), linear-gradient(to right, rgba(74,44,15,0.15) 0%, rgba(255,255,255,0.1) 6%, rgba(255,255,255,0.2) 12%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 75%, rgba(255,255,255,0.2) 88%, rgba(255,255,255,0.1) 94%, rgba(74,44,15,0.15) 100%)"
                  : "linear-gradient(to right, rgba(74,44,15,0.15) 0%, rgba(255,255,255,0.1) 6%, rgba(255,255,255,0.2) 12%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 75%, rgba(255,255,255,0.2) 88%, rgba(255,255,255,0.1) 94%, rgba(74,44,15,0.15) 100%)",
                boxShadow: "inset 10px 0 15px -10px rgba(0,0,0,0.5), inset -10px 0 15px -10px rgba(0,0,0,0.5)",
                marginTop: isSynergy ? "-12%" : "-6%",
                marginBottom: "-6%"
              }}
            >
              <style>{`
                .retro-scroll-middle {
                  padding-top: ${isSynergy ? "2.5rem" : "1.25rem"} !important;
                }
                @media (min-height: 720px) {
                  .retro-scroll-middle {
                    padding-top: ${isSynergy ? "3.75rem" : "2.25rem"} !important;
                    padding-bottom: 2.25rem !important;
                  }
                  .retro-instructions {
                    padding-top: 1.25rem !important;
                    padding-bottom: 1.25rem !important;
                    gap: 0.75rem !important;
                  }
                  .retro-instruction-list {
                    margin-top: 0.5rem !important;
                    gap: 0.75rem !important;
                  }
                  .retro-sprite-container {
                    margin-top: 1.5rem !important;
                  }
                  .retro-sprite {
                    height: 5.5rem !important;
                  }
                  .retro-title {
                    font-size: 0.875rem !important;
                  }
                  .retro-desc {
                    font-size: 0.75rem !important;
                  }
                  .retro-item-text {
                    font-size: 0.75rem !important;
                  }
                }
              `}</style>

              {/* Top Half: Welcome */}
              <div className="text-center pb-3 border-b-2 border-dashed border-amber-950/20 flex flex-col items-center pt-0 font-mono">
                <h2 className="text-xs md:text-sm font-bold text-amber-950 leading-tight uppercase tracking-widest -mt-1.5 retro-title">
                  {isMasterclass ? "Masterclass Bidding Arena" : isSynergy ? "Synergy Sphere Bidding Arena" : "Bidding Arena"}
                </h2>
                <div className="text-[9px] text-amber-950/40 my-0.5">✦ ✦ ✦</div>
                <p className="text-amber-900 text-[10px] font-semibold uppercase tracking-wider retro-desc">
                  The bidding session will begin shortly
                </p>
              </div>

              {/* Bottom Half: Instructions */}
              <div className="py-3 flex flex-col gap-2 pb-1 font-mono retro-instructions">
                <span className="text-[9px] font-bold text-amber-900/70 uppercase tracking-widest block text-center mb-0.5">
                  -- INSTRUCTIONS --
                </span>
                
                <div className="space-y-2 retro-instruction-list">
                  <div className="flex gap-2 items-start">
                    <span className="text-amber-950 font-black text-xs shrink-0 select-none">[1]</span>
                    <p className="text-[10.5px] text-amber-950 font-bold uppercase tracking-wide leading-snug retro-item-text">
                      You are given a set of <span className="underline decoration-2 decoration-amber-950">questions</span>.
                    </p>
                  </div>

                  <div className="flex gap-2 items-start">
                    <span className="text-amber-950 font-black text-xs shrink-0 select-none">[2]</span>
                    <p className="text-[10.5px] text-amber-950 font-bold uppercase tracking-wide leading-snug retro-item-text">
                      You can spend <span className="underline decoration-2 decoration-amber-950">10 coins per question</span>. Spend it on the best skill that you think are the most valueable!
                    </p>
                  </div>

                  <div className="flex gap-2 items-start">
                    <span className="text-amber-950 font-black text-xs shrink-0 select-none">[3]</span>
                    <p className="text-[10.5px] text-amber-950 font-bold uppercase tracking-wide leading-snug retro-item-text">
                      SUBMIT YOUR BIDS FOR EACH QUESTION AS THEY GO LIVE!
                    </p>
                  </div>
                </div>

                {/* Looping Character Sprite */}
                <div className="flex justify-center mt-4 mb-0.5 retro-sprite-container">
                  <img
                    src={SPRITE_SEQUENCE[spriteIndex]}
                    alt="Character Sprite"
                    className="h-16 md:h-20 w-auto object-contain select-none pointer-events-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] retro-sprite"
                  />
                </div>
              </div>
            </div>

            {/* Scroll Bottom */}
            <img 
              src={isSynergy ? "/GameSprites/logfreeze.webp" : "/GameSprites/ScrollBottom.webp"} 
              alt="Scroll Bottom" 
              className="w-full h-auto object-contain block select-none pointer-events-none relative z-10" 
              style={{ transform: "scale(1.1)", transformOrigin: "top center", filter: "drop-shadow(0 -6px 4px rgba(0,0,0,0.35))" }}
            />
          </div>

          {/* QR Code Button at bottom right */}
          <button
            onClick={() => setShowQr(true)}
            className="absolute bottom-3 right-3 md:bottom-4 md:right-4 bg-black/40 border border-white/10 text-white p-3 rounded-full hover:bg-black/60 transition-colors z-20 flex items-center justify-center shadow-lg cursor-pointer"
            title="Show Join QR Code"
          >
            <QrCode className="w-5 h-5 text-amber-400" />
          </button>
        </div>
      ) : (
        /* Active Question Bidding Screen */
        <div className="w-full max-w-md z-10 flex flex-col justify-center my-auto">
          {/* Dynamic Circular/Horizontal Budget Bar */}
          <div className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl py-2.5 px-4 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/coin2.png" alt="Coin" className="w-8 h-8 object-contain" />
              <div className="text-left flex flex-col justify-center leading-none">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-white/50 mb-1">Remaining Budget</span>
                <span className="text-base font-extrabold text-amber-400">{remainingCoins} Coins</span>
              </div>
            </div>
            {/* Visual Progress Ring */}
            <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
              <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 40 40">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  className="stroke-white/10"
                  strokeWidth="3.5"
                  fill="transparent"
                />
                <circle
                  strokeDasharray={2 * Math.PI * 16}
                  strokeDashoffset={2 * Math.PI * 16 * (1 - remainingCoins / 10)}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-[9px] font-extrabold text-white">{Math.round((remainingCoins / 10) * 100)}%</span>
            </div>
          </div>

          {/* Main Question & Stepper Card */}
          <div className="w-full bg-white text-slate-900 rounded-2xl p-3.5 shadow-2xl border border-slate-100 relative flex flex-col">
            <h2 className="text-sm font-black text-slate-950 mb-2.5 leading-tight text-center">
              {activeQuestion?.text || activeQuestion?.title}
            </h2>

            {/* Steppers Option List */}
            <div className="space-y-1.5 mb-2 max-h-[50vh] overflow-y-auto pr-1">
              {activeSkills.length === 0 ? (
                <p className="text-slate-400 text-center text-xs py-8 italic">No options defined for this question.</p>
              ) : (
                activeSkills.map((skill) => {
                  const currentBid = transactions[`${activeQuestionIndex}_${skill.id}`] || 0;

                  return (
                    <div
                      key={skill.id}
                      className={`w-full py-1.5 px-2.5 rounded-lg border transition-all flex items-center justify-between text-[11px] ${currentBid > 0
                          ? "border-emerald-500 bg-emerald-50/30 text-emerald-950 font-bold"
                          : "border-slate-100 text-slate-700 bg-slate-50/40"
                        }`}
                    >
                      <div className="pr-3 leading-snug flex-1">
                        <p className="font-semibold text-slate-800 text-xs">{skill.name}</p>
                      </div>

                      {/* Coins Input with Stepper Buttons */}
                      <BiddingStepper
                        skillId={skill.id}
                        currentBid={currentBid}
                        remainingCoins={remainingCoins}
                        isQuestionSubmitted={isQuestionSubmitted}
                        changeBidBy={changeBidBy}
                      />
                    </div>
                  );
                })
              )}
            </div>

            {/* Submit Button */}
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col items-center">
              {isQuestionSubmitted ? (
                <div className="w-full py-2 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-center text-xs border border-emerald-100 flex items-center justify-center gap-1.5">
                  <span>Bids Submitted Successfully</span>
                  <span className="text-sm font-black">✓</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitBids}
                  disabled={isSubmitting}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-bold rounded-lg text-center text-xs transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
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

      {/* QR Modal Overlay */}
      {showQr && (
        <div 
          onClick={() => setShowQr(false)}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl p-6 max-w-sm w-full flex flex-col items-center relative shadow-2xl border-4 border-amber-950 font-mono"
            style={{
              backgroundColor: "#dfcaa7",
              backgroundImage: "linear-gradient(to right, rgba(74,44,15,0.08) 0%, rgba(255,255,255,0.05) 6%, rgba(255,255,255,0.1) 12%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 75%, rgba(255,255,255,0.1) 88%, rgba(255,255,255,0.05) 94%, rgba(74,44,15,0.08) 100%)",
              boxShadow: "inset 0 0 20px rgba(74,44,15,0.2), 0 20px 25px -5px rgba(0,0,0,0.5)"
            }}
          >
            {/* Retro Close Button */}
            <button
              onClick={() => setShowQr(false)}
              className="absolute top-4 right-4 text-amber-950 hover:text-amber-900 font-black text-sm p-1 cursor-pointer select-none"
            >
              [X]
            </button>

            {/* QR Title */}
            <h3 className="text-amber-950 font-extrabold text-sm text-center mb-1 uppercase tracking-widest">
              -- SCAN TO JOIN --
            </h3>
            <p className="text-amber-900/70 text-[10px] text-center mb-6 uppercase tracking-wider font-semibold">
              Scan code to participate
            </p>

            {/* QR SVG */}
            <div className="bg-[#f2e5d0] p-4 rounded-xl border-2 border-amber-950/20 flex items-center justify-center mb-6 shadow-inner">
              <QRCodeSVG 
                value={typeof window !== "undefined" ? window.location.href : ""} 
                size={200}
                level="H"
                bgColor="#f2e5d0"
                fgColor="#2d1704"
              />
            </div>

            {/* Room Code Indicator */}
            <div className="w-full text-amber-950 text-xs font-bold text-center uppercase tracking-widest">
              [ ROOM ID: <span className="underline decoration-2 decoration-amber-950">{poll?.id}</span> ]
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BiddingStepper({ skillId, currentBid, remainingCoins, isQuestionSubmitted, changeBidBy }) {
  const increment = useCallback(() => {
    if (remainingCoins > 0) {
      changeBidBy(skillId, 1);
    }
  }, [skillId, remainingCoins, changeBidBy]);

  const decrement = useCallback(() => {
    if (currentBid > 0) {
      changeBidBy(skillId, -1);
    }
  }, [skillId, currentBid, changeBidBy]);

  const latestIncrement = useRef(increment);
  const latestDecrement = useRef(decrement);
  useEffect(() => {
    latestIncrement.current = increment;
    latestDecrement.current = decrement;
  }, [increment, decrement]);

  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const start = useCallback((type) => {
    stop();
    const execute = () => {
      if (type === "inc") latestIncrement.current();
      else if (type === "dec") latestDecrement.current();
    };
    execute();

    timerRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        execute();
      }, 70);
    }, 300);
  }, [stop]);

  // Clean up on unmount
  useEffect(() => stop, [stop]);

  const getHandlers = (type, disabled) => {
    if (disabled) return {};
    return {
      onMouseDown: () => start(type),
      onMouseUp: stop,
      onMouseLeave: stop,
      onTouchStart: (e) => {
        e.preventDefault();
        start(type);
      },
      onTouchEnd: stop,
      onTouchCancel: stop,
    };
  };

  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        disabled={isQuestionSubmitted || currentBid <= 0}
        {...getHandlers("dec", isQuestionSubmitted || currentBid <= 0)}
        className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-extrabold rounded-md text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none"
      >
        -
      </button>
      <input
        type="number"
        min={0}
        max={100}
        value={currentBid || ""}
        disabled={isQuestionSubmitted}
        onChange={(e) => {
          const val = parseInt(e.target.value, 10) || 0;
          changeBidBy(skillId, val - currentBid);
        }}
        className="w-10 text-center text-xs font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-md py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-75"
        placeholder="0"
      />
      <button
        type="button"
        disabled={isQuestionSubmitted || remainingCoins <= 0}
        {...getHandlers("inc", isQuestionSubmitted || remainingCoins <= 0)}
        className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-extrabold rounded-md text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none"
      >
        +
      </button>
    </div>
  );
}
