"use client";

import { useState } from "react";
import { usePollStore } from "@/lib/store/usePollStore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import toast from "react-hot-toast";
import StandardEdit from "@/components/Themes/StandardEdit";
import ThemeSelectorModal from "@/components/Dashboard/ThemeSelectorModal";
import { generateContentSlideSnapshot } from "@/lib/canvasSnapshot";
import { api } from "@/lib/api";

export default function CreatePoll() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([
    {
      text: "",
      type: "MultipleChoice",
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

  const handleCreatePoll = async (redirectPath = "present", skipRedirect = false) => {
    if (!user) {
      toast.error("Please log in to create a poll");
      router.push("/login");
      return false;
    }

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
              : { text: (opt.text || "").trim(), imageUrl: opt.imageUrl ? opt.imageUrl.trim() : null },
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

      const pollId = await createPoll(title.trim(), cleanedQuestions, selectedThemeId);

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
        themeDropdown={themeDropdown}
        selectedThemeId={selectedThemeId}
        isCreateMode={true}
      />
    </ProtectedRoute>
  );
}
