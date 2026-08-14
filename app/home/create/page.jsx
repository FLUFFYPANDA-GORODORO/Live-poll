"use client";

import { useState, useEffect } from "react";
import { usePollStore } from "@/lib/store/usePollStore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";
import StandardEdit from "@/components/Themes/StandardEdit";
import ThemeSelectorModal from "@/components/Dashboard/ThemeSelectorModal";
import { api } from "@/lib/api";

export default function CreatePoll() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([
    {
      text: "",
      type: "Unselected",
      visualization: "Bars",
      imageUrl: "",
      showResponseCount: true,
      showPercentage: false,
      allowReactions: true,
      options: [{ text: "", imageUrl: "" }, { text: "", imageUrl: "" }]
    },
  ]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [editingTitle, setEditingTitle] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState("11111111-1111-1111-1111-111111111111");

  const { createPoll, isSaving } = usePollStore();

  // Local Storage Key
  const STORAGE_KEY = "rapidpolls_create_draft";

  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial draft from localStorage if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.questions?.length) setQuestions(parsed.questions);
        if (parsed.selectedThemeId) setSelectedThemeId(parsed.selectedThemeId);
      }
    } catch (err) {
      console.warn("Failed to load create draft from localStorage", err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save changes to localStorage on edit (only after initial load is complete)
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const draft = { title, questions, selectedThemeId };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch (err) {
      console.warn("Failed to save create draft to localStorage", err);
    }
  }, [title, questions, selectedThemeId, isLoaded]);

  // Unsaved changes tracking
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const isDirty = Boolean(
    title.trim() !== "" ||
      questions.length > 1 ||
      (questions[0] &&
        (questions[0].text.trim() !== "" || questions[0].type !== "Unselected"))
  );

  const handleBack = () => {
    if (isDirty) {
      setShowUnsavedModal(true);
    } else {
      router.push("/home");
    }
  };

  const handleCreatePoll = async (redirectPath = "present", skipRedirect = false) => {
    if (!user) {
      toast.error("Please log in to create a poll");
      router.push("/login");
      return false;
    }

    let pollTitle = title.trim();
    if (!pollTitle) {
      if (skipRedirect) {
        pollTitle = "Untitled Presentation";
      } else {
        toast.error("Please enter a poll title before saving");
        return false;
      }
    }

    const cleanedQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      let rawType = typeof q.type === "string" ? q.type : String(q.type || "");
      let typeStr = rawType.toLowerCase();
      let qType = "MultipleChoice";
      if (rawType === "Unselected" || typeStr === "unselected") qType = "MultipleChoice";
      else if (rawType === "1" || rawType === "WordCloud" || typeStr === "wordcloud") qType = "WordCloud";
      else if (rawType === "2" || rawType === "OpenEnded" || typeStr === "openended") qType = "OpenEnded";
      else if (rawType === "3" || rawType === "Ranking" || typeStr === "ranking") qType = "Ranking";

      let questionText = (q.text || "").trim();
      if (!questionText) {
        if (!skipRedirect) {
          toast.error(`Please enter text for Question ${i + 1}`);
          setActiveQuestionIndex(i);
          return false;
        } else {
          questionText = `Question ${i + 1}`;
        }
      }

      let visType = q.visualization || null;
      if (qType === "MultipleChoice" && !["Bars", "Donut", "Pie"].includes(visType)) {
        visType = "Bars";
      } else if (qType === "WordCloud") {
        visType = "WordCloud";
      } else if (qType === "Ranking" && !["RankedBars", "RankedList", "Bars", "List"].includes(visType)) {
        visType = "RankedBars";
      } else if (qType === "OpenEnded" && !["Cards", "List"].includes(visType)) {
        visType = "Cards";
      }

      if (qType === "WordCloud" || qType === "OpenEnded") {
        cleanedQuestions.push({
          text: questionText,
          type: qType,
          visualization: visType,
          imageUrl: (q.imageUrl || "").trim() || null,
          showResponseCount: q.showResponseCount !== undefined ? q.showResponseCount : true,
          showPercentage: q.showPercentage !== undefined ? q.showPercentage : false,
          allowReactions: q.allowReactions !== undefined ? q.allowReactions : true,
          options: [],
        });
      } else {
        let validOptions = (q.options || [])
          .map((opt) => (typeof opt === "string" ? { text: opt.trim(), imageUrl: null } : { text: (opt.text || "").trim(), imageUrl: opt.imageUrl ? opt.imageUrl.trim() : null }))
          .filter((opt) => opt.text !== "");

        if (validOptions.length < 2) {
          validOptions = [
            { text: validOptions[0]?.text || "Option 1", imageUrl: null },
            { text: validOptions[1]?.text || "Option 2", imageUrl: null },
          ];
        }

        cleanedQuestions.push({
          text: questionText,
          type: qType,
          visualization: visType,
          imageUrl: q.imageUrl ? q.imageUrl.trim() : null,
          showResponseCount: q.showResponseCount !== undefined ? q.showResponseCount : true,
          showPercentage: q.showPercentage !== undefined ? q.showPercentage : false,
          allowReactions: q.allowReactions !== undefined ? q.allowReactions : true,
          options: validOptions,
        });
      }
    }

    if (cleanedQuestions.length === 0) {
      toast.error("Please add at least one question");
      return false;
    }

    try {
      const pollId = await createPoll(pollTitle, cleanedQuestions, selectedThemeId);

      // Clear localStorage draft on successful save
      localStorage.removeItem(STORAGE_KEY);

      toast.success("Poll created successfully!");
      if (!skipRedirect) {
        if (redirectPath === "dashboard") {
          router.push("/home");
        } else {
          router.push(`/present/${pollId}`);
        }
      }
      return true;
    } catch (err) {
      console.error("Error creating poll:", err);
      toast.error("Failed to create poll");
      return false;
    }
  };

  const themeDropdown = (
    <ThemeSelectorModal
      selectedThemeId={selectedThemeId}
      onSelectTheme={(id) => setSelectedThemeId(id)}
    />
  );

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
        handleCreatePoll={handleCreatePoll}
        router={router}
        onBack={handleBack}
        themeDropdown={themeDropdown}
        selectedThemeId={selectedThemeId}
        isCreateMode={true}
      />

      <ConfirmModal
        isOpen={showUnsavedModal}
        title="Unsaved Changes"
        message="You have unsaved changes in this presentation. Would you like to save them before leaving?"
        confirmText="Save & Leave"
        cancelText="Cancel"
        secondaryText="Discard & Leave"
        isDanger={false}
        onConfirm={async () => {
          const success = await handleCreatePoll("dashboard", true);
          if (success) {
            localStorage.removeItem(STORAGE_KEY);
            router.push("/home");
          }
        }}
        onSecondaryAction={() => {
          localStorage.removeItem(STORAGE_KEY);
          router.push("/home");
        }}
        onClose={() => setShowUnsavedModal(false)}
      />
    </ProtectedRoute>
  );
}
