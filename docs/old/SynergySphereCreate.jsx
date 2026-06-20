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
  Sparkles
} from "lucide-react";
import { useState, useEffect } from "react";

// Synergy Sphere Red/Rose Palette
const CHART_COLORS = ["#f43f5e"]; // Rose-500

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
            <div className="text-xs font-bold text-rose-500 mb-1">{percentage}%</div>
            <div className="relative w-full flex items-end flex-1 bg-rose-50 rounded-t-lg overflow-hidden border border-rose-100">
              <div
                className="w-full transition-all duration-500 rounded-t-lg bg-gradient-to-t from-red-600 to-rose-400"
                style={{
                  height: `${height}%`,
                  minHeight: votes > 0 ? "8px" : "0",
                }}
              />
            </div>
            <div className="text-center w-full">
              <div
                className="text-sm font-semibold text-rose-950 truncate w-full"
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
  const optionCount = question.options.filter((o) => o.trim()).length;

  return (
    <div
      onClick={onClick}
      className={`relative p-4 rounded-xl cursor-pointer transition-all border ${
        isActive
          ? "bg-rose-50/80 border-rose-500 shadow-sm"
          : "bg-white hover:bg-rose-50/30 border-slate-200"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded ${
            isActive
              ? "bg-rose-500 text-white"
              : "bg-rose-100/50 text-rose-700"
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
            className="ml-auto p-1 rounded text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <p className="text-sm font-bold text-rose-950 line-clamp-1 mb-1">
        {question.text || "Untitled Question"}
      </p>
      <div className="text-xs text-rose-500">
        {optionCount} option{optionCount !== 1 ? "s" : ""}
      </div>
      <div className="flex items-end gap-1 h-6 mt-3 opacity-60">
        {question.options.slice(0, 4).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-t"
            style={{
              height: `${30 + i * 20}%`,
              backgroundColor: isActive ? "#f43f5e" : "#fda4af",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function SynergySphereCreate({
  title,
  setTitle,
  questions,
  setQuestions,
  activeQuestionIndex,
  setActiveQuestionIndex,
  isSaving,
  handleCreatePoll,
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
    <div className="h-screen bg-stone-50 flex flex-col overflow-hidden text-rose-950">
      {/* Top Header */}
      <header className="bg-white border-b border-rose-100 flex items-center justify-between shadow-sm z-20 relative h-16">
        <div className="w-96 h-full border-r border-rose-100 flex items-center px-4 gap-3 bg-rose-50/20">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-1.5 rounded-lg hover:bg-white text-rose-500 hover:text-rose-800 transition-all border border-transparent hover:border-rose-200"
            title="Back to Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Synergy Sphere Poll"
              className="w-full text-lg font-bold text-rose-950 bg-white border border-rose-200 rounded-lg px-4 py-2 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 placeholder-rose-300 transition-all"
            />
          </div>
        </div>

        {/* Center: Dropdown */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-1 rounded">
            <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            Synergy Sphere Active
          </span>
          {themeDropdown}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 px-6">
          <button
            onClick={() => handleCreatePoll("dashboard")}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-900 transition-all text-sm font-medium disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Create (SS)
          </button>
          <button
            onClick={() => handleCreatePoll("present")}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-rose-500/20 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Launch Live Sphere
          </button>
        </div>
      </header>

      {/* Main Workspace (3-Column Layout) */}
      <div className="flex flex-1 overflow-hidden">
        {/* 1. Left Sidebar: Question Slides */}
        <aside className="w-64 bg-rose-50/10 border-r border-rose-100 flex flex-col h-full">
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
              className="w-full p-4 rounded-xl border-2 border-dashed border-rose-300 text-rose-500 hover:border-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center gap-2 font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Sphere Slide
            </button>
          </div>

          <div className="p-4 border-t border-rose-100 text-xs text-center text-rose-400">
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
              placeholder="Type your red-theme question..."
              className="w-full max-w-3xl text-3xl md:text-4xl font-bold text-center text-rose-950 bg-transparent border-none focus:outline-none focus:ring-0 placeholder-rose-200 transition-colors"
            />
          </div>

          <div className="flex-1 p-8 pt-4 flex items-center justify-center overflow-auto">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-8 border border-rose-100 aspect-video flex flex-col justify-center">
              {activeQuestion?.text ? (
                <>
                  <h3 className="text-xl font-semibold text-center text-rose-900 mb-8">
                    {activeQuestion.text}
                  </h3>
                  <VerticalBarChart
                    key={activeQuestionIndex}
                    options={
                      activeQuestion?.options.map((o) => ({ text: o })) || []
                    }
                    showSampleData={true}
                  />
                  <p className="text-xs text-rose-400 text-center mt-6 italic">
                    * Synergy Sphere preview mode
                  </p>
                </>
              ) : (
                <div className="text-center text-rose-300">
                  <AlignLeft className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Start typing your question and options...</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* 3. Right Sidebar: Options Editor */}
        <aside className="w-80 bg-white border-l border-rose-100 flex flex-col h-full shadow-lg z-10">
          <div className="p-5 border-b border-rose-50 flex items-center gap-2">
            <Settings className="w-5 h-5 text-rose-400" />
            <h2 className="font-bold text-rose-800">Sphere Settings</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-rose-500 uppercase tracking-wider">
                  Options
                </label>
                <span className="text-xs text-rose-400 text-right">
                  {activeQuestion?.options.length} items
                </span>
              </div>

              <div className="space-y-3">
                {activeQuestion?.options.map((option, idx) => (
                  <div key={idx} className="flex items-center gap-2 group">
                    <div
                      className="w-1.5 h-8 rounded-full bg-rose-200 flex-shrink-0"
                      style={{
                        backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                      }}
                    />
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(idx, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        className="w-full pl-3 pr-8 py-2 rounded-lg border border-rose-200 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all placeholder-rose-200"
                      />
                      {activeQuestion.options.length > 2 && (
                        <button
                          onClick={() => removeOption(idx)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-rose-300 hover:text-red-500 transition-colors"
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
                className="mt-4 w-full py-2.5 rounded-lg border border-rose-200 text-rose-600 hover:border-rose-500 hover:text-rose-600 transition-all text-sm font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Sphere Option
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
