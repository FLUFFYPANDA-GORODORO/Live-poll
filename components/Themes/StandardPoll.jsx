import { useState } from "react";
import { Loader2, Home, Check, Lock, AlertCircle, ArrowRight, Users, Clock } from "lucide-react";

const CHART_COLORS = [
  "var(--color-primary)",
  "var(--color-secondary)",
  "var(--color-primary)",
  "var(--color-secondary)",
];

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
            <div className="text-sm font-bold text-[#1E293B]">{voteCount}</div>
            <div className="relative h-32 md:h-40 w-full flex items-end justify-center">
              <div
                className="w-10 md:w-12 rounded-t-lg transition-all duration-700 ease-out"
                style={{
                  height: `${height}%`,
                  backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                  minHeight: voteCount > 0 ? "8px" : "4px",
                }}
              />
            </div>
            <div className="text-center">
              <div className="text-xs md:text-sm font-semibold text-[#1E293B] truncate max-w-[70px]">
                {option.text}
              </div>
              <div className="text-xs text-[#64748B]">{percentage}%</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function StandardPoll({
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
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <div className="max-w-lg text-center">
          <h1 className="text-3xl font-bold mb-3 text-[#1E293B]">{cleanTitle}</h1>
          <code className="text-sm bg-[#E2E8F0] px-3 py-1 rounded-lg text-[#64748B] mb-8 inline-block">
            {pollId}
          </code>

          <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-[var(--color-primary)]" />
            </div>
            <h2 className="text-xl font-bold mb-3 text-[#1E293B]">Waiting for Host</h2>
            <p className="text-[#64748B] mb-6">The poll will begin shortly...</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
              <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!activeQuestion || poll.status === "ended") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-[#1E293B]">Poll Ended</h1>
          <p className="text-[#64748B] mb-6">Thank you for participating!</p>
          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] px-6 py-3 rounded-xl font-semibold text-white mx-auto transition-colors"
          >
            <Home className="w-5 h-5" />
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen bg-[#F8FAFC] p-4 md:p-6 flex flex-col justify-between overflow-y-auto relative">
      {/* Top Left Logo */}
      <div className="absolute top-4 left-4 z-20">
        <img src="/GryphonBlack.png" alt="Gryphon Logo" className="h-6 md:h-8 w-auto object-contain" />
      </div>

      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center py-2">
        <div className="text-center mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-[#1E293B] mb-2">{cleanTitle}</h1>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="text-sm bg-[#E2E8F0] px-3 py-1 rounded-full text-[#64748B]">
              Q{poll.activeQuestionIndex + 1}/{poll.questions?.length}
            </span>
            <span className={`text-sm px-3 py-1 rounded-full flex items-center gap-1.5 ${
              poll.currentQuestionActive ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
            }`}>
              {poll.currentQuestionActive ? (
                <><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />Live</>
              ) : (
                <><Clock className="w-3.5 h-3.5" />Waiting</>
              )}
            </span>
            {hasVoted && (
              <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />Voted
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl md:text-2xl font-bold text-[#1E293B] text-center mb-2">
              {activeQuestion.text}
            </h2>
            {totalVotes > 0 && !isWordCloud && (
              <div className="flex items-center justify-center gap-2 text-sm text-[#64748B]">
                <Users className="w-4 h-4" />
                {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {hasVoted && !isWordCloud && (
            <div className="px-4 pb-6">
              <VerticalBarChart options={activeQuestion.options} votes={currentVotes} totalVotes={totalVotes} />
            </div>
          )}

          {hasVoted && isWordCloud && (
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 border border-green-200">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-805 mb-1 text-slate-800">Response Recorded!</h3>
              <p className="text-xs text-slate-505 text-slate-500">Wait for the presenter to show the results.</p>
            </div>
          )}

          {!hasVoted && !isWordCloud && (
            <div className="p-4 space-y-3">
              {activeQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => voteForOptionHandler(idx)}
                  disabled={!poll.currentQuestionActive || voting}
                  className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 ${
                    poll.currentQuestionActive && !voting
                      ? "bg-[#F8FAFC] hover:bg-slate-100 border-2 border-transparent hover:border-[var(--color-primary)] cursor-pointer active:scale-[0.98]"
                      : "bg-[#F1F5F9] cursor-not-allowed opacity-60"
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                  >
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="text-[#1E293B] font-medium">{option.text}</span>
                </button>
              ))}
            </div>
          )}

          {!hasVoted && isWordCloud && (
            <div className="p-4 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider">
                  Your Answer
                </label>
                <input
                  type="text"
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  placeholder="Type your response (max 50 characters)..."
                  maxLength={50}
                  disabled={!poll.currentQuestionActive || localSubmitting}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] text-slate-800 placeholder-slate-400 bg-slate-50 disabled:opacity-60"
                />
              </div>
              <button
                onClick={handleSubmitWord}
                disabled={!poll.currentQuestionActive || localSubmitting || !wordInput.trim()}
                className="w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {(localSubmitting || voting) && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Answer
              </button>
            </div>
          )}

          <div className="px-4 pb-4">
            {voting || localSubmitting ? (
              <div className="flex items-center justify-center gap-2 p-4 bg-[var(--color-primary)]/10 rounded-xl text-[var(--color-primary)]">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium">Recording response...</span>
              </div>
            ) : hasVoted ? (
              <div className="flex items-center justify-center gap-2 p-4 bg-green-100 rounded-xl text-green-700">
                <Check className="w-5 h-5" />
                <span className="font-medium">Your response is in! Results update live.</span>
              </div>
            ) : !poll.currentQuestionActive ? (
              <div className="flex items-center justify-center gap-2 p-4 bg-yellow-100 rounded-xl text-yellow-700">
                <Lock className="w-5 h-5" />
                <span className="font-medium">Voting locked. Wait for host.</span>
              </div>
            ) : isWordCloud ? (
              <div className="text-center p-4 bg-[var(--color-primary)]/10 rounded-xl text-[var(--color-primary)]">
                <span className="font-medium">Enter a word and tap submit to record your response</span>
              </div>
            ) : (
              <div className="text-center p-4 bg-[var(--color-primary)]/10 rounded-xl text-[var(--color-primary)]">
                <span className="font-medium">Tap an option to vote</span>
              </div>
            )}
          </div>
        </div>

        {/* Emoji Reactions Panel */}
        {poll.status === "live" && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#E2E8F0] shadow-sm p-4 mt-4 flex items-center justify-center gap-4 max-w-sm mx-auto animate-fade-in">
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
