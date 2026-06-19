"use client";

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

// Synergy Sphere Dark Red/Rose Palette
const CHART_COLORS = [
  "#f43f5e", "#e11d48", "#be123c", "#9f1239",
  "#fda4af", "#f43f5e", "#fb7185", "#e11d48"
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
  return (
    <div className="min-h-screen bg-stone-900 flex flex-col text-rose-50 font-sans">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-500 animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight text-white">{cleanTitle}</h1>
            <span className="text-[10px] uppercase font-bold tracking-widest bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded border border-rose-500/30">
              Synergy Sphere
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-stone-850 px-3 py-1.5 rounded-full text-stone-300 text-sm border border-stone-800">
            <Users className="w-4 h-4 text-rose-400" />
            <span>{totalVotes} sphere votes</span>
          </div>
          <button
            onClick={() => setShowQR(!showQR)}
            className="px-3 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/50 text-rose-200 text-sm border border-rose-800/40 transition-colors"
          >
            {showQR ? "Hide" : "Show"} Join Code
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-stone-850 text-stone-300 hover:bg-stone-700 border border-stone-800"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-8 py-6 relative bg-gradient-to-br from-stone-950 via-stone-900 to-rose-950/30">
        {/* QR Code */}
        {showQR && (
          <div className="absolute top-4 right-8 bg-stone-950 p-4 rounded-2xl shadow-2xl border border-rose-900/30 flex flex-col items-center">
            <div className="bg-white p-2 rounded-xl">
              <QRCodeSVG value={pollUrl} size={110} />
            </div>
            <p className="text-[11px] text-center mt-2 text-rose-300 font-mono font-bold tracking-wider">
              {pollId}
            </p>
          </div>
        )}

        <div className="w-full max-w-4xl">
          {/* Question */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
              {currentQuestion?.text || "No question"}
            </h2>
            <div className="mt-4 text-stone-400 font-medium">
              Question {currentQuestionIndex + 1} of {totalQuestions}
              {isVotingActive && (
                <span className="ml-3 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-sm border border-rose-500/30">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  Live Voting Active
                </span>
              )}
            </div>
          </div>

          {/* Vertical Bar Chart */}
          <div className="flex items-end justify-center gap-6 md:gap-10 h-64 md:h-80">
            {currentQuestion?.options?.map((option, idx) => {
              const votes = getVoteCount(idx);
              const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
              const height = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;
              const color = CHART_COLORS[idx % CHART_COLORS.length];

              return (
                <div key={idx} className="flex flex-col items-center gap-3">
                  <div className="text-white font-extrabold text-xl">{votes}</div>
                  <div className="relative h-48 md:h-64 w-16 md:w-20 flex items-end">
                    <div
                      className="w-full rounded-t-xl transition-all duration-700 ease-out"
                      style={{
                        height: `${height}%`,
                        background: `linear-gradient(to top, ${color}cc, ${color})`,
                        minHeight: votes > 0 ? "12px" : "4px",
                        boxShadow: votes > 0 ? `0 0 20px ${color}50` : "none",
                        border: `1px solid ${color}80`
                      }}
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-stone-200 font-semibold text-sm md:text-base truncate max-w-[90px]">
                      {option.text}
                    </div>
                    <div className="text-rose-300 font-bold text-sm">{percentage}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer Controls */}
      <footer className="px-8 py-6 border-t border-stone-850 bg-stone-950">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex <= 0}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-stone-800 text-stone-300 hover:bg-stone-700 disabled:opacity-20 disabled:cursor-not-allowed transition-all border border-stone-700/50"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {isVotingActive ? (
            <button
              onClick={handleStopVoting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg shadow-rose-600/30 transition-all border border-rose-500/50"
            >
              <Square className="w-5 h-5" />
              Stop Voting
            </button>
          ) : (
            <button
              onClick={handleStartVoting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold hover:opacity-90 transition-all shadow-lg shadow-rose-500/30"
            >
              Start Voting
            </button>
          )}

          <button
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex >= totalQuestions - 1}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-stone-800 text-stone-300 hover:bg-stone-700 disabled:opacity-20 disabled:cursor-not-allowed transition-all border border-stone-700/50"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="w-px h-8 bg-stone-800 mx-2" />

          <button
            onClick={handleEndPoll}
            className="px-5 py-3 rounded-xl bg-red-950/40 text-red-400 hover:bg-red-900/40 border border-red-900/30 transition-colors"
          >
            End Poll
          </button>
        </div>
      </footer>
    </div>
  );
}
