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
  ChevronDown,
  Zap,
  Upload,
  AlertTriangle,
  Layout,
  LayoutGrid,
  Pencil
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { usePollStore } from "@/lib/store/usePollStore";
import { getThemeStyles } from "@/lib/themeHelper";
import toast from "react-hot-toast";
import RightToolbar from "@/components/Themes/RightToolbar";
import MediaUploadModal from "@/components/MediaUploadModal";

const DEFAULT_PALETTE = ["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6"];

const SLIDE_TYPE_CONFIG = {
  MultipleChoice: { label: "Multiple Choice", icon: BarChart2, color: "text-indigo-600", bg: "bg-indigo-50" },
  WordCloud: { label: "Word Cloud", icon: Cloud, color: "text-emerald-600", bg: "bg-emerald-50" },
  OpenEnded: { label: "Open Ended", icon: MessageSquare, color: "text-amber-600", bg: "bg-amber-50" },
  Ranking: { label: "Ranking", icon: ListOrdered, color: "text-violet-600", bg: "bg-violet-50" },
};

export const normalizeQuestionType = (type) => {
  if (type === 1 || type === "1" || String(type).toLowerCase() === "wordcloud") return "WordCloud";
  if (type === 2 || type === "2" || String(type).toLowerCase() === "openended") return "OpenEnded";
  if (type === 3 || type === "3" || String(type).toLowerCase() === "ranking") return "Ranking";
  return "MultipleChoice";
};

