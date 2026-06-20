"use client";

import { useState } from "react";
import { Loader2, Home, Check, Lock, AlertCircle, ArrowRight, Users, Clock, GraduationCap } from "lucide-react";

// Green/Emerald Palette
const CHART_COLORS = ["#10b981", "#059669", "#6ee7b7", "#047857"];

function HorizontalBarChart({ options, votes, totalVotes }) {
  const maxVotes = Math.max(...votes, 1);

  return (
    <div className="space-y-2 px-2 my-1">
      {options.map((option, idx) => {
        const voteCount = votes[idx] || 0;
        const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
        const width = maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0;

        return (
          <div key={idx} className="flex flex-col">
            <div className="relative w-full h-8 bg-slate-100 rounded-lg overflow-hidden border border-emerald-100 flex items-center shadow-inner">
              {/* Fill */}
              <div
                className="absolute top-0 left-0 h-full rounded-r-md transition-all duration-700 ease-out bg-gradient-to-r from-emerald-600 to-green-500 opacity-80"
                style={{
                  width: `${width}%`,
                }}
              />
              {/* Content */}
              <div className="relative z-10 w-full px-3 flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="truncate max-w-[65%]">{option.text}</span>
                <span className="flex-shrink-0 text-emerald-900 font-extrabold">
                  {voteCount}
                </span>
              </div>
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
  router,
  handleSendEmoji
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
    } finally {
      setLocalSubmitting(false);
    }
  };

  if (pollNotStarted) {
    return (
      <div className="min-h-screen bg-[url('/MCbackground.jpg')] bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center p-6 text-emerald-50">
        <div className="max-w-lg text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{cleanTitle}</h1>
          </div>
          <code className="text-sm bg-slate-800/80 px-3 py-1 rounded-lg text-emerald-350 mb-8 inline-block border border-emerald-900/30">
            {pollId}
          </code>

          <div className="bg-slate-950/80 backdrop-blur-md rounded-2xl p-8 border border-emerald-900/30 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
              <Lock className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold mb-3 text-white">Classroom Waiting Room</h2>
            <p className="text-slate-355 mb-6">Waiting for the class lecture to begin...</p>
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
      <div className="min-h-screen bg-[url('/MCbackground.jpg')] bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center p-6 text-emerald-50">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6 border border-emerald-500/35">
            <Check className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-white">Lecture Ended</h1>
          <p className="text-slate-350 mb-6">Your answers have been saved. Class dismissed!</p>
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
    <div className="h-screen max-h-screen bg-[url('/MCbackground.jpg')] bg-cover bg-center bg-no-repeat p-4 md:p-6 text-white font-sans flex flex-col justify-between overflow-y-auto">
      {/* Top Logo Header - Gryphon left, Masterclass right, bigger size */}
      <div className="w-full flex items-center justify-between gap-3 mb-2 flex-shrink-0">
        <img src="/GryphonWhite.png" alt="Gryphon Logo" className="h-12 w-auto object-contain" />
        <img src="/mc01.png" alt="Masterclass Logo" className="h-10 w-auto object-contain translate-y-1.5" />
      </div>

      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center py-1">
        {/* Question Panel */}
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-xl overflow-hidden">
          <div className="p-4 bg-gradient-to-b from-emerald-50/50 to-transparent">
            <h2 className="text-sm md:text-base font-bold text-slate-900 text-center mb-1 leading-snug">
              {activeQuestion.text}
            </h2>
            {totalVotes > 0 && !isWordCloud && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-650 font-medium">
                <Users className="w-3.5 h-3.5" />
                {totalVotes} response{totalVotes !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Results preview */}
          {hasVoted && !isWordCloud && (
            <div className="px-4 pb-4">
              <HorizontalBarChart options={activeQuestion.options} votes={currentVotes} totalVotes={totalVotes} />
            </div>
          )}

          {hasVoted && isWordCloud && (
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <Check className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Response Recorded!</h3>
              <p className="text-xs text-slate-505 text-slate-500">Wait for the presenter to show the results.</p>
            </div>
          )}

          {/* Answer options */}
          {!hasVoted && !isWordCloud && (
            <div className="p-3 space-y-2">
              {activeQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => voteForOptionHandler(idx)}
                  disabled={!poll.currentQuestionActive || voting}
                  className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center gap-3 border ${
                    poll.currentQuestionActive && !voting
                      ? "bg-slate-50 hover:bg-emerald-50/50 border-emerald-100/50 hover:border-emerald-450 cursor-pointer active:scale-[0.98]"
                      : "bg-slate-100 border-slate-200 cursor-not-allowed opacity-60"
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                  >
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="text-slate-900 font-semibold text-xs md:text-sm">{option.text}</span>
                </button>
              ))}
            </div>
          )}

          {!hasVoted && isWordCloud && (
            <div className="p-4 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  Your Answer
                </label>
                <input
                  type="text"
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  placeholder="Type your response (max 50 characters)..."
                  maxLength={50}
                  disabled={!poll.currentQuestionActive || localSubmitting}
                  className="w-full p-3 border border-emerald-100 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-805 placeholder-slate-400 bg-slate-50 disabled:opacity-60"
                />
              </div>
              <button
                onClick={handleSubmitWord}
                disabled={!poll.currentQuestionActive || localSubmitting || !wordInput.trim()}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {(localSubmitting || voting) && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Answer
              </button>
            </div>
          )}

          {/* Message bar */}
          <div className="px-3 pb-3">
            {(voting || localSubmitting) ? (
              <div className="flex items-center justify-center gap-2 p-2 bg-emerald-50 rounded-lg text-emerald-650 border border-emerald-100/20 text-xs font-semibold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Transmitting response...</span>
              </div>
            ) : hasVoted ? (
              <div className="flex items-center justify-center gap-2 p-2 bg-emerald-50 rounded-lg text-emerald-700 border border-emerald-100/50 text-xs font-semibold">
                <Check className="w-4 h-4" />
                <span>Answer recorded! Results updated live.</span>
              </div>
            ) : !poll.currentQuestionActive ? (
              <div className="flex items-center justify-center gap-2 p-2 bg-slate-100 rounded-lg text-slate-600 border border-slate-200 text-xs font-semibold">
                <Lock className="w-4 h-4" />
                <span>Voting is currently locked.</span>
              </div>
            ) : isWordCloud ? (
              <div className="text-center p-2 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100/30 text-xs font-semibold">
                <span>Enter a word and tap submit to record your response</span>
              </div>
            ) : (
              <div className="text-center p-2 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100/30 text-xs font-semibold">
                <span>Tap an option to lock in your answer</span>
              </div>
            )}
          </div>
        </div>

        {/* Emoji Reactions Panel */}
        {poll.status === "live" && (
          <div className="bg-white/80 backdrop-blur-[1px] rounded-2xl border border-emerald-100 shadow-md p-3.5 mt-4 flex items-center justify-center gap-4 max-w-sm mx-auto animate-fade-in">
            {["❤️", "😮", "👍", "😢", "😆"].map((emoji, idx) => (
              <button
                key={idx}
                onClick={() => handleSendEmoji(emoji)}
                className="text-2xl hover:scale-125 active:scale-90 transition-all duration-150 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
