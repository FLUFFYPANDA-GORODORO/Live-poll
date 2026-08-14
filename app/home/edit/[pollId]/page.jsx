"use client";

import { useState, useEffect } from "react";
import { usePollStore } from "@/lib/store/usePollStore";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";
import { Loader2 } from "lucide-react";
import EditScreen from "@/components/Themes/StandardEdit";
import ThemeSelectorModal from "@/components/Dashboard/ThemeSelectorModal";
import { api } from "@/lib/api";

export default function EditPoll() {
  const router = useRouter();
  const { pollId } = useParams();
  const { user } = useAuth();

  const { fetchPollById, savePoll, isSaving, loadingCurrent: loading } = usePollStore();

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [editingTitle, setEditingTitle] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState("11111111-1111-1111-1111-111111111111");

  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const STORAGE_KEY = `rapidpolls_edit_draft_${pollId}`;

  useEffect(() => {
    if (!pollId || !user) return;

    const loadPoll = async () => {
      try {
        const data = await fetchPollById(pollId);
        if (!data) {
          toast.error("Poll not found");
          router.push("/home");
          return;
        }

        if (data.createdBy !== user.uid) {
          toast.error("You don't have permission to edit this poll");
          router.push("/home");
          return;
        }

        let loadedTitle = data.title || "";
        let loadedThemeId = data.themeId || "11111111-1111-1111-1111-111111111111";
        let loadedQuestions = data.questions?.map((q) => {
          const typeStr = String(q.type || "").toLowerCase();
          let qType = "MultipleChoice";
          if (q.type === 1 || q.type === "1" || typeStr === "wordcloud") {
            qType = "WordCloud";
          } else if (q.type === 2 || q.type === "2" || typeStr === "openended") {
            qType = "OpenEnded";
          } else if (q.type === 3 || q.type === "3" || typeStr === "ranking") {
            qType = "Ranking";
          } else if (q.type === 4 || q.type === "4" || typeStr === "content") {
            qType = "Content";
          }

          return {
            text: q.text || "",
            type: qType,
            visualization: q.visualization || "Bars",
            imageUrl: q.imageUrl || "",
            elements: q.elements || [],
            backgroundColor: q.backgroundColor || "#FFFFFF",
            backgroundImage: q.backgroundImage || "",
            showResponseCount: q.showResponseCount !== undefined ? q.showResponseCount : true,
            showPercentage: q.showPercentage !== undefined ? q.showPercentage : false,
            allowReactions: q.allowReactions !== undefined ? q.allowReactions : true,
            options:
              q.options?.map((o) =>
                typeof o === "string" ? { text: o, imageUrl: "" } : { text: o.text || "", imageUrl: o.imageUrl || "" }
              ) || (qType === "WordCloud" || qType === "OpenEnded" || qType === "Content" ? [] : [{ text: "", imageUrl: "" }, { text: "", imageUrl: "" }]),
          };
        }) || [{ text: "", type: "MultipleChoice", visualization: "Bars", imageUrl: "", showResponseCount: true, showPercentage: false, allowReactions: true, options: [{ text: "", imageUrl: "" }, { text: "", imageUrl: "" }] }];

        // Check if there is an unsaved localStorage draft
        try {
          const savedDraft = localStorage.getItem(STORAGE_KEY);
          if (savedDraft) {
            const parsed = JSON.parse(savedDraft);
            if (parsed.title) loadedTitle = parsed.title;
            if (parsed.questions?.length) loadedQuestions = parsed.questions;
            if (parsed.selectedThemeId) loadedThemeId = parsed.selectedThemeId;
          }
        } catch (e) {
          console.warn("Error restoring edit draft from localStorage", e);
        }

        setTitle(loadedTitle);
        setSelectedThemeId(loadedThemeId);
        setQuestions(loadedQuestions);
        setInitialSnapshot(JSON.stringify({ title: data.title || "", questions: loadedQuestions, selectedThemeId: data.themeId || "11111111-1111-1111-1111-111111111111" }));
        setIsLoaded(true);
      } catch (err) {
        console.error("Error loading poll:", err);
        toast.error("Failed to load poll");
      }
    };

    loadPoll();
  }, [pollId, user, router, fetchPollById]);

  // Persist edits to localStorage
  useEffect(() => {
    if (!pollId || !initialSnapshot || !isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ title, questions, selectedThemeId }));
    } catch (e) {
      console.warn("Error saving edit draft to localStorage", e);
    }
  }, [pollId, title, questions, selectedThemeId, initialSnapshot, isLoaded]);

  // Track if user made actual changes compared to initial state
  const currentSnapshot = JSON.stringify({ title, questions, selectedThemeId });
  const isDirty = initialSnapshot !== null && currentSnapshot !== initialSnapshot;

  const handleBack = () => {
    if (isDirty) {
      setShowUnsavedModal(true);
    } else {
      router.push("/home");
    }
  };

  const handleSavePoll = async (skipRedirect = false) => {
    let pollTitle = title.trim() || "Untitled Presentation";

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
        questionText = `Question ${i + 1}`;
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
          enableAudio: q.enableAudio || false,
          audioUrl: q.audioUrl ? q.audioUrl.trim() : null,
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
          enableAudio: q.enableAudio || false,
          audioUrl: q.audioUrl ? q.audioUrl.trim() : null,
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
      await savePoll(pollId, pollTitle, cleanedQuestions, selectedThemeId);

      // Clear localStorage draft on successful save
      localStorage.removeItem(STORAGE_KEY);

      toast.success("Poll saved!");
      if (!skipRedirect) {
        router.push("/home");
      }
      return true;
    } catch (err) {
      console.error("Error saving poll:", err, err.data || err.message);
      toast.error(err.data?.error || err.message || "Failed to save poll");
      return false;
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

  const themeDropdown = (
    <ThemeSelectorModal
      selectedThemeId={selectedThemeId}
      onSelectTheme={(id) => setSelectedThemeId(id)}
    />
  );

  return (
    <ProtectedRoute>
      <EditScreen
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
        onBack={handleBack}
        themeDropdown={themeDropdown}
        selectedThemeId={selectedThemeId}
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
          const success = await handleSavePoll(true);
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
