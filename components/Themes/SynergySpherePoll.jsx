"use client";

import { useState } from "react";
import { Loader2, Home, Check, Lock, AlertCircle, ArrowRight, Users, Clock, Sparkles } from "lucide-react";

// Red/Rose Palette
const CHART_COLORS = ["#ef4444", "#f43f5e", "#fda4af", "#e11d48"];

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
            <div className="text-sm font-bold text-rose-950">{voteCount}</div>
            <div className="relative h-32 md:h-40 w-full flex items-end justify-center">
              <div
                className="w-10 md:w-12 rounded-t-lg transition-all duration-700 ease-out bg-gradient-to-t from-red-600 to-rose-500"
                style={{
                  height: `${height}%`,
                  minHeight: voteCount > 0 ? "8px" : "4px",
                }}
              />
            </div>
            <div className="text-center">
              <div className="text-xs md:text-sm font-semibold text-rose-950 truncate max-w-[70px]">
                {option.text}
              </div>
              <div className="text-xs text-rose-500 font-bold">{percentage}%</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SynergySpherePoll({
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
  const [wordInput, setWordInput] = useState("");
  const [localSubmitting, setLocalSubmitting] = useState(false);

  const isWordCloud = activeQuestion?.type === "WordCloud" || activeQuestion?.type === 1 || String(activeQuestion?.type).toLowerCase() === "wordcloud" || !activeQuestion?.options || activeQuestion.options.length === 0 || activeQuestion.options.every(opt => {
    const txt = typeof opt === "string" ? opt : (opt.text || "");
    return !txt.trim();
  });

  const handleSubmitWord = async () => {
    const trimmedWord = wordInput.trim();
    if (!trimmedWord || localSubmitting) return;

    setLocalSubmitting(true);
    try {
      await voteForOptionHandler(trimmedWord);
    } catch (err) {
      setLocalSubmitting(false);
    }
  };

  if (pollNotStarted) {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-6 text-rose-50">
        <div className="max-w-lg text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-6 h-6 text-rose-500 animate-pulse" />
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{cleanTitle}</h1>
          </div>
          <code className="text-sm bg-stone-800 px-3 py-1 rounded-lg text-rose-350 mb-8 inline-block border border-rose-900/30">
            {pollId}
          </code>

          <div className="bg-stone-950 rounded-2xl p-8 border border-rose-900/30 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
              <Lock className="w-8 h-8 text-rose-400" />
            </div>
            <h2 className="text-xl font-bold mb-3 text-white">Sphere Waiting Room</h2>
            <p className="text-stone-400 mb-6">The host is preparing the session...</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!activeQuestion || poll.status === "ended") {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-6 text-rose-50">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-6 border border-rose-500/35">
            <Check className="w-10 h-10 text-rose-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-white">Sphere Concluded</h1>
          <p className="text-stone-400 mb-6">Your answers have been saved. Thank you!</p>
          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 px-6 py-3 rounded-xl font-semibold text-white mx-auto transition-colors shadow-lg shadow-rose-600/35 border border-rose-500/30"
          >
            <Home className="w-5 h-5" />
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen bg-stone-50 p-4 md:p-6 text-rose-950 font-sans flex flex-col justify-between overflow-y-auto relative">
      {/* Top Left Logo */}
      <div className="absolute top-4 left-4 z-20">
        <img src="/GryphonBlack.png" alt="Gryphon Logo" className="h-6 md:h-8 w-auto object-contain" />
      </div>

      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center py-2">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-rose-500" />
            <h1 className="text-xl md:text-2xl font-bold text-rose-950">{cleanTitle}</h1>
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="text-sm bg-rose-100/50 border border-rose-200/50 px-3 py-1 rounded-full text-rose-700 font-semibold">
              Slide {poll.activeQuestionIndex + 1}/{poll.questions?.length}
            </span>
            <span className={`text-sm px-3 py-1 rounded-full flex items-center gap-1.5 font-semibold ${
              poll.currentQuestionActive 
                ? "bg-rose-100 text-rose-700 border border-rose-200" 
                : "bg-stone-200 text-stone-700 border border-stone-300"
            }`}>
              {poll.currentQuestionActive ? (
                <><span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />Active</>
              ) : (
                <><Clock className="w-3.5 h-3.5" />Locked</>
              )}
            </span>
            {hasVoted && (
              <span className="text-sm px-3 py-1 rounded-full bg-red-100 text-rose-700 border border-rose-200 flex items-center gap-1 font-semibold">
                <Check className="w-3.5 h-3.5 text-rose-600" />Submitted
              </span>
            )}
          </div>
        </div>

        {/* Question Panel */}
        <div className="bg-white rounded-2xl border border-rose-100 shadow-xl overflow-hidden">
          <div className="p-6 bg-gradient-to-b from-rose-50/50 to-transparent">
            <h2 className="text-xl md:text-2xl font-black text-stone-900 text-center mb-2 leading-snug">
              {activeQuestion.text}
            </h2>
            {totalVotes > 0 && !isWordCloud && (
              <div className="flex items-center justify-center gap-2 text-sm text-rose-600/80 font-medium">
                <Users className="w-4 h-4" />
                {totalVotes} response{totalVotes !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Results preview */}
          {hasVoted && !isWordCloud && (
            <div className="px-4 pb-6">
              <VerticalBarChart options={activeQuestion.options} votes={currentVotes} totalVotes={totalVotes} />
            </div>
          )}

          {hasVoted && isWordCloud && (
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4 border border-rose-200">
                <Check className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-stone-800 mb-1">Response Recorded!</h3>
              <p className="text-xs text-stone-500">Wait for the presenter to show the results.</p>
            </div>
          )}

          {/* Answer options */}
          {!hasVoted && !isWordCloud && (
            <div className="p-4 space-y-3">
              {activeQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => voteForOptionHandler(idx)}
                  disabled={!poll.currentQuestionActive || voting}
                  className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 border ${
                    poll.currentQuestionActive && !voting
                      ? "bg-stone-50 hover:bg-rose-50/50 border-rose-100/50 hover:border-rose-400 cursor-pointer active:scale-[0.98]"
                      : "bg-stone-100 border-stone-200 cursor-not-allowed opacity-60"
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 bg-gradient-to-br from-red-500 to-rose-600 shadow-md"
                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                  >
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="text-stone-900 font-semibold">{option.text}</span>
                </button>
              ))}
            </div>
          )}

          {!hasVoted && isWordCloud && (
            <div className="p-4 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                  Your Answer
                </label>
                <input
                  type="text"
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  placeholder="Type your response (max 200 characters)..."
                  maxLength={200}
                  disabled={!poll.currentQuestionActive || localSubmitting}
                  className="w-full p-3 border border-rose-100 rounded-xl text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-slate-800 placeholder-slate-400 bg-slate-50 disabled:opacity-60"
                />
              </div>
              <button
                onClick={handleSubmitWord}
                disabled={!poll.currentQuestionActive || localSubmitting || !wordInput.trim()}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {(localSubmitting || voting) && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Answer
              </button>
            </div>
          )}

          {/* Message bar */}
          <div className="px-4 pb-4">
            {voting || localSubmitting ? (
              <div className="flex items-center justify-center gap-2 p-4 bg-rose-50 rounded-xl text-rose-650">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-semibold">Transmitting sphere response...</span>
              </div>
            ) : hasVoted ? (
              <div className="flex items-center justify-center gap-2 p-4 bg-rose-50 rounded-xl text-rose-700 border border-rose-100/50">
                <Check className="w-5 h-5" />
                <span className="font-semibold">Response logged! Results updated live.</span>
              </div>
            ) : !poll.currentQuestionActive ? (
              <div className="flex items-center justify-center gap-2 p-4 bg-stone-150 rounded-xl text-stone-600">
                <Lock className="w-5 h-5" />
                <span className="font-semibold">Voting is currently locked.</span>
              </div>
            ) : isWordCloud ? (
              <div className="text-center p-4 bg-rose-50 rounded-xl text-rose-600 border border-rose-100/30">
                <span className="font-semibold">Enter a word and tap submit to record your response</span>
              </div>
            ) : (
              <div className="text-center p-4 bg-rose-50 rounded-xl text-rose-600 border border-rose-100/30">
                <span className="font-semibold">Tap an option to lock in your answer</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
