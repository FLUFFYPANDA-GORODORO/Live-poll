"use client";

import { useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  Minimize, 
  Square, 
  Users, 
  X,
  Sparkles
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

// Red/Rose gradients
const CHART_COLORS = [
  "linear-gradient(to top, #9f1239, #f43f5e)",
  "linear-gradient(to top, #be123c, #fb7185)",
  "linear-gradient(to top, #e11d48, #fda4af)",
  "linear-gradient(to top, #9f1239, #e11d48)"
];

export default function SynergySpherePresent({
  poll,
  cleanTitle,
  pollId,
  currentQuestionIndex,
  currentQuestion,
  totalQuestions,
  isVotingActive,
  showQR,
  setShowQR,
  isFullscreen,
  toggleFullscreen,
  totalVotes,
  getVoteCount,
  maxVotes,
  handlePrevQuestion,
  handleNextQuestion,
  handleStartVoting,
  handleStopVoting,
  handleEndPoll,
  pollUrl,
  router
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft" && currentQuestionIndex > 0) {
        handlePrevQuestion();
      } else if (e.key === "ArrowRight" && currentQuestionIndex < totalQuestions - 1) {
        handleNextQuestion();
      } else if (e.key.toLowerCase() === "k") {
        if (isVotingActive) {
          handleStopVoting();
        } else {
          handleStartVoting();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    currentQuestionIndex,
    totalQuestions,
    isVotingActive,
    handlePrevQuestion,
    handleNextQuestion,
    handleStartVoting,
    handleStopVoting,
  ]);

  return (
    <div className="h-screen max-h-screen bg-[url('/SSbackground.jpg')] bg-cover bg-center bg-no-repeat flex flex-col text-rose-50 font-sans overflow-y-auto relative">


      {/* Top Bar */}
      <header className="w-full z-20 relative bg-transparent">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <img src="/GryphonWhite.png" alt="Gryphon Logo" className="h-20 w-auto object-contain flex-shrink-0" />
          </div>

          <div className="flex items-center gap-3 justify-end flex-1 flex-shrink-0">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-stone-200 text-sm border border-white/5">
              <Users className="w-4 h-4 text-rose-400" />
              <span className="font-medium">{totalVotes}</span>
            </div>
            <button
              onClick={() => setShowQR(!showQR)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-rose-200 text-sm border border-white/5 transition-colors"
            >
              {showQR ? "Hide" : "Show"} QR
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-colors border border-white/5"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content (Centered & Clear) */}
      <main className="flex-1 flex flex-col justify-between px-6 md:px-12 pt-4 pb-20 z-10 relative max-w-7xl w-full mx-auto bg-black/20 backdrop-blur-[1px] rounded-3xl border border-white/5 shadow-2xl my-4">
        {/* QR Code */}
        {showQR && (
          <div className="absolute top-4 right-12 bg-black/80 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/10 flex flex-col items-center z-10">
            <div className="bg-white p-1.5 rounded-xl">
              <QRCodeSVG value={pollUrl} size={90} />
            </div>
            <p className="text-[10px] text-center mt-1.5 text-rose-300 font-mono font-bold tracking-wider">{pollId}</p>
          </div>
        )}

        {/* Question Title - Centered */}
        <div className="text-center w-full max-w-4xl mx-auto mb-3 mt-1">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight drop-shadow-lg tracking-tight">
            {currentQuestion?.text || "No question"}
          </h2>
          <div className="mt-3 text-stone-300 font-medium text-sm flex items-center justify-center gap-3">
            <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            {isVotingActive && (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                Live
              </span>
            )}
          </div>
        </div>

        {/* Massive Red Bars */}
        <div className="flex-1 flex items-end justify-center gap-6 md:gap-12 w-full max-w-7xl mx-auto my-auto mt-2">
          {currentQuestion?.options?.map((option, idx) => {
            const votes = getVoteCount(idx);
            const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const height = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;
            const gradient = CHART_COLORS[idx % CHART_COLORS.length];

            return (
              <div key={idx} className="flex flex-col items-center flex-1 max-w-[250px] h-[36vh] justify-end">
                {/* Percentage above bar */}
                <div className="text-white font-black text-3xl mb-3 drop-shadow-md">
                  {percentage}%
                </div>

                {/* Big Bar wrapper */}
                <div className="w-full relative flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-md transition-all duration-700 ease-out border-t border-rose-450/20"
                    style={{
                      height: `${height || 3}%`,
                      background: gradient,
                      boxShadow: votes > 0 ? `0 4px 25px #f43f5e50` : "none",
                    }}
                  />
                </div>

                {/* Label under bar */}
                <div className="text-center mt-2 w-full h-20 flex items-start justify-center">
                  <div className="text-stone-150 font-bold text-sm md:text-base lg:text-lg whitespace-normal break-words w-full drop-shadow-sm px-1" title={option.text}>
                    {option.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Control Buttons Tab (Fixed Bottom) */}
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-1.5 flex items-center gap-2 shadow-2xl">
        <button
          onClick={handlePrevQuestion}
          disabled={currentQuestionIndex <= 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-200 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all text-xs font-semibold"
        >
          <ChevronLeft className="w-4 h-4" />
          Prev
        </button>

        {isVotingActive ? (
          <button
            onClick={handleStopVoting}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all text-xs"
          >
            <Square className="w-3.5 h-3.5" />
            Stop
          </button>
        ) : (
          <button
            onClick={handleStartVoting}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all text-xs"
          >
            Start
          </button>
        )}

        <button
          onClick={handleNextQuestion}
          disabled={currentQuestionIndex >= totalQuestions - 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-200 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all text-xs font-semibold"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        <button
          onClick={handleEndPoll}
          className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/40 text-red-300 border border-red-900/30 transition-colors text-xs font-semibold"
        >
          End
        </button>
      </div>
    </div>
  );
}
