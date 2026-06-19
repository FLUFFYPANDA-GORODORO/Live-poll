"use client";

import { useState, useEffect } from "react";
import { usePollStore } from "@/lib/store/usePollStore";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { parseTheme } from "@/lib/themeHelper";

import StandardEdit from "@/components/Themes/StandardEdit";
import SynergySphereEdit from "@/components/Themes/SynergySphereEdit";
import MasterclassEdit from "@/components/Themes/MasterclassEdit";

export default function EditPoll() {
  const router = useRouter();
  const { pollId } = useParams();
  const { user } = useAuth();
  
  const {
    fetchPollById,
    savePoll,
    isSaving,
    loadingCurrent: loading
  } = usePollStore();

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [editingTitle, setEditingTitle] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("standard");

  // Load poll data
  useEffect(() => {
    if (!pollId || !user) return;

    const loadPoll = async () => {
      try {
        const data = await fetchPollById(pollId);
        if (!data) {
          toast.error("Poll not found");
          router.push("/dashboard");
          return;
        }

        if (data.createdBy !== user.uid) {
          toast.error("You don't have permission to edit this poll");
          router.push("/dashboard");
          return;
        }

        // Parse theme from title if suffix is present in DB
        const parsed = parseTheme(data.title || "");
        setTitle(parsed.cleanTitle);
        setSelectedTheme(parsed.theme);

        setQuestions(
          data.questions?.map(q => ({
            text: q.text || "",
            options: q.options?.map(o => o.text || "") || ["", ""]
          })) || [{ text: "", options: ["", ""] }]
        );
      } catch (err) {
        console.error("Error loading poll:", err);
        toast.error("Failed to load poll");
      }
    };

    loadPoll();
  }, [pollId, user, router, fetchPollById]);

  // Save poll handler
  const handleSavePoll = async () => {
    if (!title.trim()) {
      toast.error("Please enter a poll title");
      return;
    }

    // Append suffix to title when sending to backend to persist theme
    let titleWithSuffix = title.trim();
    if (selectedTheme === "synergy_sphere") {
      titleWithSuffix = `${titleWithSuffix} ~SS`;
    } else if (selectedTheme === "masterclass") {
      titleWithSuffix = `${titleWithSuffix} ~MC`;
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

    try {
      // Save title to backend with suffix to persist theme
      await savePoll(pollId, titleWithSuffix, questions);
      toast.success("Poll saved!");
      router.push("/dashboard");
    } catch (err) {
      console.error("Error saving poll:", err);
      toast.error("Failed to save poll");
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

  // Theme selector dropdown
  const themeDropdown = (
    <div className="flex items-center gap-2">
      <label htmlFor="theme-select" className="text-xs font-bold uppercase tracking-wider text-slate-500">
        Theme:
      </label>
      <select
        id="theme-select"
        value={selectedTheme}
        onChange={(e) => setSelectedTheme(e.target.value)}
        className="bg-white border border-slate-300 rounded px-2 py-1 text-sm font-semibold focus:outline-none text-slate-700"
      >
        <option value="standard">Standard</option>
        <option value="synergy_sphere">Synergy Sphere</option>
        <option value="masterclass">Masterclass</option>
      </select>
    </div>
  );

  // Render correct theme edit layout
  if (selectedTheme === "synergy_sphere") {
    return (
      <ProtectedRoute>
        <SynergySphereEdit
          title={title}
          setTitle={setTitle}
          questions={questions}
          setQuestions={setQuestions}
          activeQuestionIndex={activeQuestionIndex}
          setActiveQuestionIndex={setActiveQuestionIndex}
          editingTitle={editingTitle}
          setEditingTitle={setEditingTitle}
          isSaving={isSaving}
          handleSavePoll={handleSavePoll}
          router={router}
          themeDropdown={themeDropdown}
        />
      </ProtectedRoute>
    );
  }

  if (selectedTheme === "masterclass") {
    return (
      <ProtectedRoute>
        <MasterclassEdit
          title={title}
          setTitle={setTitle}
          questions={questions}
          setQuestions={setQuestions}
          activeQuestionIndex={activeQuestionIndex}
          setActiveQuestionIndex={setActiveQuestionIndex}
          editingTitle={editingTitle}
          setEditingTitle={setEditingTitle}
          isSaving={isSaving}
          handleSavePoll={handleSavePoll}
          router={router}
          themeDropdown={themeDropdown}
        />
      </ProtectedRoute>
    );
  }

  // Default Standard layout
  return (
    <ProtectedRoute>
      <StandardEdit
        title={title}
        setTitle={setTitle}
        questions={questions}
        setQuestions={setQuestions}
        activeQuestionIndex={activeQuestionIndex}
        setActiveQuestionIndex={setActiveQuestionIndex}
        editingTitle={editingTitle}
        setEditingTitle={setEditingTitle}
        isSaving={isSaving}
        handleSavePoll={handleSavePoll}
        router={router}
        themeDropdown={themeDropdown}
      />
    </ProtectedRoute>
  );
}
