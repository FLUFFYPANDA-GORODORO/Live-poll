"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import { 
  Plus, 
  Trash2, 
  Save, 
  ChevronLeft, 
  Loader2,
  Check,
  X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import toast from "react-hot-toast";

// Chart colors for bars
const CHART_COLORS = [
  "#6366F1", "#8B5CF6", "#EC4899", "#F59E0B",
  "#10B981", "#3B82F6", "#EF4444", "#14B8A6",
];

// Vertical Bar Chart Component
function VerticalBarChart({ options }) {
  return (
    <div className="flex items-end justify-center gap-4 h-48 px-4">
      {options.map((option, idx) => {
        const height = 30 + (idx * 15) % 70;
        return (
          <div key={idx} className="flex flex-col items-center gap-2">
            <div className="relative h-36 w-12 flex items-end">
              <div
                className="w-full rounded-t-lg transition-all duration-500"
                style={{
                  height: `${height}%`,
                  backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                  minHeight: "8px",
                }}
              />
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-text truncate max-w-[60px]">
                {option || `Opt ${idx + 1}`}
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
      className={`relative p-3 rounded-xl cursor-pointer transition-all ${
        isActive
          ? "bg-[#6366F1] text-white shadow-lg shadow-[#6366F1]/25 scale-[1.02]"
          : "bg-white hover:bg-surface-hover border border-border"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
          isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
        }`}>
          Q{index + 1}
        </span>
        {canDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className={`ml-auto p-1 rounded hover:bg-red-500/20 ${
              isActive ? "text-white/80 hover:text-white" : "text-text-muted hover:text-error"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <p className={`text-sm font-medium truncate ${
        isActive ? "text-white" : "text-text"
      }`}>
        {question.text || "Untitled Question"}
      </p>
      <div className={`text-xs mt-1 ${
        isActive ? "text-white/70" : "text-text-muted"
      }`}>
        {optionCount} option{optionCount !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

export default function EditPoll() {
  const router = useRouter();
  const { pollId } = useParams();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);

  // Load poll data
  useEffect(() => {
    if (!pollId || !user) return;

    const loadPoll = async () => {
      try {
        const pollDoc = await getDoc(doc(db, "polls", pollId));
        if (!pollDoc.exists()) {
          toast.error("Poll not found");
          router.push("/dashboard");
          return;
        }

        const data = pollDoc.data();
        if (data.createdBy !== user.uid) {
          toast.error("You don't have permission to edit this poll");
          router.push("/dashboard");
          return;
        }

        setTitle(data.title || "");
        setQuestions(
          data.questions?.map(q => ({
            text: q.text || "",
            options: q.options?.map(o => o.text || "") || ["", ""]
          })) || [{ text: "", options: ["", ""] }]
        );
      } catch (err) {
        console.error("Error loading poll:", err);
        toast.error("Failed to load poll");
      } finally {
        setLoading(false);
      }
    };

    loadPoll();
  }, [pollId, user, router]);

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

  // Save poll
  const savePoll = async () => {
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
      const questionsData = questions.map((q) => ({
        text: q.text.trim(),
        options: q.options
          .filter(opt => opt.trim() !== "")
          .map((o) => ({ text: o.trim() })),
      }));

      // Rebuild voteCounts for new structure
      const voteCounts = {};
      questionsData.forEach((q, qIdx) => {
        q.options.forEach((_, optIdx) => {
          voteCounts[`${qIdx}_${optIdx}`] = 0;
        });
      });

      await updateDoc(doc(db, "polls", pollId), {
        title: title.trim(),
        questions: questionsData,
        voteCounts,
        updatedAt: serverTimestamp(),
      });

      toast.success("Poll saved!");
      router.push("/dashboard");
    } catch (err) {
      console.error("Error saving poll:", err);
      toast.error("Failed to save poll");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Top Header */}
        <header className="bg-surface border-b border-border px-4 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="p-2 rounded-lg hover:bg-surface-hover text-text-secondary"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {/* Editable Title */}
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Poll Title"
                    className="text-xl font-bold text-text bg-transparent border-b-2 border-primary focus:outline-none px-1"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
                  />
                  <button
                    onClick={() => setEditingTitle(false)}
                    className="p-1 rounded bg-primary text-white"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingTitle(true)}
                  className="text-xl font-bold text-text hover:text-primary"
                >
                  {title || "Untitled Poll"}
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={addQuestion}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-hover text-text-secondary hover:bg-border transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
              <button
                onClick={savePoll}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50"
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
          {/* Left Sidebar - Question Slides */}
          <aside className="w-64 bg-surface-hover border-r border-border p-4 overflow-y-auto">
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
                className="w-full p-3 rounded-xl border-2 border-dashed border-border text-text-secondary hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
            </div>
          </aside>

          {/* Main Content - Preview & Editor */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Preview Area */}
            <div className="flex-1 p-8 flex items-center justify-center overflow-auto">
              <div className="w-full max-w-2xl">
                {/* Question Text */}
                <div className="text-center mb-8">
                  <input
                    type="text"
                    value={activeQuestion?.text || ""}
                    onChange={(e) => updateQuestionText(e.target.value)}
                    placeholder="Type your question here..."
                    className="w-full text-2xl md:text-3xl font-bold text-center text-text bg-transparent border-none focus:outline-none focus:ring-0 placeholder-text-muted"
                  />
                  <div className="text-sm text-text-secondary mt-2">
                    Question {activeQuestionIndex + 1} of {questions.length}
                  </div>
                </div>

                {/* Vertical Bar Chart Preview */}
                <div className="bg-surface rounded-2xl shadow-lg p-6 border border-border">
                  <VerticalBarChart options={activeQuestion?.options || []} />
                </div>
              </div>
            </div>

            {/* Bottom Option Editor */}
            <div className="bg-surface border-t border-border p-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-text-secondary">Options</span>
                  <button
                    onClick={addOption}
                    className="text-sm text-primary hover:text-primary-hover font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Option
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {activeQuestion?.options.map((option, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 border border-border group"
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
                        className="bg-transparent border-none focus:outline-none text-text w-32"
                      />
                      {activeQuestion.options.length > 2 && (
                        <button
                          onClick={() => removeOption(idx)}
                          className="p-1 rounded text-text-muted hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-opacity"
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
    </ProtectedRoute>
  );
}