function VerticalBarChart({ options, showPercentage = false, paletteColors = DEFAULT_PALETTE, textColor = null, fontFamily = null }) {
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
      {/* Bars Container with Baseline Horizontal Line (Binds dynamically to textColor) */}
      <div
        className="flex items-end justify-center gap-4 md:gap-8 w-full mx-auto border-b-2 pb-0"
        style={{ borderColor: textColor ? `${textColor}40` : "rgba(255, 255, 255, 0.4)" }}
      >
        {options.map((option, idx) => {
          const votes = sampleVotes[idx] || 0;
          const percentage = Math.round((votes / totalVotes) * 100);
          const height = (votes / maxVotes) * 100;
          const barBg = colors[idx % colors.length];

          return (
            <div key={idx} className="flex flex-col items-center flex-1 max-w-[120px] md:max-w-[140px] h-52 justify-end">
              <div className="w-full flex flex-col items-center justify-end" style={{ height: `${Math.max(height, 14)}%` }}>
                <div
                  className="font-extrabold text-xs md:text-sm mb-1.5 text-center drop-shadow-md"
                  style={{ color: textColor || "#FFFFFF", fontFamily: fontFamily || "inherit" }}
                >
                  {showPercentage ? `${percentage}%` : `${votes} votes`}
                </div>
                <div
                  className="w-full rounded-t-xl rounded-b-none border-t-2 border-x-2 flex-1 transition-all duration-700 ease-out"
                  style={{
                    background: barBg,
                    borderColor: textColor ? `${textColor}4D` : "rgba(255, 255, 255, 0.5)",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)"
                  }}
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
              <div
                className="font-bold text-xs md:text-sm whitespace-normal break-words w-full leading-snug drop-shadow-md"
                style={{ color: textColor || "#FFFFFF", fontFamily: fontFamily || "inherit" }}
                title={optionText}
              >
                {optionText || `Option ${idx + 1}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DonutPieChart({ options, isDonut = true, paletteColors = DEFAULT_PALETTE, textColor = null, fontFamily = null }) {
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
          <div className="w-24 h-24 bg-white/90 rounded-full flex flex-col items-center justify-center shadow-inner">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Options</span>
            <span className="text-xl font-extrabold text-slate-800">{count}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 max-w-md">
        {options.map((opt, idx) => {
          const text = typeof opt === "string" ? opt : opt?.text || `Option ${idx + 1}`;
          return (
            <div
              key={idx}
              className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-md border backdrop-blur-xs drop-shadow-xs"
              style={{
                color: textColor || "#FFFFFF",
                borderColor: textColor ? `${textColor}33` : "rgba(255, 255, 255, 0.2)",
                backgroundColor: textColor === "#FFFFFF" || textColor === "#ffffff" ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.2)",
                fontFamily: fontFamily || "inherit"
              }}
            >
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

function RankingPreview({ options, paletteColors = DEFAULT_PALETTE, textColor = null, fontFamily = null }) {
  const colors = paletteColors?.length ? paletteColors : DEFAULT_PALETTE;

  return (
    <div className="space-y-3 max-w-md mx-auto w-full">
      {options.map((opt, idx) => {
        const text = typeof opt === "string" ? opt : opt?.text || `Item ${idx + 1}`;
        const color = colors[idx % colors.length];

        return (
          <div
            key={idx}
            className="p-3 border rounded-md flex items-center justify-between shadow-xs transition-all"
            style={{
              color: textColor || "#FFFFFF",
              borderColor: textColor ? `${textColor}33` : "rgba(255, 255, 255, 0.2)",
              backgroundColor: textColor === "#FFFFFF" || textColor === "#ffffff" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.04)",
              fontFamily: fontFamily || "inherit"
            }}
          >
            <span className="text-sm font-semibold truncate max-w-[280px]" title={text}>{text}</span>
            <span
              className="w-6 h-6 rounded-md text-white text-xs font-bold flex items-center justify-center shadow-xs"
              style={{ backgroundColor: color }}
            >
              #{idx + 1}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function QuestionSlide({ question, index, isActive, onClick, onDelete, canDelete }) {
  const normType = normalizeQuestionType(question.type);
  const typeLabel = SLIDE_TYPE_CONFIG[normType]?.label || normType;

  return (
    <div
      onClick={onClick}
      className={`group relative p-2.5 rounded-md border-2 transition-all cursor-pointer bg-white shadow-xs ${
        isActive
          ? "border-slate-950 shadow-md ring-2 ring-slate-950/10 font-bold"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      {canDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-all z-10 cursor-pointer bg-white shadow-xs border border-slate-100"
          title="Delete slide"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-500" />
        </button>
      )}

      <div className="h-20 bg-slate-50 border border-slate-100 rounded-md p-2.5 flex flex-col justify-between">
        <div className="flex items-start gap-1.5 min-w-0 pr-4">
          <span className="text-xs font-bold text-slate-500 shrink-0">{index + 1}.</span>
          <p className="text-xs font-semibold text-slate-800 truncate flex-1 min-w-0">
            {question.text || "Untitled Question"}
          </p>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold pt-1 border-t border-slate-100">
          <span className="uppercase tracking-wider text-slate-700 font-bold">{typeLabel}</span>
          {(normType === "MultipleChoice" || normType === "Ranking") && (
            <span className="text-slate-400 font-medium">{question.options?.length || 0} opts</span>
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
  onBack,
  themeDropdown,
  selectedThemeId,
  isCreateMode = false,
}) {
  const params = useParams();
  const pollId = params?.pollId;
  const { user } = useAuth();
  const { themes } = usePollStore();
  const [activeRightTab, setActiveRightTab] = useState("content"); // 'content', 'theme', 'template', 'audio'
  const [showSlideTypeDropdown, setShowSlideTypeDropdown] = useState(false);
  const [showNewSlideModal, setShowNewSlideModal] = useState(false);
  const [showQuestionImageInput, setShowQuestionImageInput] = useState(false);
  const [activeOptionImageInputs, setActiveOptionImageInputs] = useState({});
  const [pendingTemplate, setPendingTemplate] = useState(null);
  const [audioSubTab, setAudioSubTab] = useState("myAudio"); // "defaultAudio" | "myAudio"
  const [mediaModalConfig, setMediaModalConfig] = useState({
    isOpen: false,
    type: "image",
    target: null,
    initialUrl: "",
    title: "",
    optionIdx: null,
  });

  const [themeDrawerInitialTab, setThemeDrawerInitialTab] = useState("themes");
  const [previewTheme, setPreviewTheme] = useState(null);

  const activeTheme = previewTheme || themes.find((t) => t.id === selectedThemeId) || themes[0];
  const themeStyles = getThemeStyles(activeTheme);

  // Contrast Ratio & Dynamic Image Luminance Analyzer for Readability Warning
  const currentTextColor = themeStyles.primaryTextColor || "#FFFFFF";
  const currentBgColor = themeStyles.backgroundStyle?.backgroundColor || "#0F172A";

  const hasValidImageUrl = Boolean(
    activeTheme?.backgroundType === "image" &&
    activeTheme?.backgroundValue &&
    !activeTheme.backgroundValue.trim().startsWith("#")
  );

  const [imageLuminance, setImageLuminance] = useState(null);

  useEffect(() => {
    if (!hasValidImageUrl) {
      setImageLuminance(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = activeTheme.backgroundValue;

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 40;
        canvas.height = 40;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, 40, 40);

        const imageData = ctx.getImageData(0, 0, 40, 40);
        const data = imageData.data;
        let totalLuminance = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i] / 255;
          const g = data[i + 1] / 255;
          const b = data[i + 2] / 255;
          const lum = 0.2126 * (r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)) +
                      0.7152 * (g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)) +
                      0.0722 * (b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4));
          totalLuminance += lum;
        }

        const avgLuminance = totalLuminance / (data.length / 4);
        setImageLuminance(avgLuminance);
      } catch (e) {
        setImageLuminance(0.85);
      }
    };

    img.onerror = () => {
      setImageLuminance(0.85);
    };
  }, [activeTheme?.backgroundValue, activeTheme?.backgroundType, hasValidImageUrl]);

  const hexToLuminance = (hex) => {
    if (!hex || typeof hex !== "string" || !hex.startsWith("#")) return 0.5;
    let c = hex.replace("#", "");
    if (c.length === 3) c = c.split("").map((x) => x + x).join("");
    if (c.length !== 6) return 0.5;
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;
    const aR = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const aG = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const aB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
    return 0.2126 * aR + 0.7152 * aG + 0.0722 * aB;
  };

  const getContrastRatio = (color1, color2) => {
    const l1 = hexToLuminance(color1);
    const l2 = hexToLuminance(color2);
    const max = Math.max(l1, l2);
    const min = Math.min(l1, l2);
    return (max + 0.05) / (min + 0.05);
  };

  const textLum = hexToLuminance(currentTextColor);
  let isLowContrast = false;

  if (hasValidImageUrl) {
    const bgLum = imageLuminance !== null ? imageLuminance : 0.85;
    const imgRatio = (Math.max(textLum, bgLum) + 0.05) / (Math.min(textLum, bgLum) + 0.05);
    isLowContrast = imgRatio < 3.0 || (bgLum > 0.55 && textLum > 0.5);
  } else {
    const contrastRatio = getContrastRatio(currentTextColor, currentBgColor);
    isLowContrast = contrastRatio < 3.0;
  }

  const activeQuestion = questions[activeQuestionIndex] || questions[0];

  const updateQuestionText = (text) => {
    const newQuestions = [...questions];
    newQuestions[activeQuestionIndex].text = text;
    setQuestions(newQuestions);
  };

  const updateQuestionType = (type) => {
    const newQuestions = [...questions];
    newQuestions[activeQuestionIndex].type = type;
    if (type === "Ranking") {
      newQuestions[activeQuestionIndex].visualization = "List";
    }
    if (type === "WordCloud" || type === "OpenEnded" || type === "Content") {
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

  const addQuestionWithType = (type = "MultipleChoice", isNewBlank = false) => {
    const newQuestions = [...questions];
    newQuestions.push({
      text: "",
      type: isNewBlank ? "Unselected" : type,
      visualization: type === "Ranking" ? "List" : "Bars",
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
      {/* ── Top Navigation Bar (Clean White Premium Header) ── */}
      <header className="h-16 bg-white border-b border-slate-200 px-5 flex items-center justify-between shrink-0 z-30 text-slate-900">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                router.push("/home");
              }
            }}
            className="p-2 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
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
                className="text-lg font-bold bg-slate-50 border border-slate-300 rounded-md px-3 py-1 text-slate-900 focus:outline-none focus:border-slate-900"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
              />
              <button
                onClick={() => setEditingTitle(false)}
                className="p-1.5 rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4 font-bold" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingTitle?.(true)}
              className="text-lg font-bold text-slate-900 hover:text-slate-700 transition-colors cursor-pointer"
            >
              {title || "Untitled Presentation"}
            </button>
          )}
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={isCreateMode ? () => handleCreatePoll?.("dashboard") : () => handleSavePoll?.(false)}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs border border-slate-300 shadow-xs disabled:opacity-50 cursor-pointer transition-all"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-slate-700" /> : <Save className="w-4 h-4 text-slate-700" />}
            Save
          </button>
          
          <button
            onClick={async () => {
              if (isCreateMode) {
                handleCreatePoll?.("present");
              } else {
                const ok = await handleSavePoll?.(true);
                if (ok && pollId) {
                  router?.push(`/present/${pollId}`);
                }
              }
            }}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm disabled:opacity-50 cursor-pointer transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
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
              onClick={() => addQuestionWithType("MultipleChoice", true)}
              className="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-md text-slate-800 font-bold text-xs hover:border-slate-950 hover:text-slate-950 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New slide
            </button>
          </div>
        </aside>

        {/* Center Preview Canvas */}
        <main className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center overflow-auto bg-slate-100/90">
          {/* Readability Contrast Warning Banner */}
          {isLowContrast && (
            <div className="mb-4 w-full max-w-4xl bg-amber-500/15 border border-amber-500/35 text-amber-900 px-4 py-2.5 rounded-md text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in z-20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>For readability, make sure there is a clear contrast between text colour and base colour.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setThemeDrawerInitialTab("customise");
                  setActiveRightTab("theme");
                }}
                className="underline hover:text-amber-950 font-bold ml-2 shrink-0 cursor-pointer"
              >
                Change text color
              </button>
            </div>
          )}
          {activeQuestion?.type === "Unselected" || !activeQuestion?.type ? (
            <div
              className="w-full max-w-4xl rounded-[24px] border-[3.5px] border-slate-900/90 shadow-2xl p-8 md:p-12 min-h-[480px] flex flex-col justify-between relative transition-all overflow-hidden"
              style={{
                backgroundColor: themeStyles.backgroundStyle?.backgroundColor || "#0F172A",
                ...themeStyles.backgroundStyle,
                color: themeStyles.primaryTextColor || "#FFFFFF",
                fontFamily: themeStyles.containerStyle?.fontFamily
              }}
            >
              {/* Top-left absolute corner logo */}
              <img
                src="/RapidPolls.png"
                alt="RapidPolls"
                className="absolute top-5 left-6 h-4 md:h-5 w-auto object-contain opacity-90 filter drop-shadow-sm select-none z-10"
              />

              {/* Custom Theme Logo (Top-right) */}
              {themeStyles.logoUrl ? (
                <div className="w-full flex justify-end mb-4 z-10">
                  <img
                    src={themeStyles.logoUrl}
                    alt="Custom Logo"
                    className="h-6 md:h-8 max-w-[120px] object-contain filter drop-shadow-md"
                  />
                </div>
              ) : <div className="h-4" />}

              {/* Centered Slide Layout Picker (Clean Single-Border Boxes) */}
              <div className="flex-1 flex flex-col items-center justify-center my-auto w-full py-6">
                <h2
                  className="text-2xl font-extrabold tracking-tight text-center mb-8"
                  style={{ color: themeStyles.primaryTextColor || "#000000" }}
                >
                  Select Slide Type
                </h2>

                <div className="grid grid-cols-6 gap-3.5 w-full max-w-4xl">
                  {slideTypes.map((st) => (
                    <button
                      key={st.type}
                      type="button"
                      onClick={() => {
                        const newQuestions = [...questions];
                        newQuestions[activeQuestionIndex].type = st.type;
                        if (st.type === "Content" && !newQuestions[activeQuestionIndex].text) {
                          newQuestions[activeQuestionIndex].text = "Content Slide";
                        }
                        setQuestions(newQuestions);
                      }}
                      className="group flex flex-col items-center cursor-pointer w-full"
                    >
                      {/* Single Border Frame Box (rounded-md) */}
                      <div className="w-full aspect-[4/3] rounded-md border border-slate-700/40 bg-slate-950/80 hover:bg-slate-900 hover:border-slate-500 backdrop-blur-md transition-all shadow-md overflow-hidden p-1.5 relative flex items-center justify-center group-hover:-translate-y-0.5">
                        {st.type === "MultipleChoice" ? (
                          <div className="w-full h-full flex items-end justify-between gap-1 pt-2 pb-0.5 px-1">
                            <div className="flex-1 flex flex-col items-center justify-end h-full">
                              <span className="text-[7px] font-extrabold text-indigo-300 leading-none mb-0.5">65%</span>
                              <div className="w-full bg-indigo-500/85 rounded-t-xs" style={{ height: "65%" }} />
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-end h-full">
                              <span className="text-[7px] font-extrabold text-pink-300 leading-none mb-0.5">40%</span>
                              <div className="w-full bg-pink-500/85 rounded-t-xs" style={{ height: "40%" }} />
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-end h-full">
                              <span className="text-[7px] font-extrabold text-emerald-300 leading-none mb-0.5">85%</span>
                              <div className="w-full bg-emerald-500/85 rounded-t-xs" style={{ height: "85%" }} />
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-end h-full">
                              <span className="text-[7px] font-extrabold text-amber-300 leading-none mb-0.5">25%</span>
                              <div className="w-full bg-amber-500/85 rounded-t-xs" style={{ height: "25%" }} />
                            </div>
                          </div>
                        ) : st.type === "WordCloud" ? (
                          <div className="w-full h-full flex flex-wrap items-center justify-center content-center gap-1 p-0.5 select-none">
                            <span className="text-indigo-400 font-extrabold text-[10px]">Live</span>
                            <span className="text-pink-400 font-bold text-[8px]">Great</span>
                            <span className="text-amber-300 font-black text-[11px]">Polls</span>
                            <span className="text-emerald-400 font-medium text-[7px]">Fast</span>
                            <span className="text-[#38BDF8] font-bold text-[9px]">Ideas</span>
                            <span className="text-purple-300 font-semibold text-[7px]">Cloud</span>
                          </div>
                        ) : st.type === "OpenEnded" ? (
                          <div className="w-full h-full flex flex-col gap-1 justify-center p-1">
                            <div className="w-full bg-white/10 border border-white/15 rounded-sm p-1 flex flex-col gap-0.5">
                              <div className="w-3/4 h-1 bg-white/70 rounded-full" />
                              <div className="w-1/2 h-0.5 bg-white/40 rounded-full" />
                            </div>
                            <div className="w-full bg-white/10 border border-white/15 rounded-sm p-1 flex flex-col gap-0.5 ml-1">
                              <div className="w-4/5 h-1 bg-indigo-300/80 rounded-full" />
                              <div className="w-2/5 h-0.5 bg-indigo-300/40 rounded-full" />
                            </div>
                          </div>
                        ) : st.type === "Ranking" ? (
                          <div className="w-full h-full flex flex-col justify-center gap-1 px-1 py-0.5">
                            <div className="flex items-center gap-1">
                              <span className="text-[8px] font-extrabold text-indigo-300 shrink-0 w-3">#1</span>
                              <div className="flex-1 h-1.5 bg-indigo-500/85 rounded-full" style={{ width: "90%" }} />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[8px] font-extrabold text-pink-300 shrink-0 w-3">#2</span>
                              <div className="flex-1 h-1.5 bg-pink-500/85 rounded-full" style={{ width: "65%" }} />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[8px] font-extrabold text-emerald-300 shrink-0 w-3">#3</span>
                              <div className="flex-1 h-1.5 bg-emerald-500/85 rounded-full" style={{ width: "40%" }} />
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center gap-1.5 p-1">
                            <div className="w-7 h-7 rounded-sm bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                              <ImageIcon className="w-3.5 h-3.5 text-white/70" />
                            </div>
                            <div className="flex-1 flex flex-col gap-1">
                              <div className="w-full h-1 bg-white/80 rounded-full" />
                              <div className="w-5/6 h-0.5 bg-white/50 rounded-full" />
                              <div className="w-2/3 h-0.5 bg-white/30 rounded-full" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Name Outside the Box */}
                      <span
                        className="mt-2 text-xs font-bold transition-colors text-center truncate max-w-full select-none"
                        style={{ color: themeStyles.primaryTextColor || "#000000" }}
                      >
                        {st.label}
                      </span>
                    </button>
                  ))}

                  {/* 6th Card: Templates Card */}
                  <button
                    type="button"
                    onClick={() => setActiveRightTab("template")}
                    className="group flex flex-col items-center cursor-pointer w-full"
                  >
                    <div className="w-full aspect-[4/3] rounded-md border border-slate-700/40 bg-slate-950/80 hover:bg-slate-900 hover:border-slate-500 backdrop-blur-md transition-all shadow-md overflow-hidden relative flex flex-col items-center justify-center group-hover:-translate-y-0.5">
                      <Sparkles className="w-5 h-5 text-indigo-300 group-hover:scale-110 transition-transform" />
                    </div>
                    <span
                      className="mt-2 text-xs font-bold transition-colors text-center truncate max-w-full select-none"
                      style={{ color: themeStyles.primaryTextColor || "#000000" }}
                    >
                      Templates
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="w-full max-w-4xl rounded-[24px] border-[3.5px] border-slate-900/90 shadow-2xl p-8 md:p-12 min-h-[480px] flex flex-col justify-between relative transition-all overflow-hidden"
              style={{
                backgroundColor: themeStyles.backgroundStyle?.backgroundColor || "#0F172A",
                ...themeStyles.backgroundStyle,
                color: themeStyles.primaryTextColor || "#FFFFFF",
                fontFamily: themeStyles.containerStyle?.fontFamily
              }}
            >
              {/* Top-left absolute corner logo (Mentimeter style) */}
              <img
                src="/RapidPolls.png"
                alt="RapidPolls"
                className="absolute top-5 left-6 h-4 md:h-5 w-auto object-contain opacity-90 filter drop-shadow-sm select-none z-10"
              />

              {/* Custom Theme Logo (Top-right) */}
              {themeStyles.logoUrl ? (
                <div className="w-full flex justify-end mb-4 z-10">
                  <img
                    src={themeStyles.logoUrl}
                    alt="Custom Logo"
                    className="h-6 md:h-8 max-w-[120px] object-contain filter drop-shadow-md"
                  />
                </div>
              ) : <div className="h-4" />}

              <>
                  <div className="w-full mb-6 text-left">
                    <div
                      className="border focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10 rounded-md p-3 shadow-xs transition-all w-full"
                      style={{
                        backgroundColor:
                          themeStyles.primaryTextColor === "#FFFFFF" || themeStyles.primaryTextColor === "#ffffff"
                            ? "rgba(255, 255, 255, 0.12)"
                            : "rgba(0, 0, 0, 0.04)",
                        borderColor: themeStyles.primaryTextColor
                          ? `${themeStyles.primaryTextColor}33`
                          : "rgba(255, 255, 255, 0.2)",
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
                        style={{
                          color: themeStyles.primaryTextColor || "#000000",
                          fontFamily: themeStyles.containerStyle?.fontFamily
                        }}
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
                      <VerticalBarChart
                        options={activeQuestion?.options || []}
                        showPercentage={activeQuestion?.showPercentage}
                        paletteColors={themeStyles.paletteColors}
                        textColor={themeStyles.primaryTextColor}
                        fontFamily={themeStyles.containerStyle?.fontFamily}
                      />
                    ) : activeQuestion?.type === "Ranking" ? (
                      <RankingPreview
                        options={activeQuestion?.options || []}
                        paletteColors={themeStyles.paletteColors}
                        textColor={themeStyles.primaryTextColor}
                        fontFamily={themeStyles.containerStyle?.fontFamily}
                      />
                    ) : activeQuestion?.visualization === "Donut" ? (
                      <DonutPieChart
                        options={activeQuestion?.options || []}
                        isDonut={true}
                        paletteColors={themeStyles.paletteColors}
                        textColor={themeStyles.primaryTextColor}
                        fontFamily={themeStyles.containerStyle?.fontFamily}
                      />
                    ) : activeQuestion?.visualization === "Pie" ? (
                      <DonutPieChart
                        options={activeQuestion?.options || []}
                        isDonut={false}
                        paletteColors={themeStyles.paletteColors}
                        textColor={themeStyles.primaryTextColor}
                        fontFamily={themeStyles.containerStyle?.fontFamily}
                      />
                    ) : (
                      <VerticalBarChart
                        options={activeQuestion?.options || []}
                        showPercentage={activeQuestion?.showPercentage}
                        paletteColors={themeStyles.paletteColors}
                        textColor={themeStyles.primaryTextColor}
                        fontFamily={themeStyles.containerStyle?.fontFamily}
                      />
                    )}
                  </div>
                </>
              </div>
          )}

          
        </main>

        {/* Right Drawer Panel (Opens when an icon in far right strip is clicked) */}
        {activeRightTab && (
          <aside className="w-80 my-3 mr-2 bg-white border border-slate-200/90 rounded-md shadow-xl flex flex-col shrink-0 z-30 animate-fade-in relative max-h-[calc(100vh-6.5rem)] overflow-visible">
            <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
              {activeRightTab === "content" ? (
                <div className="relative">
                  {/* Left-to-Right Moving Multi-Color Animated RGB Border Container */}
                  <div className="relative p-[2px] rounded-md overflow-hidden group shadow-xs">
                    {/* Sweeping Left-to-Right Linear Rainbow Gradient */}
                    <div
                      className="absolute inset-0 opacity-90 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: "linear-gradient(90deg, #ff007f, #7928ca, #00dfd8, #0070f3, #e0aaff, #ff007f)",
                        backgroundSize: "200% 100%",
                        animation: "rainbowLeftToRight 3s linear infinite",
                      }}
                    />
                    <style jsx>{`
                      @keyframes rainbowLeftToRight {
                        0% { background-position: 0% 0%; }
                        100% { background-position: 200% 0%; }
                      }
                    `}</style>

                    {/* Trigger Button */}
                    <button
                      type="button"
                      onClick={() => setShowSlideTypeDropdown(!showSlideTypeDropdown)}
                      className="relative flex items-center justify-between gap-2.5 bg-white hover:bg-slate-50 text-slate-900 px-3 py-1.5 rounded-[4px] font-bold text-sm shadow-2xs transition-all cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2">
                        {(() => {
                          const currentType = normalizeQuestionType(activeQuestion?.type);
                          if (!currentType || activeQuestion?.type === "Unselected") {
                            return (
                              <>
                                <LayoutGrid className="w-4 h-4 text-indigo-600" />
                                <span>Slide Type</span>
                              </>
                            );
                          }
                          const config = SLIDE_TYPE_CONFIG[currentType] || SLIDE_TYPE_CONFIG.MultipleChoice;
                          const IconComp = config.icon;
                          return (
                            <>
                              <IconComp className={`w-4 h-4 ${config.color}`} />
                              <span>{config.label}</span>
                            </>
                          );
                        })()}
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${showSlideTypeDropdown ? "rotate-180" : ""}`} />
                    </button>
                  </div>

                  {/* Custom Dropdown Menu Popover */}
                  {showSlideTypeDropdown && (
                    <>
                      {/* Click outside overlay */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowSlideTypeDropdown(false)}
                      />

                      <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-md shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                        {Object.entries(SLIDE_TYPE_CONFIG).map(([typeKey, cfg]) => {
                          const IconComp = cfg.icon;
                          const isSelected = activeQuestion?.type === typeKey;

                          return (
                            <button
                              key={typeKey}
                              type="button"
                              onClick={() => {
                                updateQuestionType(typeKey);
                                setShowSlideTypeDropdown(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? `${cfg.bg} ${cfg.color} border border-slate-200`
                                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <IconComp className={`w-4 h-4 ${cfg.color}`} />
                                <span>{cfg.label}</span>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  {activeRightTab === "audio" && (
                    <>
                      <Music className="w-4 h-4 text-slate-950" />
                      <span>Audio & Soundtracks</span>
                    </>
                  )}
                  {activeRightTab === "theme" && (
                    <>
                      <Palette className="w-4 h-4 text-slate-950" />
                      <span className="uppercase tracking-wider">Design & Styling</span>
                    </>
                  )}
                  {activeRightTab === "template" && (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span className="uppercase tracking-wider">Templates</span>
                    </>
                  )}
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
            <div className="flex-1 overflow-y-auto overflow-x-visible p-5">
              {/* CONTENT DRAWER */}
              {activeRightTab === "content" && (
                !activeQuestion?.type || activeQuestion?.type === "Unselected" ? (
                  <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 bg-slate-50 border border-dashed border-slate-300 rounded-lg my-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <LayoutGrid className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">Select a Slide Type</h3>
                    <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed">
                      Choose a layout type from the screen preview to customize your question & options.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Your Question Section */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        Your question <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                      </label>
                    </div>

                    {/* Question Input Card Box */}
                    <div className="border border-slate-300 rounded-md bg-white p-3 space-y-2 focus-within:border-slate-950 focus-within:ring-2 focus-within:ring-slate-950/10 transition-all shadow-2xs">
                      <div className="relative flex items-start justify-between gap-2">
                        <textarea
                          rows={2}
                          value={activeQuestion?.text || ""}
                          onChange={(e) => updateQuestionText(e.target.value)}
                          placeholder="Your poll question..."
                          className="w-full text-sm font-medium text-slate-900 focus:outline-none resize-none placeholder:text-slate-400"
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
                          className="p-1 text-slate-500 hover:text-slate-950 transition-colors cursor-pointer"
                          title={`Alignment: ${activeQuestion?.alignment || "center"} (Click to cycle)`}
                        >
                          {activeQuestion?.alignment === "left" && <AlignLeft className="w-4 h-4 text-slate-950" />}
                          {activeQuestion?.alignment === "right" && <AlignRight className="w-4 h-4 text-slate-950" />}
                          {(!activeQuestion?.alignment || activeQuestion?.alignment === "center") && <AlignCenter className="w-4 h-4 text-slate-950" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setMediaModalConfig({
                              isOpen: true,
                              type: "image",
                              target: "questionImage",
                              initialUrl: activeQuestion?.imageUrl || "",
                              title: "Question Image",
                            });
                          }}
                          className={`p-1 transition-colors cursor-pointer ${
                            activeQuestion?.imageUrl
                              ? "text-slate-950"
                              : "text-slate-400 hover:text-slate-600"
                          }`}
                          title="Add / Upload question image"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Options List for MultipleChoice and Ranking */}
                  {(activeQuestion?.type === "MultipleChoice" || activeQuestion?.type === "Ranking") && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          Options <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                        </label>
                      </div>

                      <div className="space-y-2">
                        {(activeQuestion?.options || []).map((opt, optIdx) => {
                          const val = typeof opt === "string" ? opt : opt?.text || "";
                          const imgVal = typeof opt === "object" ? opt?.imageUrl || "" : "";
                          const isImageActive = Boolean(imgVal);

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
                                  className="flex-1 min-w-0 h-10 px-3 border border-slate-300 rounded-l-md text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-slate-950 border-r-0"
                                />

                                {/* Image Toggle Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMediaModalConfig({
                                      isOpen: true,
                                      type: "image",
                                      target: "optionImage",
                                      optionIdx: optIdx,
                                      initialUrl: imgVal,
                                      title: `Option ${optIdx + 1} Image`,
                                    });
                                  }}
                                  className={`w-9 h-10 border border-slate-300 rounded-r-md flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                                    isImageActive ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                                  }`}
                                  title="Add / Upload option image"
                                >
                                  <ImageIcon className="w-4 h-4" />
                                </button>

                                {/* Separate Delete Button */}
                                {activeQuestion.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => removeOption(optIdx)}
                                    className="w-9 h-10 border border-slate-300 bg-slate-50 rounded-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 cursor-pointer ml-1.5"
                                    title="Delete option"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Full-width + Add Button */}
                      <button
                        type="button"
                        onClick={addOption}
                        className="w-full mt-3 py-2.5 border border-slate-300 bg-white rounded-md text-slate-900 font-bold text-xs hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
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
                        <label className="text-xs font-bold text-slate-800 block mb-2">
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
                                className={`py-2 px-3 rounded-md text-xs font-bold border transition-all ${
                                  (activeQuestion?.visualization || "List") === v.id
                                    ? "bg-slate-950 text-white border-slate-950"
                                    : "bg-white text-slate-800 border-slate-300 hover:bg-slate-50"
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
                                className={`py-2 px-3 rounded-md text-xs font-bold border transition-all ${
                                  (activeQuestion?.visualization || "Bars") === v.id
                                    ? "bg-slate-950 text-white border-slate-950"
                                    : "bg-white text-slate-800 border-slate-300 hover:bg-slate-50"
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
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                        Question & Participant Settings
                      </label>

                      {/* 1. Show percentage toggle */}
                      {(activeQuestion?.type === "MultipleChoice" || activeQuestion?.type === "Ranking") && (
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-800 hover:text-slate-950 select-none">
                          <input
                            type="checkbox"
                            checked={activeQuestion?.showPercentage || false}
                            onChange={(e) => {
                              const newQuestions = [...questions];
                              newQuestions[activeQuestionIndex].showPercentage = e.target.checked;
                              setQuestions(newQuestions);
                            }}
                            className="w-4 h-4 rounded-md border-slate-300 text-slate-950 accent-slate-950 focus:ring-slate-950"
                          />
                          <span>Show results in percentage (%)</span>
                        </label>
                      )}

                      {/* 2. Show response count toggle */}
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-800 hover:text-slate-950 select-none">
                        <input
                          type="checkbox"
                          checked={activeQuestion?.showResponseCount !== false}
                          onChange={(e) => {
                            const newQuestions = [...questions];
                            newQuestions[activeQuestionIndex].showResponseCount = e.target.checked;
                            setQuestions(newQuestions);
                          }}
                          className="w-4 h-4 rounded-md border-slate-300 text-slate-950 accent-slate-950 focus:ring-slate-950"
                        />
                        <span>Show audience response count badge</span>
                      </label>

                      {/* 3. Participant live reactions toggle */}
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-800 hover:text-slate-950 select-none">
                        <input
                          type="checkbox"
                          checked={activeQuestion?.allowReactions !== false}
                          onChange={(e) => {
                            const newQuestions = [...questions];
                            newQuestions[activeQuestionIndex].allowReactions = e.target.checked;
                            setQuestions(newQuestions);
                          }}
                          className="w-4 h-4 rounded-md border-slate-300 text-slate-950 accent-slate-950 focus:ring-slate-950"
                        />
                        <span>Allow live emoji reactions (❤️ 🔥 👏)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )
            )}

              {/* THEME DRAWER */}
              {activeRightTab === "theme" && (
                <div>
                  {React.isValidElement(themeDropdown)
                    ? React.cloneElement(themeDropdown, {
                        onPreviewTheme: setPreviewTheme,
                        initialTab: themeDrawerInitialTab,
                      })
                    : themeDropdown}
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
                      if (template?.questions?.length > 0) {
                        setQuestions(
                          template.questions.map((q) => ({
                            text: q.text || "",
                            type: normalizeQuestionType(q.type),
                            visualization: q.visualization || "Bars",
                            imageUrl: q.imageUrl || "",
                            elements: q.elements || [],
                            backgroundColor: q.backgroundColor || "#FFFFFF",
                            backgroundImage: q.backgroundImage || "",
                            showResponseCount: q.showResponseCount !== undefined ? q.showResponseCount : true,
                            showPercentage: q.showPercentage !== undefined ? q.showPercentage : false,
                            allowReactions: q.allowReactions !== undefined ? q.allowReactions : true,
                            options: q.options?.map((o) => (typeof o === "string" ? { text: o, imageUrl: "" } : { text: o.text || "", imageUrl: o.imageUrl || "" })) || [],
                          }))
                        );
                        if (template.title && setTitle) setTitle(template.title);
                        toast.success(`Template '${template.title}' applied!`);
                      }
                    }
                  }}
                  router={router}
                />
              )}

              {/* AUDIO DRAWER */}
              {activeRightTab === "audio" && (
                <div className="space-y-5 text-slate-900">
                  {/* Top Master Toggle Switch */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between shadow-2xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Music className="w-4 h-4 text-slate-900" />
                        <p className="text-xs font-bold text-slate-900">Background Audio</p>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Loop soundtrack during presentation
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(activeQuestion?.enableAudio || questions.some((q) => q.enableAudio))}
                      onClick={() => {
                        const isCurrentlyEnabled = Boolean(activeQuestion?.enableAudio || questions.some((q) => q.enableAudio));
                        const nextState = !isCurrentlyEnabled;
                        const currentTrack = activeQuestion?.audioUrl || questions.find((q) => q.audioUrl)?.audioUrl || "https://res.cloudinary.com/dkhxnyat4/video/upload/v1786698983/polls/audio/fpkrhs5gx4tnbpoimwnf.mp3";
                        const newQuestions = questions.map((q) => ({
                          ...q,
                          enableAudio: nextState,
                          audioUrl: nextState ? (q.audioUrl || currentTrack) : q.audioUrl,
                        }));
                        setQuestions(newQuestions);
                        if (nextState) {
                          toast.success("Background audio enabled for this presentation!");
                        } else {
                          toast.success("Background audio disabled");
                        }
                      }}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                        Boolean(activeQuestion?.enableAudio || questions.some((q) => q.enableAudio))
                          ? "bg-emerald-600"
                          : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                          Boolean(activeQuestion?.enableAudio || questions.some((q) => q.enableAudio))
                            ? "translate-x-5"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* MY AUDIO SECTION */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <h4 className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">My Audio</h4>
                      <button
                        type="button"
                        onClick={() =>
                          setMediaModalConfig({
                            isOpen: true,
                            type: "audio",
                            target: "questionAudio",
                            initialUrl: activeQuestion?.audioUrl || "",
                            title: "Upload Custom Audio Track",
                          })
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer border border-slate-200 shadow-2xs"
                      >
                        <Plus className="w-3 h-3" /> Upload
                      </button>
                    </div>

                    {/* Custom Uploaded Track Preview (if custom URL set) */}
                    {activeQuestion?.audioUrl &&
                    activeQuestion.audioUrl !== "https://res.cloudinary.com/dkhxnyat4/video/upload/v1786698983/polls/audio/fpkrhs5gx4tnbpoimwnf.mp3" ? (
                      <div className="p-3 bg-white border border-emerald-400 rounded-lg shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                              <Music className="w-3.5 h-3.5" />
                            </div>
                            <div className="max-w-[170px]">
                              <p className="text-xs font-bold text-slate-900 truncate" title={activeQuestion.audioUrl}>
                                {activeQuestion.audioUrl.split("/").pop() || "Custom Soundtrack"}
                              </p>
                              <p className="text-[10px] text-slate-500">Custom Track</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {Boolean(activeQuestion?.enableAudio) && (
                              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const newQuestions = questions.map((q) => ({
                                  ...q,
                                  audioUrl: "",
                                  enableAudio: false,
                                }));
                                setQuestions(newQuestions);
                                toast.success("Custom audio removed");
                              }}
                              className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                              title="Remove custom audio"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="pt-1 border-t border-slate-100">
                          <audio controls src={activeQuestion.audioUrl} className="w-full h-7 rounded-md" />
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-200 rounded-lg p-3.5 text-center bg-slate-50/50">
                        <p className="text-xs font-medium text-slate-600">No custom audio uploaded yet</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Click + Upload to upload MP3 soundtracks</p>
                      </div>
                    )}
                  </div>

                  {/* DEFAULT SOUNDTRACKS SECTION */}
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-2.5">Default Themes</h4>

                    {/* RapidPoll Ambient Theme Card */}
                    {(() => {
                      const defaultTrackUrl = "https://res.cloudinary.com/dkhxnyat4/video/upload/v1786698983/polls/audio/fpkrhs5gx4tnbpoimwnf.mp3";
                      const currentAudioUrl = activeQuestion?.audioUrl || questions.find((q) => q.audioUrl)?.audioUrl;
                      const isDefaultSelected = currentAudioUrl === defaultTrackUrl;
                      const isEnabled = Boolean(activeQuestion?.enableAudio || questions.some((q) => q.enableAudio));

                      return (
                        <div
                          onClick={() => {
                            const newQuestions = questions.map((q) => ({
                              ...q,
                              audioUrl: defaultTrackUrl,
                              enableAudio: true,
                            }));
                            setQuestions(newQuestions);
                            toast.success("RapidPoll Ambient Theme applied!");
                          }}
                          className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                            isDefaultSelected
                              ? "border-emerald-500 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500/20"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                                  isDefaultSelected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                <Music className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900">RapidPoll Ambient Theme</p>
                              </div>
                            </div>

                            {isDefaultSelected && isEnabled && (
                              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                          </div>

                          <div
                            className="mt-2.5 pt-2 border-t border-slate-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <audio
                              controls
                              src={defaultTrackUrl}
                              className="w-full h-7 rounded-md"
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Far Right Vertical Icon Strip */}
        <RightToolbar
          activeRightTab={activeRightTab}
          setActiveRightTab={setActiveRightTab}
        />
      </div>

      {/* Global Media Upload Modal (Images & Audio via Cloudinary) */}
      <MediaUploadModal
        isOpen={mediaModalConfig.isOpen}
        onClose={() =>
          setMediaModalConfig({
            isOpen: false,
            type: "image",
            target: null,
            initialUrl: "",
            title: "",
            optionIdx: null,
          })
        }
        type={mediaModalConfig.type}
        initialUrl={mediaModalConfig.initialUrl}
        title={mediaModalConfig.title}
        onSelectUrl={(url) => {
          if (mediaModalConfig.target === "questionImage") {
            const newQuestions = [...questions];
            newQuestions[activeQuestionIndex].imageUrl = url;
            setQuestions(newQuestions);
            setShowQuestionImageInput(Boolean(url));
          } else if (mediaModalConfig.target === "questionAudio") {
            const newQuestions = [...questions];
            newQuestions[activeQuestionIndex].audioUrl = url;
            newQuestions[activeQuestionIndex].enableAudio = Boolean(url);
            setQuestions(newQuestions);
          } else if (mediaModalConfig.target === "optionImage" && mediaModalConfig.optionIdx !== null) {
            const optIdx = mediaModalConfig.optionIdx;
            const newQuestions = [...questions];
            const opts = [...(newQuestions[activeQuestionIndex].options || [])];
            if (typeof opts[optIdx] === "string") {
              opts[optIdx] = { text: opts[optIdx], imageUrl: url };
            } else {
              opts[optIdx] = { ...opts[optIdx], imageUrl: url };
            }
            newQuestions[activeQuestionIndex].options = opts;
            setQuestions(newQuestions);
            setActiveOptionImageInputs((prev) => ({ ...prev, [optIdx]: Boolean(url) }));
          }
        }}
      />

      {/* ── Template Confirmation Modal ── */}
      {pendingTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-md max-w-md w-full p-6 shadow-2xl relative text-left border border-slate-200">
            <div className="w-12 h-12 rounded-md bg-slate-100 text-slate-950 flex items-center justify-center mb-4 border border-slate-200">
              <Sparkles className="w-6 h-6 text-slate-950" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Apply Template?</h3>
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

                  const templateToApply = pendingTemplate;
                  setPendingTemplate(null);
                  if (templateToApply?.questions?.length > 0) {
                    setQuestions(
                      templateToApply.questions.map((q) => ({
                        text: q.text || "",
                        type: normalizeQuestionType(q.type),
                        visualization: q.visualization || "Bars",
                        imageUrl: q.imageUrl || "",
                        elements: q.elements || [],
                        backgroundColor: q.backgroundColor || "#FFFFFF",
                        backgroundImage: q.backgroundImage || "",
                        showResponseCount: q.showResponseCount !== undefined ? q.showResponseCount : true,
                        showPercentage: q.showPercentage !== undefined ? q.showPercentage : false,
                        allowReactions: q.allowReactions !== undefined ? q.allowReactions : true,
                        options: q.options?.map((o) => (typeof o === "string" ? { text: o, imageUrl: "" } : { text: o.text || "", imageUrl: o.imageUrl || "" })) || [],
                      }))
                    );
                    if (templateToApply.title) setTitle(templateToApply.title);
                    toast.success(`Template '${templateToApply.title}' applied!`);
                  }
                }}
                className="w-full py-2.5 px-4 rounded-md bg-slate-950 hover:bg-slate-900 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save & Apply Template
              </button>

              <button
                type="button"
                onClick={() => {
                  const templateToApply = pendingTemplate;
                  setPendingTemplate(null);
                  if (templateToApply?.questions?.length > 0) {
                    setQuestions(
                      templateToApply.questions.map((q) => ({
                        text: q.text || "",
                        type: normalizeQuestionType(q.type),
                        visualization: q.visualization || "Bars",
                        imageUrl: q.imageUrl || "",
                        elements: q.elements || [],
                        backgroundColor: q.backgroundColor || "#FFFFFF",
                        backgroundImage: q.backgroundImage || "",
                        showResponseCount: q.showResponseCount !== undefined ? q.showResponseCount : true,
                        showPercentage: q.showPercentage !== undefined ? q.showPercentage : false,
                        allowReactions: q.allowReactions !== undefined ? q.allowReactions : true,
                        options: q.options?.map((o) => (typeof o === "string" ? { text: o, imageUrl: "" } : { text: o.text || "", imageUrl: o.imageUrl || "" })) || [],
                      }))
                    );
                    if (templateToApply.title) setTitle(templateToApply.title);
                    toast.success(`Template '${templateToApply.title}' applied!`);
                  }
                }}
                className="w-full py-2.5 px-4 rounded-md bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer border border-red-200"
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
    </div>
  );
}

function TemplateDrawerSection({ user, onApplyTemplate, router }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Extract unique categories from fetched templates
  const categories = [
    "All",
    ...Array.from(new Set((templates || []).map((t) => t.category).filter(Boolean))),
  ];

  // Filter templates based on category & search query
  const filteredTemplates = (templates || []).filter((t) => {
    const matchesCategory =
      selectedCategory === "All" ||
      selectedCategory === "All Categories" ||
      t.category?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      !searchQuery.trim() ||
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-3.5">
      {/* Header & Filter Controls */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
          Presentation Templates
        </label>

        {/* Category Dropdown */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={loading || templates.length === 0}
            className="w-full appearance-none px-3 py-2 pr-8 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {categories.map((cat) => {
              const count =
                cat === "All"
                  ? templates.length
                  : templates.filter((t) => t.category?.toLowerCase() === cat.toLowerCase()).length;
              return (
                <option key={cat} value={cat}>
                  {cat === "All" ? "All Categories" : cat} ({count})
                </option>
              );
            })}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading templates...
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-8 px-3 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          <p className="text-xs font-semibold text-slate-600 mb-1">No templates found</p>
          <p className="text-[10px] text-slate-400 mb-3">Try selecting another category</p>
          <button
            type="button"
            onClick={() => setSelectedCategory("All")}
            className="px-2.5 py-1 text-[10px] font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md shadow-xs transition-colors cursor-pointer"
          >
            Show All ({templates.length})
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 w-full">
          {filteredTemplates.map((t) => {
            const imageUrl = t.imageUrl || t.ImageUrl || "https://res.cloudinary.com/dkhxnyat4/image/upload/v1786185975/polls/images/aesthetic-wallpaper-1_cjqchq.jpg";
            const slideCount = t.questions?.length || 5;

            return (
              <div
                key={t.id}
                onClick={() => onApplyTemplate(t)}
                className="group w-full h-[115px] flex flex-col justify-between rounded-md bg-white border border-slate-300 hover:border-slate-400 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
              >
                {/* Top Image Portion */}
                <div className="h-[75px] w-full relative overflow-hidden rounded-t-md bg-slate-100 shrink-0">
                  <img
                    src={imageUrl}
                    alt={t.title || "Template Preview"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-white text-[8px] font-semibold uppercase tracking-wider z-10">
                    {t.category || "Template"}
                  </span>
                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white rounded-md p-1 shadow-xs z-10">
                    <Sparkles className="w-2.5 h-2.5" />
                  </div>
                </div>

                {/* Bottom Text Portion */}
                <div className="px-2 py-1.5 border-t border-slate-200 bg-white shrink-0 rounded-b-md">
                  <p className="text-[11px] font-bold text-slate-900 truncate leading-tight" title={t.title}>
                    {t.title || "Untitled Template"}
                  </p>
                  <p className="text-[9px] text-slate-500 mt-0.5 leading-none font-medium">
                    {slideCount} slides
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
