"use client";

import { 
  Plus, 
  Trash2, 
  Save, 
  ChevronLeft, 
  Loader2, 
  Check, 
  X, 
  AlignLeft, 
  Settings,
  GraduationCap
} from "lucide-react";
import { useState, useEffect } from "react";

// Masterclass Green Palette
const CHART_COLORS = ["#10b981"]; // Emerald-500

function VerticalBarChart({ options, showSampleData = true }) {
  const generateSampleVotes = () => {
    if (!showSampleData) return options.map(() => 0);
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
  }, [options.length, showSampleData]);

  const totalVotes = sampleVotes.reduce((a, b) => a + b, 0) || 1;
  const maxVotes = Math.max(...sampleVotes, 1);

  return (
    <div className="flex items-end justify-center gap-4 h-64 px-4 w-full max-w-lg mx-auto">
      {options.map((option, idx) => {
        const votes = sampleVotes[idx] || 0;
        const percentage = Math.round((votes / totalVotes) * 100);
        const height = (votes / maxVotes) * 100;

        return (
          <div
            key={idx}
            className="flex flex-col items-center gap-2 flex-1 max-w-[80px] h-full"
          >
            <div className="text-xs font-bold text-emerald-500 mb-1">{percentage}%</div>
            <div className="relative w-full flex items-end flex-1 bg-emerald-50 rounded-t-md overflow-hidden border border-emerald-100">
              <div
                className="w-full transition-all duration-500 rounded-t-md bg-gradient-to-t from-emerald-700 to-green-400"
                style={{
                  height: `${height}%`,
                  minHeight: votes > 0 ? "8px" : "0",
                }}
              />
            </div>
            <div className="text-center w-full">
              <div
                className="text-sm font-semibold text-emerald-950 truncate w-full"
                title={option.text}
              >
                {option.text || `Opt ${idx + 1}`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QuestionSlide({
  question,
  index,
  isActive,
  onClick,
  onDelete,
  canDelete,
}) {
  const optionCount = question.options ? question.options.filter((o) => o.trim()).length : 0;

  return (
    <div
      onClick={onClick}
      className={`relative p-4 rounded-xl cursor-pointer transition-all border ${
        isActive
          ? "bg-emerald-50/80 border-emerald-500 shadow-sm"
          : "bg-white hover:bg-emerald-50/30 border-slate-200"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded ${
            isActive
              ? "bg-emerald-500 text-white"
              : "bg-emerald-100/50 text-emerald-700"
          }`}
        >
          Q{index + 1}
        </span>
        {canDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="ml-auto p-1 rounded text-emerald-400 hover:bg-emerald-55 hover:text-emerald-600 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <p className="text-sm font-bold text-emerald-950 line-clamp-1 mb-1">
        {question.text || "Untitled Question"}
      </p>
      <div className="text-xs text-emerald-550">
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
                backgroundColor: isActive ? "#10b981" : "#a7f3d0",
              }}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center gap-1.5 h-6 mt-3 opacity-60 text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded py-0.5">
          ☁️ Word Cloud
        </div>
      )}
    </div>
  );
}

export default function MasterclassEdit({
  title,
  setTitle,
  questions,
  setQuestions,
  activeQuestionIndex,
  setActiveQuestionIndex,
  isSaving,
  handleSavePoll,
  router,
  themeDropdown
}) {
  const activeQuestion = questions[activeQuestionIndex];

  const addQuestion = () => {
    const newQuestions = [...questions, { text: "", options: ["", ""] }];
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

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden text-emerald-950">
      {/* Top Header */}
      <header className="bg-white border-b border-emerald-100 flex items-center justify-between shadow-sm z-20 relative h-16">
        <div className="w-96 h-full border-r border-emerald-100 flex items-center px-4 gap-3 bg-emerald-50/20">
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
              className="w-full text-lg font-bold text-emerald-950 bg-white border border-emerald-200 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-emerald-300 transition-all"
            />
          </div>
        </div>

        {/* Center: Dropdown */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-500 animate-bounce" />
            Masterclass Active
          </span>
          {themeDropdown}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 px-6">
          <button
            onClick={handleSavePoll}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20 text-sm disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes (MC)
          </button>
        </div>
      </header>

      {/* Main Workspace (3-Column Layout) */}
      <div className="flex flex-1 overflow-hidden">
        {/* 1. Left Sidebar: Question Slides */}
        <aside className="w-64 bg-emerald-50/10 border-r border-emerald-100 flex flex-col h-full">
          <div className="p-4 overflow-y-auto flex-1 space-y-3">
            {questions.map((q, idx) => (
              <QuestionSlide
                key={idx}
                question={q}
                index={idx}
                isActive={idx === activeQuestionIndex}
                onClick={() => setActiveQuestionIndex(idx)}
                onDelete={() => removeQuestion(idx)}
                canDelete={questions.length > 1}
              />
            ))}

            <button
              onClick={addQuestion}
              className="w-full p-4 rounded-xl border-2 border-dashed border-emerald-300 text-emerald-500 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-55 transition-all flex items-center justify-center gap-2 font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Class Slide
            </button>
          </div>

          <div className="p-4 border-t border-emerald-100 text-xs text-center text-rose-400">
            {questions.length} question{questions.length !== 1 ? "s" : ""} total
          </div>
        </aside>

        {/* 2. Center: Canvas / Preview */}
        <main className="flex-1 bg-stone-100 flex flex-col relative overflow-hidden">
          <div className="p-8 pb-4 flex justify-center">
            <input
              type="text"
              value={activeQuestion?.text || ""}
              onChange={(e) => updateQuestionText(e.target.value)}
              placeholder="Type your green-theme question..."
              className="w-full max-w-3xl text-3xl md:text-4xl font-bold text-center text-emerald-950 bg-transparent border-none focus:outline-none focus:ring-0 placeholder-emerald-200 transition-colors"
            />
          </div>

          <div className="flex-1 p-8 pt-4 flex items-center justify-center overflow-auto">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-8 border border-emerald-100 aspect-video flex flex-col justify-center">
              {activeQuestion?.text ? (
                <>
                  <h3 className="text-xl font-semibold text-center text-emerald-900 mb-8">
                    {activeQuestion.text}
                  </h3>
                  {activeQuestion.type === "WordCloud" ? (
                    <div className="flex flex-wrap gap-4 items-center justify-center p-6 text-emerald-500 min-h-[180px]">
                      <span className="text-4xl font-extrabold opacity-95">Interactive</span>
                      <span className="text-2xl font-bold opacity-65">Word</span>
                      <span className="text-5xl font-black text-emerald-650 animate-pulse">Cloud</span>
                      <span className="text-xl font-medium opacity-55">Realtime</span>
                      <span className="text-3xl font-semibold opacity-75">Live</span>
                    </div>
                  ) : (
                    <VerticalBarChart
                      key={activeQuestionIndex}
                      options={
                        activeQuestion?.options ? activeQuestion.options.map((o) => typeof o === "string" ? { text: o } : o) : []
                      }
                      showSampleData={true}
                    />
                  )}
                  <p className="text-xs text-emerald-450 text-center mt-6 italic">
                    * Masterclass preview mode
                  </p>
                </>
              ) : (
                <div className="text-center text-emerald-300">
                  <AlignLeft className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Start typing your question and options...</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* 3. Right Sidebar: Options Editor */}
        <aside className="w-80 bg-white border-l border-emerald-100 flex flex-col h-full shadow-lg z-10">
          <div className="p-5 border-b border-emerald-50 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-emerald-800">Class Settings</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {/* Question Type Dropdown */}
            <div className="mb-6">
              <label className="text-xs font-bold text-emerald-500 uppercase tracking-wider block mb-2">
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
                className="w-full p-2 rounded-lg border border-emerald-200 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-slate-700 bg-white"
              >
                <option value="MultipleChoice">Multiple Choice</option>
                <option value="WordCloud">Word Cloud</option>
              </select>
            </div>

            {activeQuestion?.type !== "WordCloud" ? (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                    Options
                  </label>
                  <span className="text-xs text-emerald-450 text-right">
                    {activeQuestion?.options?.length || 0} items
                  </span>
                </div>

                <div className="space-y-3">
                  {activeQuestion?.options?.map((option, idx) => (
                    <div key={idx} className="flex items-center gap-2 group">
                      <div
                        className="w-1.5 h-8 rounded-full bg-emerald-200 flex-shrink-0"
                        style={{
                          backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                        }}
                      />
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={typeof option === "string" ? option : option.text || ""}
                          onChange={(e) => updateOption(idx, e.target.value)}
                          placeholder={`Option ${idx + 1}`}
                          className="w-full pl-3 pr-8 py-2 rounded-lg border border-emerald-200 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder-emerald-200"
                        />
                        {activeQuestion.options.length > 2 && (
                          <button
                            onClick={() => removeOption(idx)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-300 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addOption}
                  className="mt-4 w-full py-2.5 rounded-lg border border-emerald-200 text-emerald-600 hover:border-emerald-500 hover:text-emerald-600 transition-all text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Option
                </button>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl text-center text-xs text-emerald-700">
                ☁️ <strong>Word Cloud Mode</strong> collects free-text answers from voters. No options are needed!
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
