import { useState } from "react";
import { Loader2, Home, Check, Lock, AlertCircle, ArrowRight, Users, Clock, Sparkles } from "lucide-react";

const STANDARD_CHART_COLORS = [
  "var(--color-primary)",
  "var(--color-secondary)",
  "var(--color-primary)",
  "var(--color-secondary)",
];

const MASTERCLASS_CHART_COLORS = ["#10b981", "#059669", "#6ee7b7", "#047857"];

function VerticalBarChart({ options, votes, totalVotes, theme }) {
  const maxVotes = Math.max(...votes, 1);
  const isSynergy = theme === "synergy_sphere";

  return (
    <div className="flex items-end justify-center gap-4 md:gap-6 h-48 md:h-56 px-4">
      {options.map((option, idx) => {
        const voteCount = votes[idx] || 0;
        const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
        const height = maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0;

        return (
          <div key={idx} className="flex flex-col items-center gap-2 flex-1 max-w-[80px]">
            <div className={`text-sm font-bold ${isSynergy ? "text-rose-950" : "text-[#1E293B]"}`}>
              {voteCount}
            </div>
            <div className="relative h-32 md:h-40 w-full flex items-end justify-center">
              <div
                className={`w-10 md:w-12 rounded-t-lg transition-all duration-700 ease-out ${isSynergy ? "bg-gradient-to-t from-red-600 to-rose-500" : ""
                  }`}
                style={{
                  height: `${height}%`,
                  backgroundColor: isSynergy ? undefined : STANDARD_CHART_COLORS[idx % STANDARD_CHART_COLORS.length],
                  minHeight: voteCount > 0 ? "8px" : "4px",
                }}
              />
            </div>
            <div className="text-center">
              <div className={`text-xs md:text-sm font-semibold truncate max-w-[70px] ${isSynergy ? "text-rose-950" : "text-[#1E293B]"
                }`}>
                {option.text}
              </div>
              <div className={`text-xs ${isSynergy ? "text-rose-500 font-bold" : "text-[#64748B]"}`}>
                {percentage}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

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

export default function StandardPoll({
  poll,
  cleanTitle,
  pollId,
  hasVoted,
  selectedOption,
  voting,
  voteForOptionHandler,
  totalVotes,
  currentVotes,
  pollNotStarted,
  activeQuestion,
  router,
  handleSendEmoji,
  theme = "standard" // default to standard
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

  // Helper variables for clean conditional styling
  const isMasterclass = theme === "masterclass";
  const isSynergy = theme === "synergy_sphere";

  // 1. Render Waiting Room / Poll Not Started State
  if (pollNotStarted) {
    let waitingClass = "min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6";
    let textClass = "text-[#1E293B]";
    let codeClass = "text-sm bg-[#E2E8F0] px-3 py-1 rounded-lg text-[#64748B] mb-8 inline-block";
    let cardClass = "bg-white rounded-2xl p-8 border border-[#E2E8F0] shadow-sm";
    let iconBgClass = "w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-6";
    let iconClass = "w-8 h-8 text-[var(--color-primary)]";
    let dotClass = "w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse";
    let titleText = "Waiting for Host";
    let subTitleText = "The poll will begin shortly...";

    if (isMasterclass) {
      waitingClass = "min-h-screen bg-[url('/MasterClassNewBg.png')] bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center p-6 text-emerald-50";
      textClass = "text-white";
      codeClass = "text-sm bg-slate-800/80 px-3 py-1 rounded-lg text-emerald-350 mb-8 inline-block border border-emerald-900/30";
      cardClass = "bg-slate-950/80 backdrop-blur-md rounded-2xl p-8 border border-emerald-900/30 shadow-2xl";
      iconBgClass = "w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20";
      iconClass = "w-8 h-8 text-emerald-400";
      dotClass = "w-2 h-2 bg-emerald-500 rounded-full animate-bounce";
      titleText = "Classroom Waiting Room";
      subTitleText = "Waiting for the class lecture to begin...";
    } else if (isSynergy) {
      waitingClass = "min-h-screen bg-stone-900 flex flex-col items-center justify-center p-6 text-rose-50";
      textClass = "text-white";
      codeClass = "text-sm bg-stone-800 px-3 py-1 rounded-lg text-rose-350 mb-8 inline-block border border-rose-900/30";
      cardClass = "bg-stone-950 rounded-2xl p-8 border border-rose-900/30 shadow-2xl";
      iconBgClass = "w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-6 border border-rose-500/20";
      iconClass = "w-8 h-8 text-rose-400";
      dotClass = "w-2 h-2 bg-rose-500 rounded-full animate-bounce";
      titleText = "Sphere Waiting Room";
      subTitleText = "The host is preparing the session...";
    }

    return (
      <div className={waitingClass}>
        <div className="max-w-lg text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            {isSynergy && <Sparkles className="w-6 h-6 text-rose-500 animate-pulse" />}
            <h1 className={`text-3xl font-extrabold tracking-tight ${textClass}`}>{cleanTitle}</h1>
          </div>
          <code className={codeClass}>
            {pollId}
          </code>

          <div className={cardClass}>
            <div className={iconBgClass}>
              <Lock className={iconClass} />
            </div>
            <h2 className={`text-xl font-bold mb-3 ${textClass}`}>{titleText}</h2>
            <p className={`${isMasterclass ? "text-slate-355" : isSynergy ? "text-stone-400" : "text-[#64748B]"} mb-6`}>
              {subTitleText}
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className={dotClass} />
              <div className={dotClass} style={{ animationDelay: "0.2s" }} />
              <div className={dotClass} style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Render Ended State
  if (!activeQuestion || poll.status === "ended") {
    let endedClass = "min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6";
    let textClass = "text-[#1E293B]";
    let cardTextClass = "text-[#64748B]";
    let buttonClass = "flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] px-6 py-3 rounded-xl font-semibold text-white mx-auto transition-colors";
    let iconBgClass = "w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6";
    let iconClass = "w-10 h-10 text-green-500";
    let titleText = "Poll Ended";
    let subTitleText = "Thank you for participating!";

    if (isMasterclass) {
      endedClass = "min-h-screen bg-[url('/MasterClassNewBg.png')] bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center p-6 text-emerald-50";
      textClass = "text-white";
      cardTextClass = "text-slate-350";
      buttonClass = "flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-xl font-semibold text-white mx-auto transition-colors shadow-lg shadow-emerald-600/35 border border-emerald-500/30";
      iconBgClass = "w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6 border border-emerald-500/35";
      iconClass = "w-10 h-10 text-emerald-500";
      titleText = "Lecture Ended";
      subTitleText = "Your answers have been saved. Class dismissed!";
    } else if (isSynergy) {
      endedClass = "min-h-screen bg-stone-900 flex flex-col items-center justify-center p-6 text-rose-50";
      textClass = "text-white";
      cardTextClass = "text-stone-400";
      buttonClass = "flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 px-6 py-3 rounded-xl font-semibold text-white mx-auto transition-colors shadow-lg shadow-rose-600/35 border border-rose-500/30";
      iconBgClass = "w-20 h-20 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-6 border border-rose-500/35";
      iconClass = "w-10 h-10 text-rose-500";
      titleText = "Sphere Concluded";
      subTitleText = "Your answers have been saved. Thank you!";
    }

    return (
      <div className={endedClass}>
        <div className="max-w-md text-center">
          <div className={iconBgClass}>
            <Check className={iconClass} />
          </div>
          <h1 className={`text-2xl font-bold mb-4 ${textClass}`}>{titleText}</h1>
          <p className={`${cardTextClass} mb-6`}>{subTitleText}</p>
          <button onClick={() => router.push("/")} className={buttonClass}>
            <Home className="w-5 h-5" />
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // 3. Main Active Poll Screen
  let mainWrapperClass = "h-screen max-h-screen bg-[#F8FAFC] p-4 md:p-6 flex flex-col justify-between overflow-y-auto relative";
  let contentWrapperClass = "max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center py-2";
  let cardClass = "bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden";
  let emojiPanelClass = "bg-white/80 backdrop-blur-sm rounded-2xl border border-[#E2E8F0] shadow-sm p-4 mt-4 flex items-center justify-center gap-4 max-w-sm mx-auto animate-fade-in";

  if (isMasterclass) {
    mainWrapperClass = "h-screen max-h-screen bg-[url('/MasterClassNewBg.png')] bg-cover bg-center bg-no-repeat p-4 md:p-6 text-white font-sans flex flex-col justify-between overflow-y-auto";
    contentWrapperClass = "max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center py-1";
    cardClass = "bg-white rounded-2xl border border-emerald-100 shadow-xl overflow-hidden";
    emojiPanelClass = "bg-white/80 backdrop-blur-[1px] rounded-2xl border border-emerald-100 shadow-md p-3.5 mt-4 flex items-center justify-center gap-4 max-w-sm mx-auto animate-fade-in";
  } else if (isSynergy) {
    mainWrapperClass = "h-screen max-h-screen bg-[url('/SynegrysphereBG.png')] bg-cover bg-center bg-no-repeat p-4 md:p-6 text-rose-50 font-sans flex flex-col justify-between overflow-y-auto relative";
    contentWrapperClass = "max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center py-1 z-10 relative";
    cardClass = "bg-white rounded-2xl border border-rose-100 shadow-xl overflow-hidden";
    emojiPanelClass = "p-4 mt-4 flex items-center justify-center gap-4 max-w-sm mx-auto animate-fade-in";
  }

  return (
    <div className={mainWrapperClass}>
      {/* Synergy Sphere Light Overlay */}
      {!!isSynergy && <div className="absolute inset-0 bg-white/10 z-0" />}

      {/* Top Logos Header */}
      {isMasterclass ? (
        <div className="w-full flex items-center justify-between gap-3 mb-2 flex-shrink-0">
          <img src="/GryphonWhite.png" alt="Gryphon Logo" className="h-12 w-auto object-contain" />
          <img src="/mc01.png" alt="Masterclass Logo" className="h-10 w-auto object-contain translate-y-1.5" />
        </div>
      ) : isSynergy ? (
        <div className="w-full flex items-center justify-between gap-3 mb-2 flex-shrink-0 z-10 relative">
          <img src="/GryphonWhite.png" alt="Gryphon Logo" className="h-12 w-auto object-contain" />
          <img src="/SNSlogo.png" alt="Synergy Sphere Logo" className="h-10 w-auto object-contain" />
        </div>
      ) : (
        <div className="absolute top-4 left-4 z-20">
          <img src="/GryphonWhite.png" alt="Gryphon Logo" className="h-6 md:h-8 w-auto object-contain" />
        </div>
      )}

      <div className={contentWrapperClass}>
        {/* Standard Poll Header Title */}
        {!isMasterclass && !isSynergy && (
          <div className="text-center mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-[#1E293B] mb-2">{cleanTitle}</h1>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="text-sm bg-[#E2E8F0] px-3 py-1 rounded-full text-[#64748B]">
                Q{poll.activeQuestionIndex + 1}/{poll.questions?.length}
              </span>
              <span className={`text-sm px-3 py-1 rounded-full flex items-center gap-1.5 ${poll.currentQuestionActive ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                }`}>
                {poll.currentQuestionActive ? (
                  <><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><span>Live</span></>
                ) : (
                  <><Clock className="w-3.5 h-3.5" /><span>Waiting</span></>
                )}
              </span>
              {!!hasVoted && (
                <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /><span>Voted</span>
                </span>
              )}
            </div>
          </div>
        )}

        <div key={isWordCloud ? 'question-wc' : 'question-mcq'} className={cardClass}>
          {/* Card Header */}
          {isMasterclass ? (
            <div className="p-4 bg-gradient-to-b from-emerald-50/50 to-transparent">
              <h2 className="text-sm md:text-base font-bold text-slate-900 text-center mb-1 leading-snug">
                {activeQuestion.text}
              </h2>
              {totalVotes > 0 && !isWordCloud && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-650 font-medium">
                  <Users className="w-3.5 h-3.5" />
                  <span>{totalVotes} response{totalVotes !== 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
          ) : isSynergy ? (
            <div className="p-4 bg-gradient-to-b from-rose-50/50 to-transparent">
              <h2 className="text-sm md:text-base font-bold text-stone-900 text-center mb-1 leading-snug">
                {activeQuestion.text}
              </h2>
              {totalVotes > 0 && !isWordCloud && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600/80 font-medium">
                  <Users className="w-3.5 h-3.5" />
                  <span>{totalVotes} response{totalVotes !== 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6">
              <h2 className="text-xl md:text-2xl font-bold text-[#1E293B] text-center mb-2">
                {activeQuestion.text}
              </h2>
              {totalVotes > 0 && !isWordCloud && (
                <div className="flex items-center justify-center gap-2 text-sm text-[#64748B]">
                  <Users className="w-4 h-4" />
                  <span>{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
          )}

          {/* Results preview */}
          {!!hasVoted && isWordCloud && (
            <div className="p-6 text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 border ${isMasterclass
                ? "bg-emerald-100 border-emerald-200"
                : isSynergy
                  ? "bg-rose-100 border-rose-200"
                  : "bg-green-100 border-green-200"
                }`}>
                <Check className={`w-6 h-6 ${isMasterclass ? "text-emerald-600" : isSynergy ? "text-rose-600" : "text-green-600"
                  }`} />
              </div>
              <h3 className={`text-lg font-bold mb-1 ${isSynergy || isMasterclass ? "text-slate-800" : "text-slate-800"}`}>
                Response Recorded!
              </h3>
              <p className={`text-xs ${isSynergy ? "text-stone-500" : "text-slate-500"}`}>
                Wait for the presenter to show the results.
              </p>
            </div>
          )}

          {/* Answer options */}
          {!isWordCloud && (
            <div className={isMasterclass || isSynergy ? "p-3 space-y-2" : "p-4 space-y-3"}>
              {activeQuestion.options.map((option, idx) => {
                let buttonStyleClass = "";
                let badgeClass = "";
                let badgeStyle = {};

                const isOptionSelected = hasVoted && selectedOption === idx;
                const isOptionUnselected = hasVoted && selectedOption !== idx;

                if (isMasterclass) {
                  buttonStyleClass = `w-full p-2.5 rounded-xl text-left transition-all flex items-center gap-3 border ${
                    isOptionSelected
                      ? "bg-emerald-50 border-emerald-500 shadow-md font-bold text-slate-900 cursor-default"
                      : isOptionUnselected
                      ? "bg-slate-100/50 border-slate-200 opacity-40 cursor-default"
                      : poll.currentQuestionActive && !voting
                      ? "bg-slate-50 hover:bg-emerald-50/50 border-emerald-100/50 hover:border-emerald-450 cursor-pointer active:scale-[0.98]"
                      : "bg-slate-100 border-slate-200 cursor-not-allowed opacity-60"
                  }`;
                  badgeClass = "w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0";
                  badgeStyle = { backgroundColor: MASTERCLASS_CHART_COLORS[idx % MASTERCLASS_CHART_COLORS.length] };
                } else if (isSynergy) {
                  buttonStyleClass = `w-full p-2.5 rounded-xl text-left transition-all flex items-center gap-3 border ${
                    isOptionSelected
                      ? "bg-rose-50 border-rose-500 shadow-md font-bold text-stone-900 cursor-default"
                      : isOptionUnselected
                      ? "bg-stone-100/50 border-stone-200 opacity-40 cursor-default"
                      : poll.currentQuestionActive && !voting
                      ? "bg-stone-50 hover:bg-rose-50/50 border-rose-100/50 hover:border-rose-400 cursor-pointer active:scale-[0.98]"
                      : "bg-stone-100 border-stone-200 cursor-not-allowed opacity-60"
                  }`;
                  badgeClass = "w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0 bg-gradient-to-br from-red-500 to-rose-600 shadow-md";
                } else {
                  buttonStyleClass = `w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 border-2 ${
                    isOptionSelected
                      ? "bg-[#F8FAFC] border-[var(--color-primary)] shadow-sm font-bold text-[#1E293B] cursor-default"
                      : isOptionUnselected
                      ? "bg-slate-100/50 border-slate-200 opacity-40 cursor-default"
                      : poll.currentQuestionActive && !voting
                      ? "bg-[#F8FAFC] hover:bg-slate-100 border-transparent hover:border-[var(--color-primary)] cursor-pointer active:scale-[0.98]"
                      : "bg-[#F1F5F9] border-transparent cursor-not-allowed opacity-60"
                  }`;
                  badgeClass = "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0";
                  badgeStyle = { backgroundColor: STANDARD_CHART_COLORS[idx % STANDARD_CHART_COLORS.length] };
                }

                return (
                  <button
                    key={idx}
                    onClick={() => voteForOptionHandler(idx)}
                    disabled={!poll.currentQuestionActive || voting || hasVoted}
                    className={buttonStyleClass}
                  >
                    <div className={badgeClass} style={badgeStyle}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className={isMasterclass || isSynergy ? "text-slate-900 font-semibold text-xs md:text-sm" : "text-[#1E293B] font-medium"}>
                      {option.text}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Word Cloud Input */}
          {!hasVoted && !!isWordCloud && (
            <div className="p-4 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className={`text-xs font-bold uppercase tracking-wider ${isMasterclass ? "text-emerald-600" : isSynergy ? "text-rose-600" : "text-[var(--color-primary)]"
                  }`}>
                  Your Answer
                </label>
                <input
                  type="text"
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  placeholder="Type your response (max 50 characters)..."
                  maxLength={50}
                  disabled={!poll.currentQuestionActive || localSubmitting}
                  className={`w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-1 bg-slate-50 disabled:opacity-60 text-slate-800 placeholder-slate-400 ${isMasterclass
                    ? "border-emerald-100 focus:border-emerald-500 focus:ring-emerald-500"
                    : isSynergy
                      ? "border-rose-100 focus:border-rose-500 focus:ring-rose-500"
                      : "border-slate-200 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                    }`}
                />
              </div>
              <button
                onClick={handleSubmitWord}
                disabled={!poll.currentQuestionActive || localSubmitting || !wordInput.trim()}
                className={`w-full py-3 text-white rounded-xl text-sm font-bold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isMasterclass
                  ? "bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-emerald-500/10"
                  : isSynergy
                    ? "bg-rose-600 hover:bg-rose-700 disabled:opacity-50 shadow-rose-500/10"
                    : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                  }`}
              >
                {!!(localSubmitting || voting) && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Answer
              </button>
            </div>
          )}

          {/* Message bar */}
          <div className={isMasterclass || isSynergy ? "px-3 pb-3" : "px-4 pb-4"}>
            {voting || localSubmitting ? (
              isMasterclass ? (
                <div className="flex items-center justify-center gap-2 p-2 bg-emerald-50 rounded-lg text-emerald-650 border border-emerald-100/20 text-xs font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transmitting response...</span>
                </div>
              ) : isSynergy ? (
                <div className="flex items-center justify-center gap-2 p-2 bg-rose-50 rounded-lg text-rose-650 border border-rose-100/20 text-xs font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transmitting sphere response...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 p-4 bg-[var(--color-primary)]/10 rounded-xl text-[var(--color-primary)]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium">Recording response...</span>
                </div>
              )
            ) : hasVoted ? (
              isMasterclass ? (
                <div className="flex items-center justify-center gap-2 p-2 bg-emerald-50 rounded-lg text-emerald-700 border border-emerald-100/50 text-xs font-semibold">
                  <Check className="w-4 h-4" />
                  <span>Answer recorded! Waiting for presenter to show results.</span>
                </div>
              ) : isSynergy ? (
                <div className="flex items-center justify-center gap-2 p-2 bg-rose-50 rounded-lg text-rose-700 border border-rose-100/50 text-xs font-semibold">
                  <Check className="w-4 h-4" />
                  <span>Response logged! Waiting for presenter to show results.</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 p-4 bg-green-100 rounded-xl text-green-700">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Your response is in! Waiting for presenter to show results.</span>
                </div>
              )
            ) : !poll.currentQuestionActive ? (
              isMasterclass ? (
                <div className="flex items-center justify-center gap-2 p-2 bg-slate-100 rounded-lg text-slate-600 border border-slate-200 text-xs font-semibold">
                  <Lock className="w-4 h-4" />
                  <span>Voting is currently locked.</span>
                </div>
              ) : isSynergy ? (
                <div className="flex items-center justify-center gap-2 p-2 bg-stone-100 rounded-lg text-stone-600 border border-stone-200 text-xs font-semibold">
                  <Lock className="w-4 h-4" />
                  <span>Voting is currently locked.</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 p-4 bg-yellow-100 rounded-xl text-yellow-700">
                  <Lock className="w-5 h-5" />
                  <span className="font-medium">Voting locked. Wait for host.</span>
                </div>
              )
            ) : isWordCloud ? (
              isMasterclass ? (
                <div className="text-center p-2 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100/30 text-xs font-semibold">
                  <span>Enter a word and tap submit to record your response</span>
                </div>
              ) : isSynergy ? (
                <div className="text-center p-2 bg-rose-50 rounded-lg text-rose-600 border border-rose-100/30 text-xs font-semibold">
                  <span>Enter a word and tap submit to record your response</span>
                </div>
              ) : (
                <div className="text-center p-4 bg-[var(--color-primary)]/10 rounded-xl text-[var(--color-primary)]">
                  <span className="font-medium">Enter a word and tap submit to record your response</span>
                </div>
              )
            ) : isMasterclass ? (
              <div className="text-center p-2 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100/30 text-xs font-semibold">
                <span>Tap an option to lock in your answer</span>
              </div>
            ) : isSynergy ? (
              <div className="text-center p-2 bg-rose-50 rounded-lg text-rose-600 border border-rose-100/30 text-xs font-semibold">
                <span>Tap an option to lock in your answer</span>
              </div>
            ) : (
              <div className="text-center p-4 bg-[var(--color-primary)]/10 rounded-xl text-[var(--color-primary)]">
                <span className="font-medium">Tap an option to vote</span>
              </div>
            )}
          </div>
        </div>

        {/* Emoji Reactions Panel */}
        {poll.status === "live" && poll.status !== undefined && (
          <div className={emojiPanelClass}>
            {["❤️", "🔥", "👏", "😂", "🤯"].map((emoji, idx) => (
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
