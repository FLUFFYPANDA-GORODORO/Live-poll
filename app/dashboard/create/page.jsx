"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Trash2, 
  Play, 
  ChevronLeft, 
  Loader2, 
  Edit3,
  Check,
  X,
  AlignLeft,
  Settings
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import toast from "react-hot-toast";

const generatePollId = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

// Chart colors (Primary/Secondary based)
const CHART_COLORS = [
  "var(--color-primary)", 
];

// Vertical Bar Chart Component
function VerticalBarChart({ options, showSampleData = true }) {
  // Generate sample vote data for preview
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
          <div key={idx} className="flex flex-col items-center gap-2 flex-1 max-w-[80px] h-full">
            {/* Value Label */}
            <div className="text-xs font-bold text-slate-500 mb-1">{percentage}%</div>
            
            {/* Bar */}
            <div className="relative w-full flex items-end flex-1 bg-slate-100 rounded-t-lg overflow-hidden">
               <div
                className="w-full transition-all duration-500 rounded-t-lg"
                style={{
                  height: `${height}%`,
                  backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                  minHeight: votes > 0 ? "8px" : "0",
                }}
              />
            </div>
            
            {/* Label */}
            <div className="text-center w-full">
              <div className="text-sm font-semibold text-slate-700 truncate w-full" title={option.text}>
                {option.text || `Opt ${idx + 1}`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Question Slide Thumbnail
function QuestionSlide({ question, index, isActive, onClick, onDelete, canDelete }) {
  const optionCount = question.options.filter(o => o.trim()).length;
  
  return (
    <div
      onClick={onClick}
      className={`relative p-4 rounded-xl cursor-pointer transition-all border ${
        isActive
          ? "bg-[var(--color-primary-light)] border-[var(--color-primary)] shadow-sm"
          : "bg-white hover:bg-slate-50 border-slate-200"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
          isActive ? "bg-[var(--color-primary)] text-white" : "bg-slate-100 text-slate-500"
        }`}>
          Q{index + 1}
        </span>
        {canDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="ml-auto p-1 rounded text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <p className="text-sm font-bold text-slate-800 line-clamp-1 mb-1">
        {question.text || "Untitled Question"}
      </p>
      <div className="text-xs text-slate-500">
        {optionCount} option{optionCount !== 1 ? "s" : ""}
      </div>
      
      {/* Mini bar preview */}
      <div className="flex items-end gap-1 h-6 mt-3 opacity-60">
        {question.options.slice(0, 4).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-t"
            style={{ 
              height: `${30 + (i * 20)}%`,
              backgroundColor: isActive ? 'var(--color-primary)' : '#cbd5e1'
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function CreatePoll() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([
    { text: "", options: ["", ""] },
  ]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);


  const activeQuestion = questions[activeQuestionIndex];

  // Question management
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

  // Option management
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

  // Create poll
  const createPoll = async (redirectPath = "present") => {
    if (!user) {
      toast.error("Please log in to create a poll");
      router.push("/login");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a poll title");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        toast.error(`Please enter text for Question ${i + 1}`);
        setActiveQuestionIndex(i);
        return;
      }
      const validOptions = q.options.filter(opt => opt.trim() !== "");
      if (validOptions.length < 2) {
        toast.error(`Question ${i + 1} needs at least 2 options`);
        setActiveQuestionIndex(i);
        return;
      }
    }

    setIsSaving(true);
    try {
      const pollId = generatePollId();

      const questionsData = questions.map((q) => ({
        text: q.text.trim(),
        options: q.options
          .filter(opt => opt.trim() !== "")
          .map((o) => ({ text: o.trim() })),
      }));

      const voteCounts = {};
      questionsData.forEach((q, qIdx) => {
        q.options.forEach((_, optIdx) => {
          voteCounts[`${qIdx}_${optIdx}`] = 0;
        });
      });

      await setDoc(doc(db, "polls", pollId), {
        title: title.trim(),
        createdBy: user.uid,
        createdByEmail: user.email,
        createdByName: user.displayName || "Anonymous",
        status: "draft",
        activeQuestionIndex: -1,
        currentQuestionActive: false,
        questions: questionsData,
        voteCounts,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Poll created successfully!");
      if (redirectPath === "dashboard") {
        router.push("/dashboard");
      } else {
        router.push(`/present/${pollId}`);
      }
    } catch (err) {
      console.error("Error creating poll:", err);
      toast.error("Failed to create poll");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 flex items-center justify-between shadow-sm z-20 relative h-16">
          
          {/* Left: Title Area (Matches Sidebar Width) */}
          <div className="w-64 h-full border-r border-slate-200 flex items-center px-4 gap-3 bg-slate-50">
             <button
                onClick={() => router.push("/dashboard")}
                className="p-1.5 rounded-lg hover:bg-white text-slate-500 hover:text-slate-800 transition-all border border-transparent hover:border-slate-200"
                title="Back to Dashboard"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Untitled Poll"
                    className="w-full text-lg font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] placeholder-slate-400 transition-all"
                  />
              </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 px-6">
              <button
                onClick={() => createPoll("dashboard")}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all text-sm font-medium disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Create
              </button>
              <button
                onClick={() => createPoll("present")}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-hover)] transition-all shadow-lg shadow-[var(--color-primary)]/20 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Start Presentation
              </button>
          </div>
        </header>

        {/* Main Workspace (3-Column Layout) */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* 1. Left Sidebar: Question Slides */}
          <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col h-full">
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
                className="w-full p-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-all flex items-center justify-center gap-2 font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                New Question
              </button>
            </div>
            
            <div className="p-4 border-t border-slate-200 text-xs text-center text-slate-400">
                {questions.length} question{questions.length !== 1 ? 's' : ''} total
            </div>
          </aside>

          {/* 2. Center: Canvas / Preview */}
          <main className="flex-1 bg-slate-100 flex flex-col relative overflow-hidden">
             
             {/* Question Input Area */}
             <div className="p-8 pb-4 flex justify-center">
                <input
                    type="text"
                    value={activeQuestion?.text || ""}
                    onChange={(e) => updateQuestionText(e.target.value)}
                    placeholder="Type your question here..."
                    className="w-full max-w-3xl text-3xl md:text-4xl font-bold text-center text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 placeholder-slate-300 transition-colors"
                />
             </div>

             {/* Chart Preview Area */}
             <div className="flex-1 p-8 pt-4 flex items-center justify-center overflow-auto">
                <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-8 border border-slate-200 aspect-video flex flex-col justify-center">
                     {activeQuestion?.text ? (
                        <>
                           <h3 className="text-xl font-semibold text-center text-slate-700 mb-8">{activeQuestion.text}</h3>
                           <VerticalBarChart
                              key={activeQuestionIndex}
                              options={activeQuestion?.options.map(o => ({ text: o })) || []}
                              showSampleData={true}
                           />
                           <p className="text-xs text-slate-400 text-center mt-6 italic">
                              * Random data for visual representation only
                           </p>
                        </>
                     ) : (
                        <div className="text-center text-slate-400">
                           <AlignLeft className="w-12 h-12 mx-auto mb-2 opacity-20" />
                           <p>Start typing your question and options...</p>
                        </div>
                     )}
                </div>
             </div>
          </main>

          {/* 3. Right Sidebar: Options Editor */}
          <aside className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shadow-lg z-10">
              <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                 <Settings className="w-5 h-5 text-slate-400" />
                 <h2 className="font-bold text-slate-700">Question Settings</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5">
                 
                 {/* Option List */}
                 <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Options</label>
                        <span className="text-xs text-slate-400">{activeQuestion?.options.length} items</span>
                    </div>
                    
                    <div className="space-y-3">
                        {activeQuestion?.options.map((option, idx) => (
                            <div key={idx} className="flex items-center gap-2 group">
                                <div className="w-1.5 h-8 rounded-full bg-slate-200 flex-shrink-0" 
                                     style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                                />
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => updateOption(idx, e.target.value)}
                                        placeholder={`Option ${idx + 1}`}
                                        className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-200 text-sm focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all placeholder-slate-300"
                                    />
                                    {activeQuestion.options.length > 2 && (
                                        <button
                                            onClick={() => removeOption(idx)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-colors"
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
                        className="mt-4 w-full py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all text-sm font-medium flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Option
                    </button>
                 </div>



              </div>
          </aside>
        </div>
      </div>
    </ProtectedRoute>
  );
}