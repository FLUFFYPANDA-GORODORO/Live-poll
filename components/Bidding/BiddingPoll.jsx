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
  const [particles, setParticles] = useState([]);
  const [rings, setRings] = useState([]);

  const EMOJI_COLORS = {
    "❤️": "#f43f5e",
    "🔥": "#f97316",
    "👏": "#eab308",
    "😂": "#eab308",
    "🤯": "#eab308"
  };

  const handleEmojiClick = (e, emoji) => {
    sendEmoji?.(poll?.id, emoji);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const color = EMOJI_COLORS[emoji] || "#fff";

    const newParticles = [];
    const count = 10;
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.5;
      const distance = 25 + Math.random() * 25;
      const dx = `${Math.cos(angle) * distance}px`;
      const dy = `${-60 - Math.random() * 60}px`;
      const size = 6 + Math.random() * 6;

      newParticles.push({
        id: `${now}-${i}-${Math.random()}`,
        x,
        y,
        dx,
        dy,
        size,
        color,
      });
    }

    const ringId = `${now}-ring-${Math.random()}`;
    setRings((prev) => [...prev, { id: ringId, x, y, color }]);
    setParticles((prev) => [...prev, ...newParticles]);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => Date.now() - parseInt(p.id.split("-")[0], 10) < 1000));
    }, 1000);

    setTimeout(() => {
      setRings((prev) => prev.filter((r) => r.id !== ringId));
    }, 1000);
  };

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
    let titleText = "Thank You for Your Participation";
    let subTitleText = "The Live Poll has Ended";
    if (isMasterclass) {
      titleText = "Thank You for Your Participation";
      subTitleText = "The Live Poll of Masterclass 3.0 has Ended";
    } else if (isSynergy) {
      titleText = "Thank You for Your Participation";
      subTitleText = "The Live Poll of Synergy Sphere has Ended";
    }

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

        {/* Ending Screen Text Only */}
        <div className="max-w-4xl text-center mx-auto my-auto z-10 relative w-full px-6 flex flex-col justify-center items-center">
          <h1 className={`text-4xl md:text-6xl text-white leading-tight drop-shadow-2xl tracking-wide select-none ${
            isMasterclass || isSynergy ? "font-baskerville font-light" : "font-extrabold"
          }`}>
            {titleText}
          </h1>
          <p className={`mt-4 opacity-85 tracking-widest uppercase text-sm md:text-base font-epilogue ${
            isMasterclass ? "text-emerald-350" : isSynergy ? "text-rose-400" : "text-zinc-300"
          }`}>
            {subTitleText}
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
          {/* Remaining Budget Bar */}
          <div className="w-full bg-white rounded-xl p-4 mb-3.5 shadow-md border border-slate-200 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-sm animate-pulse" />
                  <img
                    src="/coin2.png"
                    alt="Coin"
                    className="w-12 h-12 object-contain relative z-10 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-transparent select-none uppercase tracking-widest leading-none mb-1">
                    Available Balance
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black leading-none text-slate-800 tracking-tight">
                      {remainingCoins}
                    </span>
                    <span className="text-xs font-bold text-slate-500 tracking-wider">
                      COINS
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex flex-col items-end">
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider opacity-0 select-none border ${
                  remainingCoins === 0 
                    ? "bg-slate-100 text-slate-500 border-slate-200" 
                    : isSynergy 
                      ? "bg-rose-50 text-rose-600 border-rose-100" 
                      : "bg-emerald-50 text-emerald-600 border-emerald-100"
                }`}>
                  {remainingCoins === 0 ? "Allocated" : "Bidding"}
                </span>
                <span className="text-[10px] font-bold text-slate-400 mt-1">
                  {10 - remainingCoins} / 10 Spent
                </span>
              </div>
            </div>

            {/* Custom Visual Budget Bar (10 segments) */}
            <div className="flex gap-1 w-full h-2 bg-slate-100 rounded-full p-[2px]">
              {Array.from({ length: 10 }).map((_, idx) => {
                const isRemaining = idx < remainingCoins;
                return (
                  <div
                    key={idx}
                    className={`flex-1 h-full rounded-full transition-all duration-300 ${
                      isRemaining
                        ? isSynergy
                          ? "bg-gradient-to-r from-rose-500 to-amber-500 shadow-[0_0_4px_rgba(244,63,94,0.3)]"
                          : "bg-gradient-to-r from-emerald-500 to-amber-500 shadow-[0_0_4px_rgba(16,185,129,0.3)]"
                        : "bg-slate-200"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Main Question & Stepper Card */}
          <div className="w-full bg-white text-slate-900 rounded-md p-3.5 shadow-md border border-slate-200 relative flex flex-col">
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
                      className={`w-full py-1.5 px-2.5 rounded-md border border-slate-200 transition-all flex items-center justify-between text-[11px] ${currentBid > 0
                        ? (isSynergy
                          ? "bg-rose-50/50 text-rose-950 font-bold"
                          : "bg-emerald-50/50 text-emerald-950 font-bold")
                        : "text-slate-700 bg-slate-50/40"
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
                <div className="w-full py-2 bg-emerald-50 text-emerald-700 font-bold rounded-md text-center text-xs border border-emerald-100 flex items-center justify-center gap-1.5">
                  <span>Bids Submitted Successfully</span>
                  <span className="text-sm font-black">✓</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitBids}
                  disabled={isSubmitting}
                  className={`w-full py-2 disabled:bg-slate-300 text-white font-bold rounded-md text-center text-xs transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5 ${isSynergy
                    ? "bg-rose-600 hover:bg-rose-500"
                    : isMasterclass
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : "bg-slate-800 hover:bg-slate-700"
                    }`}
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

          {/* Emoji Reactions Panel */}
          {poll?.status === "live" && poll?.status !== undefined && (
            <div className="p-2 mt-4 flex items-center justify-center gap-2 w-full mx-auto animate-fade-in z-20 relative rounded-md">
              {["❤️", "🔥", "👏", "😂", "🤯"].map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={(e) => handleEmojiClick(e, emoji)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl hover:scale-125 active:scale-95 transition-all duration-150 cursor-pointer ${isSynergy || isMasterclass
                    ? "hover:bg-white/10 active:bg-white/20"
                    : "hover:bg-slate-100 active:bg-slate-200"
                    }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
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
      {/* Particles and Ripples Portal */}
      <BiddingPollParticlesPortal particles={particles} rings={rings} />
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

  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        disabled={isQuestionSubmitted || currentBid <= 0}
        onClick={decrement}
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
        onClick={increment}
        className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-extrabold rounded-md text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none"
      >
        +
      </button>
    </div>
  );
}

// Particle rendering portal
export function BiddingPollParticlesPortal({ particles = [], rings = [] }) {
  return (
    <>
      {/* Floating click particles portal */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="emoji-particle"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            "--dx": p.dx,
            "--dy": p.dy,
            boxShadow: `0 0 8px ${p.color}`,
            position: "fixed",
            zIndex: 9999,
          }}
        />
      ))}

      {/* Expanding click rings portal */}
      {rings.map((r) => (
        <span
          key={r.id}
          className="emoji-click-ring"
          style={{
            left: r.x,
            top: r.y,
            borderColor: r.color,
            boxShadow: `0 0 10px ${r.color}, inset 0 0 10px ${r.color}`,
            position: "fixed",
            zIndex: 9998,
          }}
        />
      ))}

      <style>{`
        @keyframes particle-up {
          0% {
            transform: translate(-50%, -50%) translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translate(var(--dx), var(--dy)) scale(0.2);
            opacity: 0;
          }
        }
        @keyframes ring-expand {
          0% {
            width: 0px;
            height: 0px;
            opacity: 1;
            border-width: 6px;
          }
          100% {
            width: 80px;
            height: 80px;
            opacity: 0;
            border-width: 2px;
          }
        }
        .emoji-particle {
          position: fixed;
          pointer-events: none;
          border-radius: 50%;
          animation: particle-up 0.8s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
        }
        .emoji-click-ring {
          position: fixed;
          pointer-events: none;
          border-style: solid;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          animation: ring-expand 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }
      `}</style>
    </>
  );
}
