"use client";

import { Loader2, Home, Check, Lock, AlertCircle, ArrowRight, Users, Clock, GraduationCap } from "lucide-react";

// Green/Emerald Palette
const CHART_COLORS = ["#10b981", "#059669", "#6ee7b7", "#047857"];

function VerticalBarChart({ options, votes, totalVotes }) {
  const maxVotes = Math.max(...votes, 1);

  return (
    <div className="flex items-end justify-center gap-4 md:gap-6 h-48 md:h-56 px-4">
      {options.map((option, idx) => {
        const voteCount = votes[idx] || 0;
        const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
        const height = maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0;

        return (
          <div key={idx} className="flex flex-col items-center gap-2 flex-1 max-w-[80px]">
            <div className="text-sm font-bold text-emerald-950">{voteCount}</div>
            <div className="relative h-32 md:h-40 w-full flex items-end justify-center">
              <div
                className="w-10 md:w-12 rounded-t-lg transition-all duration-700 ease-out bg-gradient-to-t from-emerald-600 to-green-500"
                style={{
                  height: `${height}%`,
                  minHeight: voteCount > 0 ? "8px" : "4px",
                }}
              />
            </div>
            <div className="text-center">
              <div className="text-xs md:text-sm font-semibold text-emerald-950 truncate max-w-[70px]">
                {option.text}
              </div>
              <div className="text-xs text-emerald-500 font-bold">{percentage}%</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function MasterclassPoll({
  poll,
  cleanTitle,
  pollId,
  hasVoted,
  voting,
  voteForOptionHandler,
  totalVotes,
  currentVotes,
  pollNotStarted,
  activeQuestion,
  router
}) {
  if (pollNotStarted) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-emerald-50">
        <div className="max-w-lg text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <GraduationCap className="w-6 h-6 text-emerald-500 animate-bounce" />
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{cleanTitle}</h1>
          </div>
          <code className="text-sm bg-slate-800 px-3 py-1 rounded-lg text-emerald-350 mb-8 inline-block border border-emerald-900/30">
            {pollId}
          </code>

          <div className="bg-slate-950 rounded-2xl p-8 border border-emerald-900/30 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
              <Lock className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold mb-3 text-white">Classroom Waiting Room</h2>
            <p className="text-slate-400 mb-6">Waiting for the class lecture to begin...</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!activeQuestion || poll.status === "ended") {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-emerald-50">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6 border border-emerald-500/35">
            <Check className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-white">Lecture Ended</h1>
          <p className="text-slate-400 mb-6">Your answers have been saved. Class dismissed!</p>
          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-xl font-semibold text-white mx-auto transition-colors shadow-lg shadow-emerald-600/35 border border-emerald-500/30"
          >
            <Home className="w-5 h-5" />
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 text-emerald-950 font-sans">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <GraduationCap className="w-5 h-5 text-emerald-500" />
            <h1 className="text-xl md:text-2xl font-bold text-emerald-950">{cleanTitle}</h1>
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="text-sm bg-emerald-100/50 border border-emerald-200/50 px-3 py-1 rounded-full text-emerald-750 font-semibold">
              Question {poll.activeQuestionIndex + 1}/{poll.questions?.length}
            </span>
            <span className={`text-sm px-3 py-1 rounded-full flex items-center gap-1.5 font-semibold ${
              poll.currentQuestionActive 
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                : "bg-slate-205 bg-slate-200 text-slate-700 border border-slate-300"
            }`}>
              {poll.currentQuestionActive ? (
                <><span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />Active</>
              ) : (
                <><Clock className="w-3.5 h-3.5" />Locked</>
              )}
            </span>
            {hasVoted && (
              <span className="text-sm px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 font-semibold">
                <Check className="w-3.5 h-3.5 text-emerald-600" />Submitted
              </span>
            )}
          </div>
        </div>

        {/* Question Panel */}
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-xl overflow-hidden">
          <div className="p-6 bg-gradient-to-b from-emerald-50/50 to-transparent">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 text-center mb-2 leading-snug">
              {activeQuestion.text}
            </h2>
            {totalVotes > 0 && (
              <div className="flex items-center justify-center gap-2 text-sm text-emerald-600/80 font-medium">
                <Users className="w-4 h-4" />
                {totalVotes} response{totalVotes !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Results preview */}
          {hasVoted && (
            <div className="px-4 pb-6">
              <VerticalBarChart options={activeQuestion.options} votes={currentVotes} totalVotes={totalVotes} />
            </div>
          )}

          {/* Answer options */}
          {!hasVoted && (
            <div className="p-4 space-y-3">
              {activeQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => voteForOptionHandler(idx)}
                  disabled={!poll.currentQuestionActive || voting}
                  className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 border ${
                    poll.currentQuestionActive && !voting
                      ? "bg-slate-50 hover:bg-emerald-50/50 border-emerald-100/50 hover:border-emerald-400 cursor-pointer active:scale-[0.98]"
                      : "bg-slate-100 border-slate-200 cursor-not-allowed opacity-60"
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 bg-gradient-to-br from-emerald-550 to-emerald-700 shadow-md"
                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                  >
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="text-slate-850 font-semibold">{option.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* Message bar */}
          <div className="px-4 pb-4">
            {voting ? (
              <div className="flex items-center justify-center gap-2 p-4 bg-emerald-50 rounded-xl text-emerald-650">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-semibold">Transmitting response...</span>
              </div>
            ) : hasVoted ? (
              <div className="flex items-center justify-center gap-2 p-4 bg-emerald-50 rounded-xl text-emerald-700 border border-emerald-100/50">
                <Check className="w-5 h-5" />
                <span className="font-semibold">Answer recorded! Results updated live.</span>
              </div>
            ) : !poll.currentQuestionActive ? (
              <div className="flex items-center justify-center gap-2 p-4 bg-slate-150 rounded-xl text-slate-650">
                <Lock className="w-5 h-5" />
                <span className="font-semibold">Voting is currently locked.</span>
              </div>
            ) : (
              <div className="text-center p-4 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100/30">
                <span className="font-semibold">Tap an option to lock in your answer</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
