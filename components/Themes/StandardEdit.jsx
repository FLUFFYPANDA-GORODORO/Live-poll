"use client";

import { 
  Plus, 
  Trash2, 
  Save, 
  ChevronLeft, 
  Loader2,
  Check,
  X,
  Sparkles,
  AlignLeft,
  Settings,
  Palette,
  LayoutTemplate,
  BarChart2,
  Cloud,
  MessageSquare,
  ListOrdered,
  Image as ImageIcon,
  Play
} from "lucide-react";
import { useState, useEffect } from "react";

const STANDARD_CHART_COLORS = [
  "#6366F1", "#8B5CF6", "#EC4899", "#F59E0B",
  "#10B981", "#3B82F6", "#EF4444", "#14B8A6",
];

function VerticalBarChart({ options }) {
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

  return (
    <div className="flex items-end justify-center gap-4 h-56 px-4 w-full max-w-lg mx-auto">
      {options.map((option, idx) => {
        const votes = sampleVotes[idx] || 0;
        const percentage = Math.round((votes / totalVotes) * 100);
        const height = (votes / maxVotes) * 100;
        const optionText = typeof option === "string" ? option : (option?.text || "");

        return (
          <div key={idx} className="flex flex-col items-center gap-2 flex-1 max-w-[80px] h-full justify-end">
            <div className="text-xs font-bold text-[#6366F1]">
              {percentage}%
            </div>
            <div className="relative w-full flex items-end h-28 rounded-t-lg overflow-hidden border bg-slate-50 border-slate-200">
              <div
                className="w-full transition-all duration-500 rounded-t-lg"
                style={{
                  height: `${height}%`,
                  background: STANDARD_CHART_COLORS[idx % STANDARD_CHART_COLORS.length],
                  minHeight: votes > 0 ? "8px" : "4px",
                }}
              />
            </div>
            <div className="text-center w-full">
              <div className="text-sm font-semibold truncate w-full text-[#1E293B]" title={optionText}>
                {optionText || `Option ${idx + 1}`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DonutPieChart({ options, isDonut = true }) {
  const count = options?.length || 1;
  const sliceSize = 100 / count;

  const conicStops = options.map((_, idx) => {
    const start = (idx * sliceSize).toFixed(1);
    const end = ((idx + 1) * sliceSize).toFixed(1);
    const color = STANDARD_CHART_COLORS[idx % STANDARD_CHART_COLORS.length];
    return `${color} ${start}% ${end}%`;
  }).join(", ");

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-4">
      <div
        className="relative w-44 h-44 rounded-full flex items-center justify-center shadow-md transition-all duration-300"
        style={{
          background: `conic-gradient(${conicStops})`
        }}
      >
        {isDonut && (
          <div className="w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Options</span>
            <span className="text-xl font-extrabold text-slate-800">{count}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 max-w-md">
        {options.map((opt, idx) => {
          const text = typeof opt === "string" ? opt : opt?.text || `Option ${idx + 1}`;
          return (
            <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              <span
                className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                style={{ background: STANDARD_CHART_COLORS[idx % STANDARD_CHART_COLORS.length] }}
              />
              <span className="truncate max-w-[120px]" title={text}>{text || `Option ${idx + 1}`}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WordCloudPreview() {
  const sampleWords = [
    { text: "Interactive", size: "text-4xl", color: "text-[#6366F1]" },
    { text: "Real-time", size: "text-3xl", color: "text-pink-500" },
    { text: "Engaging", size: "text-2xl", color: "text-emerald-500" },
    { text: "Live Poll", size: "text-3xl", color: "text-amber-500" },
    { text: "Feedback", size: "text-xl", color: "text-purple-500" },
    { text: "Audience", size: "text-2xl", color: "text-blue-500" },
    { text: "Dynamic", size: "text-lg", color: "text-teal-500" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 p-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
      {sampleWords.map((w, idx) => (
        <span key={idx} className={`font-extrabold ${w.size} ${w.color} animate-pulse`} style={{ animationDuration: `${2 + idx * 0.5}s` }}>
          {w.text}
        </span>
      ))}
    </div>
  );
}

function OpenEndedPreview() {
  const sampleResponses = [
    "Awesome presentation and smooth UI!",
    "Loved the live interaction and real-time chart updates.",
    "Very easy to customize themes and question types."
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      {sampleResponses.map((resp, idx) => (
        <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 shadow-xs">
          "{resp}"
        </div>
      ))}
    </div>
  );
}

function RankingPreview({ options }) {
  return (
    <div className="space-y-3 max-w-md mx-auto w-full">
      {options.map((opt, idx) => {
        const text = typeof opt === "string" ? opt : opt?.text || `Item ${idx + 1}`;
        return (
          <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-xs">
            <span className="text-sm font-semibold text-slate-800">{text}</span>
            <span className="w-6 h-6 rounded-full bg-[#6366F1]/10 text-[#6366F1] text-xs font-bold flex items-center justify-center">
              #{idx + 1}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function QuestionSlide({ question, index, isActive, onClick, onDelete, canDelete }) {
  const qType = question.type || "MultipleChoice";

  return (
    <div
      onClick={onClick}
      className={`group relative p-3 rounded-xl border-2 transition-all cursor-pointer bg-white shadow-xs ${
        isActive
          ? "border-[#6366F1] shadow-md ring-2 ring-[#6366F1]/10"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-400">
          Slide {index + 1}
        </span>
        {canDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded transition-all"
            title="Delete slide"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="h-16 bg-slate-50 border border-slate-100 rounded-lg p-2 flex flex-col justify-between">
        <p className="text-xs font-semibold text-slate-700 truncate">
          {question.text || "Untitled Question"}
        </p>
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <span className="uppercase">{qType}</span>
          <span>{qType === "WordCloud" || qType === "OpenEnded" ? "" : `${question.options?.length || 0} opts`}</span>
        </div>
      </div>
    </div>
  );
}

export default function StandardEdit({
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
  handleCreatePoll,
  router,
  themeDropdown,
  isCreateMode = false,
}) {
  const [activeRightTab, setActiveRightTab] = useState("content"); // 'content', 'theme', 'template'
  const [showNewSlideModal, setShowNewSlideModal] = useState(false);

  const activeQuestion = questions[activeQuestionIndex] || questions[0];

  const updateQuestionText = (text) => {
    const newQuestions = [...questions];
    newQuestions[activeQuestionIndex].text = text;
    setQuestions(newQuestions);
  };

  const updateQuestionType = (type) => {
    const newQuestions = [...questions];
    newQuestions[activeQuestionIndex].type = type;
    if (type === "WordCloud" || type === "OpenEnded") {
      newQuestions[activeQuestionIndex].options = [];
    } else if (!newQuestions[activeQuestionIndex].options?.length) {
      newQuestions[activeQuestionIndex].options = [
        { text: "", imageUrl: "" },
        { text: "", imageUrl: "" }
      ];
    }
    setQuestions(newQuestions);
  };

  const updateOptionText = (optionIndex, text) => {
    const newQuestions = [...questions];
    const opts = [...(newQuestions[activeQuestionIndex].options || [])];
    if (typeof opts[optionIndex] === "string") {
      opts[optionIndex] = { text, imageUrl: "" };
    } else {
      opts[optionIndex] = { ...opts[optionIndex], text };
    }
    newQuestions[activeQuestionIndex].options = opts;
    setQuestions(newQuestions);
  };

  const addOption = () => {
    const newQuestions = [...questions];
    const opts = [...(newQuestions[activeQuestionIndex].options || [])];
    opts.push({ text: "", imageUrl: "" });
    newQuestions[activeQuestionIndex].options = opts;
    setQuestions(newQuestions);
  };

  const removeOption = (optionIndex) => {
    const newQuestions = [...questions];
    const opts = [...(newQuestions[activeQuestionIndex].options || [])];
    opts.splice(optionIndex, 1);
    newQuestions[activeQuestionIndex].options = opts;
    setQuestions(newQuestions);
  };

  const addQuestionWithType = (type = "MultipleChoice") => {
    const newQuestions = [...questions];
    newQuestions.push({
      text: "",
      type: type,
      visualization: "Bars",
      imageUrl: "",
      options: type === "WordCloud" || type === "OpenEnded" ? [] : [{ text: "", imageUrl: "" }, { text: "", imageUrl: "" }],
    });
    setQuestions(newQuestions);
    setActiveQuestionIndex(newQuestions.length - 1);
    setShowNewSlideModal(false);
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) return;
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
    if (activeQuestionIndex >= newQuestions.length) {
      setActiveQuestionIndex(newQuestions.length - 1);
    }
  };

  const slideTypes = [
    { type: "MultipleChoice", label: "Multiple Choice", icon: BarChart2, description: "Standard single or multiple selection poll" },
    { type: "WordCloud", label: "Word Cloud", icon: Cloud, description: "Live word cloud visualization from audience" },
    { type: "OpenEnded", label: "Open Ended", icon: MessageSquare, description: "Freeform text responses from participants" },
    { type: "Ranking", label: "Ranking", icon: ListOrdered, description: "Rank options in order of preference" },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden font-sans">
      {/* ── Top Navigation Bar ── */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/home")}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            title="Back to Home"
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
                className="text-lg font-bold bg-slate-50 border border-slate-300 rounded px-3 py-1 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
              />
              <button
                onClick={() => setEditingTitle(false)}
                className="p-1.5 rounded bg-[#6366F1] text-white hover:bg-[#5558DD] transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingTitle?.(true)}
              className="text-lg font-bold text-slate-800 hover:text-[#6366F1] transition-colors"
            >
              {title || "Untitled Presentation"}
            </button>
          )}
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={isCreateMode ? () => handleCreatePoll?.("dashboard") : handleSavePoll}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-all text-sm shadow-xs disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
          
          <button
            onClick={isCreateMode ? () => handleCreatePoll?.("present") : handleSavePoll}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#6366F1] hover:bg-[#5558DD] text-white font-semibold transition-all text-sm shadow-sm disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            Start presentation
          </button>
        </div>
      </header>

      {/* ── Main Workspace ── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Slides Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col shrink-0 z-10">
          <button
            onClick={() => setShowNewSlideModal(true)}
            className="w-full bg-[#1E293B] hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-full flex items-center justify-center gap-2 text-sm shadow-sm transition-colors mb-4 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New slide
          </button>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
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
          </div>

          <button
            onClick={() => setShowNewSlideModal(true)}
            className="w-full mt-3 py-2 border border-slate-200 rounded-xl text-slate-600 font-medium text-xs hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New slide
          </button>
        </aside>

        {/* Center Preview Canvas */}
        <main className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center overflow-auto bg-slate-100">
          <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-lg p-8 md:p-12 min-h-[460px] flex flex-col justify-between relative transition-all">
            <div className="w-full mb-8 text-center">
              <input
                type="text"
                value={activeQuestion?.text || ""}
                onChange={(e) => updateQuestionText(e.target.value)}
                placeholder="Type your question here..."
                className="w-full text-2xl md:text-3xl font-bold text-center bg-transparent border-b border-transparent hover:border-slate-200 focus:border-[#6366F1] focus:outline-none py-2 text-slate-800 transition-colors"
              />
            </div>

            {/* Slide Preview Content */}
            <div className="flex-1 flex flex-col justify-center my-auto">
              {activeQuestion?.type === "WordCloud" ? (
                <WordCloudPreview />
              ) : activeQuestion?.type === "OpenEnded" ? (
                <OpenEndedPreview />
              ) : activeQuestion?.type === "Ranking" && activeQuestion?.visualization === "Bars" ? (
                <VerticalBarChart options={activeQuestion?.options || []} />
              ) : activeQuestion?.type === "Ranking" ? (
                <RankingPreview options={activeQuestion?.options || []} />
              ) : activeQuestion?.visualization === "Donut" ? (
                <DonutPieChart options={activeQuestion?.options || []} isDonut={true} />
              ) : activeQuestion?.visualization === "Pie" ? (
                <DonutPieChart options={activeQuestion?.options || []} isDonut={false} />
              ) : (
                <VerticalBarChart options={activeQuestion?.options || []} />
              )}
            </div>
          </div>
        </main>

        {/* Right Drawer Panel (Opens when an icon in far right strip is clicked) */}
        {activeRightTab && (
          <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 z-10 animate-fade-in relative">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                {activeRightTab === "content" && "Question Settings"}
                {activeRightTab === "theme" && "Themes & Styling"}
                {activeRightTab === "template" && "Templates"}
              </h2>
              <button
                onClick={() => setActiveRightTab(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* CONTENT DRAWER */}
              {activeRightTab === "content" && (
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                      Question Type
                    </label>
                    <select
                      value={activeQuestion?.type || "MultipleChoice"}
                      onChange={(e) => updateQuestionType(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1] outline-none"
                    >
                      {slideTypes.map((st) => (
                        <option key={st.type} value={st.type}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                      Question Title
                    </label>
                    <input
                      type="text"
                      value={activeQuestion?.text || ""}
                      onChange={(e) => updateQuestionText(e.target.value)}
                      placeholder="Enter question text..."
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 focus:ring-2 focus:ring-[#6366F1]/20 outline-none"
                    />
                  </div>

                  {/* Question Image URL */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                      Question Image URL (Optional)
                    </label>
                    <input
                      type="text"
                      value={activeQuestion?.imageUrl || ""}
                      onChange={(e) => {
                        const newQuestions = [...questions];
                        newQuestions[activeQuestionIndex].imageUrl = e.target.value;
                        setQuestions(newQuestions);
                      }}
                      placeholder="https://example.com/image.png"
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-[#6366F1]/20 outline-none"
                    />
                  </div>

                  {/* Visualization Type Selection */}
                  {(activeQuestion?.type === "MultipleChoice" || activeQuestion?.type === "Ranking") && (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                        Visualization Type
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {activeQuestion?.type === "Ranking" ? (
                          [
                            { id: "List", label: "Ranked List" },
                            { id: "Bars", label: "Bar Chart" },
                          ].map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => {
                                const newQuestions = [...questions];
                                newQuestions[activeQuestionIndex].visualization = v.id;
                                setQuestions(newQuestions);
                              }}
                              className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                                (activeQuestion?.visualization || "List") === v.id
                                  ? "bg-[#6366F1] text-white border-[#6366F1]"
                                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              {v.label}
                            </button>
                          ))
                        ) : (
                          [
                            { id: "Bars", label: "Bars" },
                            { id: "Donut", label: "Donut" },
                            { id: "Pie", label: "Pie" }
                          ].map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => {
                                const newQuestions = [...questions];
                                newQuestions[activeQuestionIndex].visualization = v.id;
                                setQuestions(newQuestions);
                              }}
                              className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                                (activeQuestion?.visualization || "Bars") === v.id
                                  ? "bg-[#6366F1] text-white border-[#6366F1]"
                                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              {v.label}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Options List for MultipleChoice and Ranking */}
                  {(activeQuestion?.type === "MultipleChoice" || activeQuestion?.type === "Ranking") && (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                        {activeQuestion?.type === "Ranking" ? "Items to Rank" : "Options & Image URLs"}
                      </label>
                      <div className="space-y-3">
                        {(activeQuestion?.options || []).map((opt, optIdx) => {
                          const val = typeof opt === "string" ? opt : opt?.text || "";
                          const imgVal = typeof opt === "object" ? opt?.imageUrl || "" : "";
                          return (
                            <div key={optIdx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) => updateOptionText(optIdx, e.target.value)}
                                  placeholder={activeQuestion?.type === "Ranking" ? `Item ${optIdx + 1}` : `Option ${optIdx + 1}`}
                                  className="flex-1 p-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-[#6366F1]/20 outline-none"
                                />
                                {activeQuestion.options.length > 2 && (
                                  <button
                                    onClick={() => removeOption(optIdx)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-white"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              <input
                                type="text"
                                value={imgVal}
                                onChange={(e) => {
                                  const newQuestions = [...questions];
                                  const opts = [...(newQuestions[activeQuestionIndex].options || [])];
                                  if (typeof opts[optIdx] === "string") {
                                    opts[optIdx] = { text: opts[optIdx], imageUrl: e.target.value };
                                  } else {
                                    opts[optIdx] = { ...opts[optIdx], imageUrl: e.target.value };
                                  }
                                  newQuestions[activeQuestionIndex].options = opts;
                                  setQuestions(newQuestions);
                                }}
                                placeholder="Item image URL (Optional)"
                                className="w-full p-2 rounded-lg border border-slate-200 text-[11px] text-slate-600 bg-white focus:ring-2 focus:ring-[#6366F1]/20 outline-none"
                              />
                            </div>
                          );
                        })}
                      </div>
                      <button
                        onClick={addOption}
                        className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#6366F1] hover:underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add {activeQuestion?.type === "Ranking" ? "item" : "option"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* THEME DRAWER */}
              {activeRightTab === "theme" && (
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                      Default & Custom Themes
                    </label>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      {themeDropdown}
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE DRAWER */}
              {activeRightTab === "template" && (
                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Presentation Templates
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { title: "Team Icebreaker", category: "Icebreaker" },
                      { title: "Product Feedback Poll", category: "Survey" },
                      { title: "General Knowledge Quiz", category: "Quiz" },
                    ].map((t, idx) => (
                      <div
                        key={idx}
                        onClick={() => toast.success(`Template '${t.title}' loaded!`)}
                        className="p-3 rounded-xl border border-slate-200 hover:border-[#6366F1] bg-white cursor-pointer transition-all shadow-xs"
                      >
                        <p className="font-bold text-sm text-slate-800">{t.title}</p>
                        <p className="text-xs text-slate-400">{t.category}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Far Right Vertical Icon Strip */}
        <aside className="w-16 bg-white border-l border-slate-200 flex flex-col items-center py-4 space-y-4 shrink-0 z-20">
          {/* AI Sparkles Placeholder */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 flex items-center justify-center shadow-xs cursor-pointer">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-500" />
            </div>
          </div>

          <div className="w-10 h-[1px] bg-slate-200 my-1" />

          {/* Content (Edit) Icon */}
          <button
            onClick={() => setActiveRightTab(activeRightTab === "content" ? null : "content")}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              activeRightTab === "content"
                ? "bg-indigo-100/80 text-[#6366F1]"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            title="Edit Content"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Theme Icon */}
          <button
            onClick={() => setActiveRightTab(activeRightTab === "theme" ? null : "theme")}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              activeRightTab === "theme"
                ? "bg-indigo-100/80 text-[#6366F1]"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            title="Themes"
          >
            <Palette className="w-5 h-5" />
          </button>

          {/* Templates Icon */}
          <button
            onClick={() => setActiveRightTab(activeRightTab === "template" ? null : "template")}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              activeRightTab === "template"
                ? "bg-indigo-100/80 text-[#6366F1]"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            title="Templates"
          >
            <LayoutTemplate className="w-5 h-5" />
          </button>
        </aside>
      </div>

      {/* ── New Slide Types Selection Modal ── */}
      {showNewSlideModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-fade-in relative">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">Interactive questions</h3>
              <button
                onClick={() => setShowNewSlideModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 my-4">
              {slideTypes.map((st) => {
                const IconComponent = st.icon;
                return (
                  <div
                    key={st.type}
                    onClick={() => addQuestionWithType(st.type)}
                    className="p-4 rounded-xl border border-slate-200 hover:border-[#6366F1] hover:bg-indigo-50/40 transition-all cursor-pointer flex items-center gap-3"
                  >
                    <div className="p-2.5 rounded-lg bg-[#6366F1]/10 text-[#6366F1]">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{st.label}</h4>
                      <p className="text-[11px] text-slate-400">{st.type}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
