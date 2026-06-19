"use client";

import { 
  Plus, 
  Trash2, 
  Save, 
  ChevronLeft, 
  Loader2,
  Check,
  X,
  Sparkles
} from "lucide-react";

const CHART_COLORS = ["#ef4444"];

function VerticalBarChart({ options }) {
  return (
    <div className="flex items-end justify-center gap-4 h-48 px-4">
      {options.map((option, idx) => {
        const height = 30 + (idx * 15) % 70;
        return (
          <div key={idx} className="flex flex-col items-center gap-2">
            <div className="relative h-36 w-12 flex items-end">
              <div
                className="w-full rounded-t-lg transition-all duration-500 bg-gradient-to-t from-red-600 to-rose-400"
                style={{
                  height: `${height}%`,
                  minHeight: "8px",
                }}
              />
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-rose-950 truncate max-w-[60px]">
                {option || `Opt ${idx + 1}`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QuestionSlide({ question, index, isActive, onClick, onDelete, canDelete }) {
  const optionCount = question.options.filter(o => o.trim()).length;
  
  return (
    <div
      onClick={onClick}
      className={`relative p-3 rounded-xl cursor-pointer transition-all ${
        isActive
          ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25 scale-[1.02]"
          : "bg-white hover:bg-rose-50/30 border border-rose-100"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
          isActive ? "bg-white/20 text-white" : "bg-rose-100 text-rose-700"
        }`}>
          Q{index + 1}
        </span>
        {canDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className={`ml-auto p-1 rounded hover:bg-red-500/20 ${
              isActive ? "text-white/80 hover:text-white" : "text-rose-400 hover:text-rose-600"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <p className={`text-sm font-medium truncate ${
        isActive ? "text-white" : "text-rose-950"
      }`}>
        {question.text || "Untitled Question"}
      </p>
      <div className={`text-xs mt-1 ${
        isActive ? "text-white/70" : "text-rose-400"
      }`}>
        {optionCount} option{optionCount !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

export default function SynergySphereEdit({
  title,
  setTitle,
  questions,
  setQuestions,
  activeQuestionIndex,
  setActiveQuestionIndex,
  editingTitle,
  setEditingTitle,
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
    <div className="min-h-screen bg-stone-50 flex flex-col text-rose-950">
      <header className="bg-white border-b border-rose-100 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 rounded-lg hover:bg-rose-50 text-rose-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Poll Title"
                  className="text-xl font-bold text-rose-950 bg-transparent border-b-2 border-rose-500 focus:outline-none px-1"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
                />
                <button
                  onClick={() => setEditingTitle(false)}
                  className="p-1 rounded bg-rose-500 text-white"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingTitle(true)}
                className="text-xl font-bold text-rose-950 hover:text-rose-500 flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-rose-500" />
                {title || "Untitled Poll"}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {themeDropdown}
            <button
              onClick={addQuestion}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </button>
            <button
              onClick={handleSavePoll}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-rose-50/10 border-r border-rose-100 p-4 overflow-y-auto">
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
              />
            ))}
            
            <button
              onClick={addQuestion}
              className="w-full p-3 rounded-xl border-2 border-dashed border-rose-250 text-rose-500 hover:border-rose-500 hover:text-rose-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-8 flex items-center justify-center overflow-auto">
            <div className="w-full max-w-2xl">
              <div className="text-center mb-8">
                <input
                  type="text"
                  value={activeQuestion?.text || ""}
                  onChange={(e) => updateQuestionText(e.target.value)}
                  placeholder="Type your red question here..."
                  className="w-full text-2xl md:text-3xl font-bold text-center text-rose-950 bg-transparent border-none focus:outline-none focus:ring-0 placeholder-rose-200"
                />
                <div className="text-sm text-rose-500 mt-2">
                  Question {activeQuestionIndex + 1} of {questions.length}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-rose-100">
                <VerticalBarChart options={activeQuestion?.options || []} />
              </div>
            </div>
          </div>

          <div className="bg-white border-t border-rose-100 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-rose-500">Options</span>
                <button
                  onClick={addOption}
                  className="text-sm text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Option
                </button>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {activeQuestion?.options.map((option, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-stone-50 rounded-lg px-3 py-2 border border-rose-100 group"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      className="bg-transparent border-none focus:outline-none text-rose-950 w-32"
                    />
                    {activeQuestion.options.length > 2 && (
                      <button
                        onClick={() => removeOption(idx)}
                        className="p-1 rounded text-rose-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
