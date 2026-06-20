"use client";

import { 
  Plus, 
  Trash2, 
  Play, 
  ChevronLeft, 
  Loader2, 
  Check, 
  X, 
  AlignLeft, 
  Settings,
  Sparkles,
  GraduationCap
} from "lucide-react";
import { useState, useEffect } from "react";

const STANDARD_CHART_COLORS = [
  "#6366F1", "#8B5CF6", "#EC4899", "#F59E0B",
  "#10B981", "#3B82F6", "#EF4444", "#14B8A6",
];

const MASTERCLASS_CHART_COLORS = ["#10b981"];
const SYNERGY_CHART_COLORS = ["#ef4444"];
const SYNERGY_PRESENTER_COLORS = [
  "linear-gradient(to top, #3a7bd5, #3a6073)", // Slate Blue
  "linear-gradient(to top, #7fa99b, #a8d3c5)", // Sage/Mint
  "linear-gradient(to top, #8fbc8f, #b8e2b8)", // Pastel Green
  "linear-gradient(to top, #e5a93b, #f5d061)", // Soft Gold
  "linear-gradient(to top, #cd5c5c, #f08080)"  // Soft Coral
];

function VerticalBarChart({ options, theme }) {
  const generateSampleVotes = () => {
    const total = 100;
    let remaining = total;
    return options.map((_, idx) => {
      if (idx === options.length - 1) return remaining;
      const vote = Math.floor(Math.random() * remaining * 0.7);
      remaining -= vote;
      return vote;
    });
  };

  const [sampleVotes, setSampleVotes] = useState([]);

  useEffect(() => {
    setSampleVotes(generateSampleVotes());
  }, [options.length]);

  const totalVotes = sampleVotes.reduce((a, b) => a + b, 0) || 1;
  const maxVotes = Math.max(...sampleVotes, 1);

  const isMasterclass = theme === "masterclass";
  const isSynergy = theme === "synergy_sphere";

  return (
    <div className="flex items-end justify-center gap-4 h-56 px-4 w-full max-w-lg mx-auto">
      {options.map((option, idx) => {
        const votes = sampleVotes[idx] || 0;
        const percentage = Math.round((votes / totalVotes) * 100);
        const height = (votes / maxVotes) * 100;
        const optionText = typeof option === "string" ? option : (option?.text || "");

        return (
          <div key={idx} className="flex flex-col items-center gap-2 flex-1 max-w-[80px] h-full justify-end">
            <div className={`text-xs font-bold ${
              isMasterclass ? "text-emerald-500" : isSynergy ? "text-rose-200" : "text-[#6366F1]"
            }`}>
              {percentage}%
            </div>
            <div className={`relative w-full flex items-end h-28 rounded-t-lg overflow-hidden border ${
              isMasterclass 
                ? "bg-emerald-50 border-emerald-100" 
                : isSynergy 
                ? "bg-transparent border-white/20" 
                : "bg-slate-50 border-slate-200"
            }`}>
              <div
                className={`w-full transition-all duration-500 rounded-t-lg ${
                  isMasterclass
                    ? "bg-gradient-to-t from-emerald-700 to-green-400"
                    : isSynergy
                    ? "border-t-2 border-x-2 border-white/80"
                    : ""
                }`}
                style={{
                  height: `${height}%`,
                  background: isSynergy 
                    ? SYNERGY_PRESENTER_COLORS[idx % SYNERGY_PRESENTER_COLORS.length] 
                    : (!isMasterclass ? STANDARD_CHART_COLORS[idx % STANDARD_CHART_COLORS.length] : undefined),
                  minHeight: votes > 0 ? "8px" : "4px",
                }}
              />
            </div>
            <div className="text-center w-full">
              <div className={`text-sm font-semibold truncate w-full ${
                isMasterclass ? "text-emerald-950" : isSynergy ? "text-rose-100" : "text-[#1E293B]"
              }`} title={optionText}>
                {optionText || `Opt ${idx + 1}`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QuestionSlide({ question, index, isActive, onClick, onDelete, canDelete, theme }) {
  const optionCount = question.options ? question.options.filter(o => o.trim()).length : 0;
  
  const isMasterclass = theme === "masterclass";
  const isSynergy = theme === "synergy_sphere";

  let slideClass = "";
  let badgeClass = "";
  let textClass = "";
  let subTextClass = "";
  let trashButtonClass = "";

  if (isMasterclass) {
    slideClass = `relative p-4 rounded-xl cursor-pointer transition-all border ${
      isActive
        ? "bg-emerald-50/80 border-emerald-500 shadow-sm"
        : "bg-white hover:bg-emerald-50/30 border-slate-200"
    }`;
    badgeClass = `text-xs font-bold px-2 py-0.5 rounded ${
      isActive ? "bg-emerald-500 text-white" : "bg-emerald-100/50 text-emerald-700"
    }`;
    textClass = "text-sm font-bold text-emerald-950 line-clamp-1 mb-1";
    subTextClass = "text-xs text-emerald-500";
    trashButtonClass = "ml-auto p-1 rounded text-emerald-400 hover:bg-emerald-55 hover:text-emerald-600 transition-colors";
  } else if (isSynergy) {
    slideClass = `relative p-3 rounded-xl cursor-pointer transition-all border ${
      isActive
        ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25 scale-[1.02] border-rose-500"
        : "bg-stone-900/40 hover:bg-stone-900/60 border-rose-900/30 text-rose-100"
    }`;
    badgeClass = `text-xs font-bold px-2 py-0.5 rounded ${
      isActive ? "bg-white/20 text-white" : "bg-rose-900/50 text-rose-300"
    }`;
    textClass = `text-sm font-medium truncate ${isActive ? "text-white" : "text-rose-100"}`;
    subTextClass = `text-xs mt-1 ${isActive ? "text-white/70" : "text-rose-300"}`;
    trashButtonClass = `ml-auto p-1 rounded hover:bg-red-500/20 ${
      isActive ? "text-white/80 hover:text-white" : "text-rose-300 hover:text-rose-100"
    }`;
  } else {
    slideClass = `relative p-3 rounded-xl cursor-pointer transition-all border ${
      isActive
        ? "bg-[#6366F1] text-white shadow-lg shadow-[#6366F1]/25 scale-[1.02]"
        : "bg-white hover:bg-slate-50 border border-slate-200"
    }`;
    badgeClass = `text-xs font-bold px-2 py-0.5 rounded ${
      isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
    }`;
    textClass = `text-sm font-medium truncate ${isActive ? "text-white" : "text-[#1E293B]"}`;
    subTextClass = `text-xs mt-1 ${isActive ? "text-white/70" : "text-slate-500"}`;
    trashButtonClass = `ml-auto p-1 rounded hover:bg-red-500/20 ${
      isActive ? "text-white/80 hover:text-white" : "text-slate-400 hover:text-red-500"
    }`;
  }

  return (
    <div onClick={onClick} className={slideClass}>
      <div className="flex items-center gap-2 mb-2">
        <span className={badgeClass}>
          Q{index + 1}
        </span>
        {canDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className={trashButtonClass}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <p className={textClass}>
        {question.text || "Untitled Question"}
      </p>
      <div className={subTextClass}>
        {question.type === "WordCloud" ? "Word Cloud" : `${optionCount} option${optionCount !== 1 ? "s" : ""}`}
      </div>

      {question.type !== "WordCloud" && question.options ? (
        <div className="flex items-end gap-1 h-6 mt-3 opacity-60">
          {question.options.slice(0, 4).map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-t"
              style={{
                height: `${30 + i * 20}%`,
                backgroundColor: isActive 
                  ? (isMasterclass ? "#10b981" : isSynergy ? "#ef4444" : "#6366F1") 
                  : "#cbd5e1",
              }}
            />
          ))}
        </div>
      ) : (
        <div className={`flex items-center justify-center gap-1.5 h-6 mt-3 text-[10px] font-bold rounded py-0.5 ${isActive ? "opacity-100" : "opacity-60"} ${
          isMasterclass 
            ? (isActive ? "text-white bg-white/20" : "text-emerald-700 bg-emerald-55") 
            : isSynergy 
            ? (isActive ? "text-white bg-white/25" : "text-rose-300 bg-stone-900/60 border border-rose-900/30") 
            : (isActive ? "text-white bg-white/20" : "text-[#6366F1] bg-indigo-50")
        }`}>
          ☁️ Word Cloud
        </div>
      )}
    </div>
  );
}

export default function StandardCreate({
  title,
  setTitle,
  questions,
  setQuestions,
  activeQuestionIndex,
  setActiveQuestionIndex,
  isSaving,
  handleCreatePoll,
  router,
  themeDropdown,
  theme = "standard"
}) {
  const activeQuestion = questions[activeQuestionIndex];

  const addQuestion = () => {
    const newQuestions = [...questions, { text: "", type: "MultipleChoice", options: ["", ""] }];
    setQuestions(newQuestions);
    setActiveQuestionIndex(newQuestions.length - 1);
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) return;
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    if (activeQuestionIndex >= newQuestions.length) {
      setActiveQuestionIndex(newQuestions.length - 1);
    }
  };

  const updateQuestionText = (text) => {
    const newQuestions = [...questions];
    newQuestions[activeQuestionIndex].text = text;
    setQuestions(newQuestions);
  };

  const addOption = () => {
    const newQuestions = [...questions];
    if (!newQuestions[activeQuestionIndex].options) {
      newQuestions[activeQuestionIndex].options = [];
    }
    newQuestions[activeQuestionIndex].options.push("");
    setQuestions(newQuestions);
  };

  const updateOption = (optionIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[activeQuestionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const removeOption = (optionIndex) => {
    if (activeQuestion.options.length <= 2) return;
    const newQuestions = [...questions];
    newQuestions[activeQuestionIndex].options.splice(optionIndex, 1);
    setQuestions(newQuestions);
  };

  const isMasterclass = theme === "masterclass";
  const isSynergy = theme === "synergy_sphere";

  // Dynamic layout styling
  let mainWrapperClass = "h-screen bg-slate-50 flex flex-col text-[#1E293B] relative overflow-hidden";
  let headerClass = "bg-white border-b border-slate-200 px-4 py-3 z-10 relative h-16 flex items-center";
  let headerLeftBgClass = "flex items-center gap-4";
  let titleInputClass = "text-xl font-bold text-text bg-transparent border-b-2 border-primary focus:outline-none px-1";
  let sidebarClass = "w-64 bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto z-10 relative h-full";
  let previewAreaClass = "flex-1 bg-slate-100 flex flex-col relative overflow-hidden z-10 h-full";
  let previewCardClass = "w-full max-w-3xl bg-white rounded-2xl shadow-xl p-8 border border-slate-200 aspect-video flex flex-col justify-center";
  let rightSidebarClass = "w-80 bg-white border-l border-slate-200 flex flex-col h-full shadow-lg z-10";

  if (isMasterclass) {
    mainWrapperClass = "h-screen bg-[url('/MasterClassNewBg.png')] bg-cover bg-center bg-no-repeat flex flex-col overflow-hidden text-emerald-950 relative";
    headerClass = "bg-white/75 backdrop-blur-md border-b border-emerald-100 flex items-center justify-between shadow-sm z-20 relative h-16";
    headerLeftBgClass = "w-96 h-full border-r border-emerald-100 flex items-center px-4 gap-3 bg-emerald-55/20";
    titleInputClass = "w-full text-lg font-bold text-emerald-950 bg-white/80 border border-emerald-200 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-emerald-300 transition-all";
    sidebarClass = "w-64 bg-emerald-50/15 border-r border-emerald-100/30 flex flex-col h-full z-10 relative p-4 overflow-y-auto";
    previewAreaClass = "flex-1 bg-transparent flex flex-col relative overflow-hidden z-10 h-full";
    previewCardClass = "w-full max-w-3xl bg-white rounded-2xl shadow-xl p-8 border border-emerald-100 aspect-video flex flex-col justify-center";
    rightSidebarClass = "w-80 bg-white/75 backdrop-blur-md border-l border-emerald-100 flex flex-col h-full shadow-lg z-10";
  } else if (isSynergy) {
    mainWrapperClass = "h-screen bg-[url('/SynegrysphereBG.png')] bg-cover bg-center bg-no-repeat flex flex-col text-white relative overflow-hidden";
    headerClass = "bg-stone-900/50 backdrop-blur-md border-b border-rose-100/20 px-4 py-3 z-10 relative h-16 flex items-center";
    headerLeftBgClass = "flex items-center gap-4 text-white";
    titleInputClass = "text-xl font-bold text-white bg-transparent border-b-2 border-rose-500 focus:outline-none px-1";
    sidebarClass = "w-64 bg-stone-900/35 backdrop-blur-sm border-r border-rose-100/20 p-4 overflow-y-auto z-10 relative h-full";
    previewAreaClass = "flex-1 bg-transparent flex flex-col relative overflow-hidden z-10 h-full";
    previewCardClass = "w-full max-w-3xl bg-transparent border-none shadow-none p-8 aspect-video flex flex-col justify-center";
    rightSidebarClass = "w-80 bg-stone-900/50 backdrop-blur-md border-l border-rose-100/20 flex flex-col h-full shadow-lg z-10";
  }

  return (
    <div className={mainWrapperClass}>

      {/* Header */}
      {isMasterclass ? (
        <header className={headerClass}>
          <div className={headerLeftBgClass}>
            <button
              onClick={() => router.push("/dashboard")}
              className="p-1.5 rounded-lg hover:bg-white text-emerald-500 hover:text-emerald-800 transition-all border border-transparent hover:border-emerald-200"
              title="Back to Dashboard"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masterclass Poll"
                className={titleInputClass}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-500 animate-bounce" />
              Masterclass Active
            </span>
            {themeDropdown}
          </div>

          <div className="flex items-center gap-3 px-6">
            <button
              onClick={() => handleCreatePoll("dashboard")}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-55 hover:text-emerald-900 transition-all text-sm font-medium disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Create (MC)
            </button>
            <button
              onClick={() => handleCreatePoll("present")}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20 text-sm disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Launch Live Masterclass
            </button>
          </div>
        </header>
      ) : (
        <header className={headerClass}>
          <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className={`p-2 rounded-lg ${isSynergy ? "hover:bg-stone-800/40 text-rose-300" : "hover:bg-slate-100 text-slate-650"}`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Poll Title"
                className={isSynergy ? "text-xl font-bold text-white bg-transparent border-b-2 border-rose-500 focus:outline-none px-1" : "text-xl font-bold text-slate-800 bg-transparent border-b border-slate-300 focus:outline-none focus:border-[#6366F1] px-1"}
              />
            </div>

            <div className="flex items-center gap-3">
              {isSynergy && (
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-300 bg-rose-950/40 border border-rose-900/30 px-2 py-1 rounded">
                  <Sparkles className="w-3.5 h-3.5 text-rose-450 animate-pulse" />
                  Synergy Active
                </span>
              )}
              {themeDropdown}
              <button
                onClick={() => handleCreatePoll("dashboard")}
                disabled={isSaving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm disabled:opacity-50 ${
                  isSynergy ? "bg-stone-800 border border-rose-300/20 text-rose-200 hover:bg-stone-700" : "bg-white border border-slate-200 text-slate-650 hover:bg-slate-50"
                }`}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Create
              </button>
              <button
                onClick={() => handleCreatePoll("present")}
                disabled={isSaving}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 text-sm ${
                  isSynergy ? "bg-gradient-to-r from-red-500 to-rose-600 shadow-lg shadow-rose-500/20" : "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] shadow-lg shadow-indigo-500/20"
                }`}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Start Presentation
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Workspace Layout (Unified 3-Column Layout) */}
      <div className="flex flex-1 overflow-hidden z-10">
        {/* 1. Left Sidebar */}
        <aside className={sidebarClass}>
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <QuestionSlide
                key={idx}
                question={q}
                index={idx}
                isActive={idx === activeQuestionIndex}
                onClick={() => setActiveQuestionIndex(idx)}
                onDelete={() => removeQuestion(idx)}
                canDelete={questions.length > 1}
                theme={theme}
              />
            ))}
            
            <button
              onClick={addQuestion}
              className={`w-full p-4 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2 font-medium text-sm ${
                isMasterclass
                  ? "border-emerald-300 text-emerald-500 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/20"
                  : isSynergy
                  ? "border-rose-250 text-rose-500 hover:border-rose-500 hover:text-rose-600 hover:bg-rose-50/20"
                  : "border-slate-300 text-slate-500 hover:border-[#6366F1] hover:text-[#6366F1] hover:bg-indigo-50/20"
              }`}
            >
              <Plus className="w-4 h-4" />
              {isMasterclass ? "New Class Slide" : "New Question"}
            </button>
          </div>
        </aside>

        {/* 2. Center Canvas */}
        <main className={previewAreaClass}>
          <div className="p-8 pb-4 flex justify-center">
            <input
              type="text"
              value={activeQuestion?.text || ""}
              onChange={(e) => updateQuestionText(e.target.value)}
              placeholder={
                isMasterclass 
                  ? "Type your green-theme question..." 
                  : isSynergy 
                  ? "Type your red question here..." 
                  : "Type your question here..."
              }
              className={`w-full max-w-3xl text-3xl md:text-4xl font-bold text-center bg-transparent border-none focus:outline-none focus:ring-0 placeholder-slate-350 transition-colors ${
                isMasterclass ? "text-emerald-950" : isSynergy ? "text-white" : "text-slate-800"
              }`}
            />
          </div>

          <div className="flex-1 p-8 pt-4 flex items-center justify-center overflow-auto">
            <div className={previewCardClass}>
              {activeQuestion?.text || (isMasterclass && activeQuestion) ? (
                <>
                  {isMasterclass && (
                    <h3 className="text-xl font-semibold text-center text-emerald-900 mb-8">
                      {activeQuestion.text}
                    </h3>
                  )}
                  {activeQuestion.type === "WordCloud" ? (
                    <div className={`flex flex-wrap gap-4 items-center justify-center p-6 min-h-[180px] ${
                      isMasterclass ? "text-emerald-500" : isSynergy ? "text-rose-500" : "text-[#6366F1]"
                    }`}>
                      <span className="text-4xl font-extrabold opacity-95">Interactive</span>
                      <span className="text-2xl font-bold opacity-65">Word</span>
                      <span className={`text-5xl font-black animate-pulse ${
                        isMasterclass ? "text-emerald-600" : isSynergy ? "text-rose-650" : "text-[#6366F1]"
                      }`}>Cloud</span>
                      <span className="text-xl font-medium opacity-55">Realtime</span>
                      <span className="text-3xl font-semibold opacity-75">Live</span>
                    </div>
                  ) : (
                    <VerticalBarChart
                      key={activeQuestionIndex}
                      options={
                        activeQuestion?.options 
                          ? activeQuestion.options.map((o) => typeof o === "string" ? { text: o } : o) 
                          : []
                      }
                      theme={theme}
                    />
                  )}
                  <p className={`text-xs text-center mt-6 italic ${
                    isMasterclass ? "text-emerald-450" : isSynergy ? "text-rose-200/60" : "text-slate-400"
                  }`}>
                    {isMasterclass ? "* Masterclass preview mode" : "* Random data for visual representation only"}
                  </p>
                </>
              ) : (
                <div className={`text-center ${isMasterclass ? "text-emerald-300" : isSynergy ? "text-rose-200" : "text-slate-400"}`}>
                  <AlignLeft className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Start typing your question and options...</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* 3. Right Sidebar Settings Panel */}
        <aside className={rightSidebarClass}>
          <div className={`p-5 border-b flex items-center gap-2 ${
            isMasterclass ? "border-emerald-100/20" : isSynergy ? "border-rose-100/20" : "border-slate-105"
          }`}>
            <Settings className={`w-5 h-5 ${
              isMasterclass ? "text-emerald-450" : isSynergy ? "text-rose-300" : "text-slate-400"
            }`} />
            <h2 className={`font-bold ${
              isMasterclass ? "text-emerald-800" : isSynergy ? "text-rose-100" : "text-slate-700"
            }`}>Question Settings</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {/* Question Type Selection */}
            <div className="mb-6">
              <label className={`text-xs font-bold uppercase tracking-wider block mb-2 ${
                isMasterclass ? "text-emerald-500" : isSynergy ? "text-rose-300" : "text-slate-500"
              }`}>
                Question Type
              </label>
              <select
                value={activeQuestion?.type || "MultipleChoice"}
                onChange={(e) => {
                  const newQuestions = [...questions];
                  newQuestions[activeQuestionIndex].type = e.target.value;
                  if (e.target.value === "WordCloud") {
                    newQuestions[activeQuestionIndex].options = [];
                  } else if (!newQuestions[activeQuestionIndex].options?.length) {
                    newQuestions[activeQuestionIndex].options = ["", ""];
                  }
                  setQuestions(newQuestions);
                }}
                className={`w-full p-2 rounded-lg border text-sm focus:ring-1 outline-none transition-all ${
                  isMasterclass
                    ? "border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white text-slate-700"
                    : isSynergy
                    ? "border-rose-300/30 focus:border-rose-500 focus:ring-rose-500 bg-stone-800 text-white"
                    : "border-slate-200 focus:border-[#6366F1] focus:ring-[#6366F1] bg-white text-slate-700"
                }`}
              >
                <option value="MultipleChoice" className={isSynergy ? "bg-stone-800 text-white" : "bg-white text-slate-700"}>Multiple Choice</option>
                <option value="WordCloud" className={isSynergy ? "bg-stone-800 text-white" : "bg-white text-slate-700"}>Word Cloud</option>
              </select>
            </div>

            {/* Options Management */}
            {activeQuestion?.type !== "WordCloud" ? (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className={`text-xs font-bold uppercase tracking-wider block ${
                    isMasterclass ? "text-emerald-500" : isSynergy ? "text-rose-300" : "text-slate-500"
                  }`}>
                    Options
                  </label>
                  <span className={`text-xs text-right ${
                    isMasterclass ? "text-emerald-450" : isSynergy ? "text-rose-400" : "text-slate-400"
                  }`}>
                    {activeQuestion?.options?.length || 0} items
                  </span>
                </div>

                <div className="space-y-3">
                  {activeQuestion?.options?.map((option, idx) => {
                    let indicatorBg = "";
                    let inputClass = "w-full pl-3 pr-8 py-2 rounded-lg border text-sm outline-none transition-all placeholder-slate-350 ";

                    if (isMasterclass) {
                      indicatorBg = MASTERCLASS_CHART_COLORS[idx % MASTERCLASS_CHART_COLORS.length];
                      inputClass += "focus:border-emerald-500 focus:ring-emerald-500 border-emerald-200 bg-white text-slate-800";
                    } else if (isSynergy) {
                      indicatorBg = SYNERGY_CHART_COLORS[idx % SYNERGY_CHART_COLORS.length];
                      inputClass += "focus:border-rose-500 focus:ring-rose-500 border-rose-300/30 bg-stone-800 text-white placeholder-rose-250/50";
                    } else {
                      indicatorBg = STANDARD_CHART_COLORS[idx % STANDARD_CHART_COLORS.length];
                      inputClass += "focus:border-[#6366F1] focus:ring-[#6366F1] border-slate-200 bg-white text-slate-800";
                    }

                    return (
                      <div key={idx} className="flex items-center gap-2 group">
                        <div
                          className="w-1.5 h-8 rounded-full flex-shrink-0"
                          style={{ backgroundColor: indicatorBg }}
                        />
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={typeof option === "string" ? option : option?.text || ""}
                            onChange={(e) => updateOption(idx, e.target.value)}
                            placeholder={`Option ${idx + 1}`}
                            className={inputClass}
                          />
                          {activeQuestion.options.length > 2 && (
                            <button
                              onClick={() => removeOption(idx)}
                              className={`absolute right-2 top-1/2 -translate-y-1/2 transition-colors ${
                                isMasterclass ? "text-emerald-300 hover:text-red-500" : isSynergy ? "text-rose-300 hover:text-red-500" : "text-slate-300 hover:text-red-500"
                              }`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={addOption}
                  className={`mt-4 w-full py-2.5 rounded-lg border transition-all text-sm font-medium flex items-center justify-center gap-2 ${
                    isMasterclass
                      ? "border-emerald-200 text-emerald-650 hover:border-emerald-500 hover:text-emerald-700 bg-slate-50/50"
                      : isSynergy
                      ? "border-rose-300/20 text-rose-200 hover:border-rose-450 hover:text-rose-100 bg-white/5"
                      : "border-slate-200 text-[#6366F1] hover:border-[#6366F1] hover:text-indigo-700 bg-slate-50/50"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Add Option
                </button>
              </div>
            ) : (
              <div className={`p-4 border rounded-xl text-center text-xs font-semibold ${
                isMasterclass 
                  ? "bg-emerald-50/50 border-emerald-100 text-emerald-700" 
                  : isSynergy 
                  ? "bg-stone-900/60 border-rose-900/50 text-rose-200" 
                  : "bg-indigo-55/50 border-slate-200 text-[#6366F1]"
              }`}>
                ☁️ <strong>Word Cloud Mode</strong> collects free-text answers from voters. No options are needed!
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
