"use client";

import { useState, useEffect } from "react";
import { usePollStore } from "@/lib/store/usePollStore";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import EditScreen from "@/components/Themes/StandardEdit";
import ThemeSelectorModal from "@/components/Dashboard/ThemeSelectorModal";
import { generateContentSlideSnapshot } from "@/lib/canvasSnapshot";
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

        setTitle(data.title || "");
        setSelectedThemeId(data.themeId || "11111111-1111-1111-1111-111111111111");

        setQuestions(
          data.questions?.map((q) => {
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
          }) || [{ text: "", type: "MultipleChoice", visualization: "Bars", imageUrl: "", showResponseCount: true, showPercentage: false, allowReactions: true, options: [{ text: "", imageUrl: "" }, { text: "", imageUrl: "" }] }]
        );
      } catch (err) {
        console.error("Error loading poll:", err);
        toast.error("Failed to load poll");
      }
    };

    loadPoll();
  }, [pollId, user, router, fetchPollById]);

  const handleSavePoll = async (skipRedirect = false) => {
    if (!title.trim()) {
      toast.error("Please enter a poll title before saving");
      return false;
    }

    const cleanedQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        toast.error(`Please enter text for Question ${i + 1}`);
        setActiveQuestionIndex(i);
        return false;
      }
      if (q.type === "WordCloud" || q.type === "OpenEnded" || q.type === "Content") {
        cleanedQuestions.push({
          text: q.text.trim(),
          type: q.type,
          visualization: q.visualization || null,
          imageUrl: (q.imageUrl || q.snapshotUrl || "").trim() || null,
          elements: q.elements || [],
          backgroundColor: q.backgroundColor || "#FFFFFF",
          backgroundImage: q.backgroundImage || "",
          showResponseCount: q.showResponseCount !== undefined ? q.showResponseCount : true,
          showPercentage: q.showPercentage !== undefined ? q.showPercentage : false,
          allowReactions: q.allowReactions !== undefined ? q.allowReactions : true,
          options: [],
        });
      } else {
        const validOptions = q.options.filter((opt) =>
          typeof opt === "string" ? opt.trim() !== "" : (opt.text || "").trim() !== "",
        );
        if (validOptions.length < 2) {
          toast.error(`Question ${i + 1} needs at least 2 options`);
          setActiveQuestionIndex(i);
          return false;
        }
        cleanedQuestions.push({
          text: q.text.trim(),
          type: q.type,
          visualization: q.visualization || null,
          imageUrl: q.imageUrl ? q.imageUrl.trim() : null,
          showResponseCount: q.showResponseCount !== undefined ? q.showResponseCount : true,
          showPercentage: q.showPercentage !== undefined ? q.showPercentage : false,
          allowReactions: q.allowReactions !== undefined ? q.allowReactions : true,
          options: validOptions.map((opt) =>
            typeof opt === "string"
              ? { text: opt.trim(), imageUrl: null }
              : { text: (opt.text || "").trim(), imageUrl: opt.imageUrl ? opt.imageUrl.trim() : null }
          ),
        });
      }
    }

    try {
      // Auto-generate & upload Cloudinary snapshots for Content slides if needed
      for (let i = 0; i < cleanedQuestions.length; i++) {
        const q = cleanedQuestions[i];
        if (q.type === "Content" && (!q.imageUrl || !q.imageUrl.startsWith("http"))) {
          try {
            const dataUrl = await generateContentSlideSnapshot(q);
            if (dataUrl) {
              const res = await fetch(dataUrl);
              const blob = await res.blob();
              const file = new File([blob], `slide-${Date.now()}.png`, { type: "image/png" });
              const uploadRes = await api.uploadImage(file, "polls/slides");
              if (uploadRes?.url) {
                q.imageUrl = uploadRes.url;
              } else {
                q.imageUrl = dataUrl;
              }
            }
          } catch (snapErr) {
            console.warn("Auto snapshot upload warning:", snapErr);
          }
        }
      }

      await savePoll(pollId, title.trim(), cleanedQuestions, selectedThemeId);
      toast.success("Poll saved!");
      if (!skipRedirect) {
        router.push("/home");
      }
      return true;
    } catch (err) {
      console.error("Error saving poll:", err);
      toast.error("Failed to save poll");
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
        themeDropdown={themeDropdown}
        selectedThemeId={selectedThemeId}
      />
    </ProtectedRoute>
  );
}
