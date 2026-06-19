"use client";

import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  Minimize, 
  Square, 
  Users, 
  X 
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const CHART_COLORS = [
  "#bef264", "#022c22", "#a3e635", "#064e3b",
  "#84cc16", "#022c22", "#d9f99d", "#065f46",
];

export default function StandardPresent({
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
    <div className="min-h-screen bg-white flex flex-col text-slate-900">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">{cleanTitle}</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-slate-600 text-sm">
            <Users className="w-4 h-4" />
            <span>{totalVotes} votes</span>
          </div>
          <button
            onClick={() => setShowQR(!showQR)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-sm hover:bg-slate-200"
          >
            {showQR ? "Hide" : "Show"} QR
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-8 py-6 relative">
        {showQR && (
          <div className="absolute top-4 right-8 bg-white p-3 rounded-xl shadow-xl border border-slate-100">
            <QRCodeSVG value={pollUrl} size={100} />
            <p className="text-[10px] text-center mt-1 text-slate-400 font-mono italic">{pollId}</p>
          </div>
        )}

        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight">
              {currentQuestion?.text || "No question"}
            </h2>
            <div className="mt-4 text-slate-500">
              Question {currentQuestionIndex + 1} of {totalQuestions}
              {isVotingActive && (
                <span className="ml-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-sm">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Live
                </span>
              )}
            </div>
          </div>

          <div className="flex items-end justify-center gap-6 md:gap-10 h-64 md:h-80">
            {currentQuestion?.options?.map((option, idx) => {
              const votes = getVoteCount(idx);
              const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
              const height = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;

              return (
                <div key={idx} className="flex flex-col items-center gap-3">
                  <div className="text-slate-900 font-bold text-lg">{votes}</div>
                  <div className="relative h-48 md:h-64 w-16 md:w-20 flex items-end">
                    <div
                      className="w-full rounded-t-xl transition-all duration-700 ease-out"
                      style={{
                        height: `${height}%`,
                        backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                        minHeight: votes > 0 ? "12px" : "4px",
                        boxShadow: votes > 0 ? `0 4px 15px ${CHART_COLORS[idx % CHART_COLORS.length]}30` : "none",
                      }}
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-slate-900 font-semibold text-sm md:text-base truncate max-w-[80px]">
                      {option.text}
                    </div>
                    <div className="text-slate-400 text-sm">{percentage}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <footer className="px-8 py-6 border-t border-slate-100 bg-white">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex <= 0}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {isVotingActive ? (
            <button
              onClick={handleStopVoting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all"
            >
              <Square className="w-5 h-5" />
              Stop Voting
            </button>
          ) : (
            <button
              onClick={handleStartVoting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-secondary)] text-slate-900 font-bold hover:bg-[var(--color-secondary-hover)] transition-all shadow-lg shadow-[var(--color-secondary)]/20"
            >
              Start Voting
            </button>
          )}

          <button
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex >= totalQuestions - 1}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="w-px h-8 bg-slate-200 mx-2" />

          <button
            onClick={handleEndPoll}
            className="px-5 py-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
          >
            End Poll
          </button>
        </div>
      </footer>
    </div>
  );
}
