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
  AlignCenter,
  AlignRight,
  Settings,
  Palette,
  LayoutTemplate,
  BarChart2,
  Cloud,
  MessageSquare,
  ListOrdered,
  Image as ImageIcon,
  Play,
  HelpCircle,
  ArrowUpDown,
  Music,
  ChevronDown
} from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { usePollStore } from "@/lib/store/usePollStore";
import { getThemeStyles } from "@/lib/themeHelper";
import toast from "react-hot-toast";

const DEFAULT_PALETTE = ["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6"];

function VerticalBarChart({ options, showPercentage = false, paletteColors = DEFAULT_PALETTE }) {
  const colors = paletteColors?.length ? paletteColors : DEFAULT_PALETTE;
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
    <div className="w-full flex-1 flex flex-col justify-end my-auto py-2">
      {/* Bars Container with Baseline Horizontal Line */}
      <div className="flex items-end justify-center gap-4 md:gap-8 w-full mx-auto border-b-2 border-slate-300 pb-0">
        {options.map((option, idx) => {
          const votes = sampleVotes[idx] || 0;
          const percentage = Math.round((votes / totalVotes) * 100);
          const height = (votes / maxVotes) * 100;
          const barBg = colors[idx % colors.length];

          return (
            <div key={idx} className="flex flex-col items-center flex-1 max-w-[120px] md:max-w-[140px] h-52 justify-end">
              <div className="w-full flex flex-col items-center justify-end" style={{ height: `${Math.max(height, 14)}%` }}>
                <div className="font-extrabold text-xs md:text-sm mb-1.5 drop-shadow-xs text-center" style={{ color: colors[0] }}>
                  {showPercentage ? `${percentage}%` : `${votes} votes`}
                </div>
                <div
                  className="w-full rounded-t-xl rounded-b-none border-t-2 border-x-2 border-white/60 flex-1 transition-all duration-700 ease-out"
                  style={{ background: barBg, boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Option Labels Below Baseline */}
      <div className="flex justify-center gap-4 md:gap-8 w-full mx-auto mt-3">
        {options.map((option, idx) => {
          const optionText = typeof option === "string" ? option : (option?.text || "");
          return (
            <div key={idx} className="flex-1 max-w-[120px] md:max-w-[140px] text-center">
              <div className="font-bold text-xs md:text-sm whitespace-normal break-words w-full leading-snug text-slate-800" title={optionText}>
                {optionText || `Option ${idx + 1}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DonutPieChart({ options, isDonut = true, paletteColors = DEFAULT_PALETTE }) {
  const colors = paletteColors?.length ? paletteColors : DEFAULT_PALETTE;
  const count = options?.length || 1;
  const sliceSize = 100 / count;

  const conicStops = options.map((_, idx) => {
    const start = (idx * sliceSize).toFixed(1);
    const end = ((idx + 1) * sliceSize).toFixed(1);
    const color = colors[idx % colors.length];
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
                style={{ background: colors[idx % colors.length] }}
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
      className={`group relative p-2.5 rounded-xl border-2 transition-all cursor-pointer bg-white shadow-xs ${
        isActive
          ? "border-[#6366F1] shadow-md ring-2 ring-[#6366F1]/10"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      {canDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 rounded transition-all z-10 cursor-pointer bg-white/90 shadow-xs"
          title="Delete slide"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      <div className="h-20 bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex flex-col justify-between">
        <div className="flex items-start gap-1.5 min-w-0 pr-4">
          <span className="text-xs font-bold text-slate-500 shrink-0">{index + 1}.</span>
          <p className="text-xs font-semibold text-slate-700 truncate flex-1 min-w-0">
            {question.text || "Untitled Question"}
          </p>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-100">
          <span className="uppercase">{qType}</span>
          {qType !== "WordCloud" && qType !== "OpenEnded" && (
            <span>{question.options?.length || 0} opts</span>
          )}
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
  selectedThemeId,
  isCreateMode = false,
}) {
  const { user } = useAuth();
  const { themes } = usePollStore();
  const [activeRightTab, setActiveRightTab] = useState("content"); // 'content', 'theme', 'template'
  const [showNewSlideModal, setShowNewSlideModal] = useState(false);
  const [showQuestionImageInput, setShowQuestionImageInput] = useState(false);
  const [activeOptionImageInputs, setActiveOptionImageInputs] = useState({});
  const [pendingTemplate, setPendingTemplate] = useState(null);

  const activeTheme = themes.find((t) => t.id === selectedThemeId) || themes[0];
  const themeStyles = getThemeStyles(activeTheme);

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

            <button
              type="button"
              onClick={() => setShowNewSlideModal(true)}
              className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 font-semibold text-xs hover:border-indigo-400 hover:text-indigo-600 hover:bg-slate-50/50 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New slide
            </button>
          </div>
        </aside>

        {/* Center Preview Canvas */}
        <main className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center overflow-auto bg-slate-100/90">
          <div
            className="w-full max-w-4xl rounded-[24px] border-[3.5px] border-slate-900/90 shadow-2xl p-8 md:p-12 min-h-[480px] flex flex-col justify-between relative transition-all overflow-hidden"
            style={{
              ...themeStyles.backgroundStyle,
              backgroundColor: themeStyles.cardBackgroundColor || themeStyles.backgroundStyle?.backgroundColor || "#0F172A",
              color: themeStyles.primaryTextColor || "#FFFFFF",
              fontFamily: themeStyles.containerStyle?.fontFamily
            }}
          >
            <div className="w-full mb-6 text-left">
              <div
                className="border focus-within:border-[#6366F1] focus-within:ring-2 focus-within:ring-[#6366F1]/20 rounded-xl p-3 shadow-xs transition-all w-full"
                style={{
                  backgroundColor:
                    themeStyles.primaryTextColor === "#FFFFFF" ||
                    themeStyles.cardBackgroundColor === "#0F172A" ||
                    themeStyles.cardBackgroundColor === "#18181B"
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(241, 245, 249, 0.8)",
                  borderColor:
                    themeStyles.primaryTextColor === "#FFFFFF" ||
                    themeStyles.cardBackgroundColor === "#0F172A" ||
                    themeStyles.cardBackgroundColor === "#18181B"
                      ? "rgba(255, 255, 255, 0.15)"
                      : "rgba(226, 232, 240, 0.9)",
                }}
              >
                <input
                  type="text"
                  value={activeQuestion?.text || ""}
                  onChange={(e) => updateQuestionText(e.target.value)}
                  placeholder="Type your question here..."
                  className={`w-full text-xl md:text-2xl font-bold bg-transparent focus:outline-none placeholder:text-slate-400 ${
                    activeQuestion?.alignment === "left"
                      ? "text-left"
                      : activeQuestion?.alignment === "right"
                      ? "text-right"
                      : "text-center"
                  }`}
                  style={{ color: themeStyles.primaryTextColor || "#000000" }}
                />
              </div>
            </div>

            {/* Slide Preview Content */}
            <div className="flex-1 flex flex-col justify-center my-auto">
              {activeQuestion?.type === "WordCloud" ? (
                <WordCloudPreview />
              ) : activeQuestion?.type === "OpenEnded" ? (
                <OpenEndedPreview />
              ) : activeQuestion?.type === "Ranking" && activeQuestion?.visualization === "Bars" ? (
                <VerticalBarChart options={activeQuestion?.options || []} showPercentage={activeQuestion?.showPercentage} paletteColors={themeStyles.paletteColors} />
              ) : activeQuestion?.type === "Ranking" ? (
                <RankingPreview options={activeQuestion?.options || []} paletteColors={themeStyles.paletteColors} />
              ) : activeQuestion?.visualization === "Donut" ? (
                <DonutPieChart options={activeQuestion?.options || []} isDonut={true} paletteColors={themeStyles.paletteColors} />
              ) : activeQuestion?.visualization === "Pie" ? (
                <DonutPieChart options={activeQuestion?.options || []} isDonut={false} paletteColors={themeStyles.paletteColors} />
              ) : (
                <VerticalBarChart options={activeQuestion?.options || []} showPercentage={activeQuestion?.showPercentage} paletteColors={themeStyles.paletteColors} />
              )}
            </div>
          </div>
        </main>

        {/* Right Drawer Panel (Opens when an icon in far right strip is clicked) */}
        {activeRightTab && (
          <aside className="w-80 my-3 mr-2 bg-white border border-slate-200/90 rounded-2xl shadow-xl flex flex-col shrink-0 z-20 animate-fade-in relative max-h-[calc(100vh-6.5rem)] overflow-hidden">
            <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
              {activeRightTab === "content" ? (
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[#6366F1]" />
                  <div className="relative flex items-center">
                    <select
                      value={activeQuestion?.type || "MultipleChoice"}
                      onChange={(e) => updateQuestionType(e.target.value)}
                      className="appearance-none bg-transparent font-bold text-slate-800 text-base pr-6 focus:outline-none cursor-pointer"
                    >
                      {slideTypes.map((st) => (
                        <option key={st.type} value={st.type}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-0 pointer-events-none" />
                  </div>
                </div>
              ) : (
                <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                  {activeRightTab === "theme" && "Themes & Styling"}
                  {activeRightTab === "template" && "Templates"}
                </h2>
              )}
              <button
                onClick={() => setActiveRightTab(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* CONTENT DRAWER */}
              {activeRightTab === "content" && (
                <div className="space-y-5">
                  {/* Your Question Section */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        Your question <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                      </label>
                    </div>

                    {/* Question Input Card Box */}
                    <div className="border border-slate-200/90 rounded-xl bg-white p-3 space-y-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-2xs">
                      <div className="relative flex items-start justify-between gap-2">
                        <textarea
                          rows={2}
                          value={activeQuestion?.text || ""}
                          onChange={(e) => updateQuestionText(e.target.value)}
                          placeholder="Your poll question..."
                          className="w-full text-sm font-medium text-slate-800 focus:outline-none resize-none placeholder:text-slate-350"
                        />
                        <span className="text-[11px] font-semibold text-slate-400 select-none shrink-0">
                          {300 - (activeQuestion?.text?.length || 0)}
                        </span>
                      </div>

                      {/* Toolbar Row Inside Box */}
                      <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            const currentAlg = activeQuestion?.alignment || "center";
                            const nextAlg = currentAlg === "left" ? "center" : currentAlg === "center" ? "right" : "left";
                            const newQuestions = [...questions];
                            newQuestions[activeQuestionIndex].alignment = nextAlg;
                            setQuestions(newQuestions);
                          }}
                          className="p-1 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                          title={`Alignment: ${activeQuestion?.alignment || "center"} (Click to cycle)`}
                        >
                          {activeQuestion?.alignment === "left" && <AlignLeft className="w-4 h-4 text-indigo-600" />}
                          {activeQuestion?.alignment === "right" && <AlignRight className="w-4 h-4 text-indigo-600" />}
                          {(!activeQuestion?.alignment || activeQuestion?.alignment === "center") && <AlignCenter className="w-4 h-4 text-indigo-600" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowQuestionImageInput(!showQuestionImageInput)}
                          className={`p-1 transition-colors cursor-pointer ${
                            showQuestionImageInput || activeQuestion?.imageUrl
                              ? "text-indigo-600"
                              : "text-slate-400 hover:text-slate-600"
                          }`}
                          title="Add question image"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                          title="Audio / Music"
                        >
                          <Music className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Question Image URL Input */}
                      {(showQuestionImageInput || activeQuestion?.imageUrl) && (
                        <div className="pt-2 border-t border-slate-100">
                          <input
                            type="text"
                            value={activeQuestion?.imageUrl || ""}
                            onChange={(e) => {
                              const newQuestions = [...questions];
                              newQuestions[activeQuestionIndex].imageUrl = e.target.value;
                              setQuestions(newQuestions);
                            }}
                            placeholder="Question image URL..."
                            className="w-full p-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-indigo-600 hover:underline cursor-pointer block"
                    >
                      Add a longer description
                    </button>
                  </div>

                  {/* Options List for MultipleChoice and Ranking */}
                  {(activeQuestion?.type === "MultipleChoice" || activeQuestion?.type === "Ranking") && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          Options <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                        </label>
                      </div>

                      <div className="space-y-2">
                        {(activeQuestion?.options || []).map((opt, optIdx) => {
                          const val = typeof opt === "string" ? opt : opt?.text || "";
                          const imgVal = typeof opt === "object" ? opt?.imageUrl || "" : "";
                          const isImageActive = activeOptionImageInputs[optIdx] || Boolean(imgVal);

                          return (
                            <div key={optIdx} className="space-y-1.5">
                              {/* Option Input Row */}
                              <div className="flex items-center w-full">
                                {/* Main Option Text Input */}
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) => updateOptionText(optIdx, e.target.value)}
                                  placeholder={activeQuestion?.type === "Ranking" ? `${optIdx + 1}` : `${optIdx + 1}`}
                                  className="flex-1 min-w-0 h-10 px-3 border border-slate-200/90 rounded-l-md text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 border-r-0"
                                />

                                {/* Image Toggle Button */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveOptionImageInputs((prev) => ({
                                      ...prev,
                                      [optIdx]: !prev[optIdx],
                                    }))
                                  }
                                  className={`w-9 h-10 border border-slate-200/90 rounded-r-md flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                                    isImageActive ? "bg-indigo-50 text-indigo-600" : "bg-slate-50/80 text-slate-500 hover:bg-slate-100"
                                  }`}
                                  title="Add option image"
                                >
                                  <ImageIcon className="w-4 h-4" />
                                </button>

                                {/* Separate Delete Button */}
                                {activeQuestion.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => removeOption(optIdx)}
                                    className="w-9 h-10 border border-slate-200/90 bg-slate-50/80 rounded-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50/50 transition-colors shrink-0 cursor-pointer ml-1.5"
                                    title="Delete option"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>

                              {/* Expandable Option Image URL Field */}
                              {isImageActive && (
                                <div className="pl-9 pr-10">
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
                                    placeholder="Option image URL..."
                                    className="w-full p-2 rounded-md border border-slate-200 text-[11px] text-slate-600 bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Full-width + Add Button */}
                      <button
                        type="button"
                        onClick={addOption}
                        className="w-full mt-3 py-2.5 border border-slate-200/90 rounded-xl text-slate-800 font-bold text-xs hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-4 h-4" /> Add
                      </button>
                    </div>
                  )}

                  {/* ── Line Below Options ── */}
                  <div className="pt-4 border-t border-slate-200 space-y-5">
                    {/* Visualization Type Selection */}
                    {(activeQuestion?.type === "MultipleChoice" || activeQuestion?.type === "Ranking") && (
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-2">
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
                                className={`py-2 px-3 rounded-md text-xs font-semibold border transition-all ${
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
                                className={`py-2 px-3 rounded-md text-xs font-semibold border transition-all ${
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

                    {/* Question & Participant Settings Toggles */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                        Question & Participant Settings
                      </label>

                      {/* 1. Show percentage toggle */}
                      {(activeQuestion?.type === "MultipleChoice" || activeQuestion?.type === "Ranking") && (
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700 hover:text-slate-900 select-none">
                          <input
                            type="checkbox"
                            checked={activeQuestion?.showPercentage || false}
                            onChange={(e) => {
                              const newQuestions = [...questions];
                              newQuestions[activeQuestionIndex].showPercentage = e.target.checked;
                              setQuestions(newQuestions);
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-[#6366F1] focus:ring-[#6366F1]"
                          />
                          <span>Show results in percentage (%)</span>
                        </label>
                      )}

                      {/* 2. Show response count toggle */}
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700 hover:text-slate-900 select-none">
                        <input
                          type="checkbox"
                          checked={activeQuestion?.showResponseCount !== false}
                          onChange={(e) => {
                            const newQuestions = [...questions];
                            newQuestions[activeQuestionIndex].showResponseCount = e.target.checked;
                            setQuestions(newQuestions);
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-[#6366F1] focus:ring-[#6366F1]"
                        />
                        <span>Show audience response count badge</span>
                      </label>

                      {/* 3. Participant live reactions toggle (matching clean style) */}
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700 hover:text-slate-900 select-none">
                        <input
                          type="checkbox"
                          checked={activeQuestion?.allowReactions !== false}
                          onChange={(e) => {
                            const newQuestions = [...questions];
                            newQuestions[activeQuestionIndex].allowReactions = e.target.checked;
                            setQuestions(newQuestions);
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-[#6366F1] focus:ring-[#6366F1]"
                        />
                        <span>Allow live emoji reactions (❤️ 🔥 👏)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* THEME DRAWER */}
              {activeRightTab === "theme" && (
                <div>
                  {themeDropdown}
                </div>
              )}

              {/* TEMPLATE DRAWER */}
              {activeRightTab === "template" && (
                <TemplateDrawerSection
                  user={user}
                  onApplyTemplate={(template) => {
                    const hasUserEdits = questions?.some(
                      (q) =>
                        (q.text || "").trim() !== "" ||
                        q.options?.some((o) => (typeof o === "string" ? o.trim() : (o.text || "").trim()) !== "")
                    );

                    if (hasUserEdits) {
                      setPendingTemplate(template);
                    } else {
                      executeApplyTemplate(template);
                    }
                  }}
                  router={router}
                />
              )}
            </div>
          </aside>
        )}

        {/* Far Right Vertical Icon Strip */}
        <aside className="my-3 mr-3 bg-white border border-slate-200/90 rounded-2xl shadow-lg flex flex-col items-center py-3 px-2 space-y-2 shrink-0 z-20 self-start">
          {/* AI Sparkles Placeholder */}
          <div className="w-10 h-10 rounded-md bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 flex items-center justify-center shadow-xs cursor-pointer">
            <div className="w-full h-full bg-white rounded-md flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-500" />
            </div>
          </div>

          <div className="w-8 h-[1px] bg-slate-200 my-0.5" />

          {/* Content (Edit) Icon */}
          <button
            onClick={() => setActiveRightTab(activeRightTab === "content" ? null : "content")}
            className={`w-10 h-10 rounded-md flex items-center justify-center transition-all cursor-pointer ${
              activeRightTab === "content"
                ? "bg-indigo-100/90 text-[#6366F1]"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            title="Edit Content"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Theme Icon */}
          <button
            onClick={() => setActiveRightTab(activeRightTab === "theme" ? null : "theme")}
            className={`w-10 h-10 rounded-md flex items-center justify-center transition-all cursor-pointer ${
              activeRightTab === "theme"
                ? "bg-indigo-100/90 text-[#6366F1]"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            title="Themes"
          >
            <Palette className="w-5 h-5" />
          </button>

          {/* Templates Icon */}
          <button
            onClick={() => setActiveRightTab(activeRightTab === "template" ? null : "template")}
            className={`w-10 h-10 rounded-md flex items-center justify-center transition-all cursor-pointer ${
              activeRightTab === "template"
                ? "bg-indigo-100/90 text-[#6366F1]"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            title="Templates"
          >
            <LayoutTemplate className="w-5 h-5" />
          </button>
        </aside>
      </div>

      {/* ── Template Confirmation Modal ── */}
      {pendingTemplate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-1">Apply Template?</h3>
            <p className="text-sm text-slate-600 mb-6">
              You have unsaved changes in your presentation. Would you like to save your current work before applying <strong>"{pendingTemplate.title}"</strong>, or discard current changes?
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={async () => {
                  let isSuccess = false;
                  try {
                    if (isCreateMode && handleCreatePoll) {
                      isSuccess = await handleCreatePoll("dashboard", true);
                    } else if (handleSavePoll) {
                      isSuccess = await handleSavePoll(true);
                    }
                  } catch (err) {
                    console.error("Save error:", err);
                    isSuccess = false;
                  }

                  // If saving failed or validation failed (e.g. no title, empty questions, < 2 options), DO NOT load template!
                  if (!isSuccess) {
                    return;
                  }

                  await executeApplyTemplate(pendingTemplate);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#6366F1] hover:bg-[#5558DD] text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save & Apply Template
              </button>

              <button
                type="button"
                onClick={async () => {
                  await executeApplyTemplate(pendingTemplate);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer border border-red-200"
              >
                <Trash2 className="w-4 h-4" /> Discard Changes & Apply
              </button>

              <button
                type="button"
                onClick={() => setPendingTemplate(null)}
                className="w-full py-2 text-slate-500 hover:text-slate-700 font-semibold text-xs transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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

function TemplateDrawerSection({ user, onApplyTemplate, router }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingId, setUsingId] = useState(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await api.getTemplates(user?.uid);
        setTemplates(data || []);
      } catch (err) {
        console.error("Error fetching templates:", err);
        // Fallback default templates
        setTemplates([
          {
            id: "template_icebreaker_pulse",
            title: "Team Icebreaker",
            category: "Icebreaker",
            questions: [
              { text: "How are you feeling today?", type: "MultipleChoice", options: [{ text: "⚡ Energized & Ready" }, { text: "☕ Need Coffee First" }, { text: "😌 Calm & Focused" }] },
              { text: "Describe this week in one word:", type: "WordCloud", options: [] }
            ]
          },
          {
            id: "template_all_hands_qa",
            title: "All-Hands Q&A & Feedback",
            category: "Meeting",
            questions: [
              { text: "What topic should leadership address today?", type: "OpenEnded", options: [] },
              { text: "Rank our upcoming product roadmap focus:", type: "Ranking", options: [{ text: "Performance & Speed" }, { text: "UI/UX Redesign" }, { text: "Mobile App" }] }
            ]
          },
          {
            id: "template_customer_feedback",
            title: "Customer Product Survey",
            category: "Feedback",
            questions: [
              { text: "Overall, how satisfied are you with our product?", type: "MultipleChoice", visualization: "Donut", options: [{ text: "😍 Extremely Satisfied" }, { text: "🙂 Satisfied" }, { text: "😐 Neutral" }] }
            ]
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [user]);

  const executeApplyTemplate = async (template) => {
    if (!template) return;
    const toastId = toast.loading(`Loading '${template.title}' template...`);
    try {
      let questionsToApply = template.questions || [];
      if (user?.uid) {
        const createdPoll = await api.useTemplate(
          template.id,
          user.uid,
          user.email || "user@livepoll.com",
          user.displayName || "User"
        );
        if (createdPoll?.questions?.length > 0) {
          questionsToApply = createdPoll.questions;
        }
      }

      const cleanedQuestions = questionsToApply.map((q) => {
        const typeStr = String(q.type || "").toLowerCase();
        let qType = "MultipleChoice";
        if (q.type === 1 || q.type === "1" || typeStr === "wordcloud") qType = "WordCloud";
        else if (q.type === 2 || q.type === "2" || typeStr === "openended") qType = "OpenEnded";
        else if (q.type === 3 || q.type === "3" || typeStr === "ranking") qType = "Ranking";

        return {
          text: q.text || "",
          type: qType,
          visualization: q.visualization || "Bars",
          imageUrl: q.imageUrl || "",
          options: q.options?.map((o) => (typeof o === "string" ? { text: o, imageUrl: "" } : { text: o.text || "", imageUrl: o.imageUrl || "" })) || [],
        };
      });

      toast.dismiss(toastId);
      toast.success(`Template '${template.title}' applied!`);
      setQuestions(cleanedQuestions);
      if (setTitle && template.title) {
        setTitle(template.title);
      }
      setActiveQuestionIndex(0);
    } catch (err) {
      console.error("Error using template endpoint:", err);
      toast.dismiss(toastId);
      const fallbackQuestions = (template.questions || []).map((q) => ({
        text: q.text || "",
        type: q.type || "MultipleChoice",
        visualization: q.visualization || "Bars",
        imageUrl: "",
        options: q.options?.map((o) => (typeof o === "string" ? { text: o, imageUrl: "" } : { text: o.text || "", imageUrl: "" })) || [],
      }));
      toast.success(`Template '${template.title}' applied!`);
      setQuestions(fallbackQuestions);
      if (setTitle && template.title) {
        setTitle(template.title);
      }
      setActiveQuestionIndex(0);
    } finally {
      setPendingTemplate(null);
    }
  };

  return (
    <div className="space-y-4">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
        Presentation Templates
      </label>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading templates...
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 w-full">
          {templates.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-xs hover:border-indigo-400 hover:shadow-md transition-all flex flex-col group relative"
            >
              {/* Top Thumbnail / Preview Area */}
              <div className="h-24 bg-indigo-50/80 p-2 flex flex-col justify-between relative overflow-hidden">
                {t.thumbnailUrl ? (
                  <img
                    src={t.thumbnailUrl}
                    alt={t.title}
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-between gap-1 p-0.5">
                    {/* Sample Question Text */}
                    <div className="flex-1 min-w-0 pr-1">
                      <p className="text-[10px] font-semibold text-slate-800 line-clamp-2 leading-tight">
                        {t.questions?.[0]?.text || "Sales quiz"}
                      </p>
                    </div>

                    {/* Sample Mini Vertical Bar Chart */}
                    <div className="w-12 h-full flex items-end justify-end gap-1 shrink-0 pt-1">
                      <div className="flex flex-col items-center flex-1 h-full justify-end">
                        <div className="w-full bg-indigo-600 rounded-t-xs h-8" />
                      </div>
                      <div className="flex flex-col items-center flex-1 h-full justify-end">
                        <div className="w-full bg-indigo-400 rounded-t-xs h-14" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Get Button in Top Right Corner */}
                <button
                  type="button"
                  onClick={() => onApplyTemplate(t)}
                  className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-[#6366F1] hover:bg-[#5558DD] text-white font-bold text-[10px] shadow-sm transition-all flex items-center gap-1 cursor-pointer z-10"
                >
                  <Sparkles className="w-3 h-3" /> Get
                </button>
              </div>

              {/* Bottom Info Section below Thumbnail */}
              <div className="p-2.5 bg-white">
                <h5 className="font-bold text-xs text-slate-800 truncate" title={t.title}>
                  {t.title}
                </h5>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {t.questions?.length || 2} slides
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
