"use client";

import { useState } from "react";
import { usePollStore } from "@/lib/store/usePollStore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import toast from "react-hot-toast";
import StandardCreate from "@/components/Themes/StandardCreate";
import ThemeSelectorModal from "@/components/Dashboard/ThemeSelectorModal";

export default function CreatePoll() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([
    { text: "", type: "MultipleChoice", visualization: "Bars", imageUrl: "", options: [{ text: "", imageUrl: "" }, { text: "", imageUrl: "" }] },
  ]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [selectedThemeId, setSelectedThemeId] = useState("11111111-1111-1111-1111-111111111111");

  const { createPoll, isSaving } = usePollStore();

  const handleCreatePoll = async (redirectPath = "present") => {
    if (!user) {
      toast.error("Please log in to create a poll");
      router.push("/login");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a poll title");
      return;
    }

    const cleanedQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        toast.error(`Please enter text for Question ${i + 1}`);
        setActiveQuestionIndex(i);
        return;
      }
      if (q.type === "WordCloud" || q.type === "OpenEnded") {
        cleanedQuestions.push({
          text: q.text.trim(),
          type: q.type,
          visualization: q.visualization || null,
          imageUrl: q.imageUrl ? q.imageUrl.trim() : null,
          options: [],
        });
      } else {
        const validOptions = q.options.filter((opt) =>
          typeof opt === "string" ? opt.trim() !== "" : (opt.text || "").trim() !== "",
        );
        if (validOptions.length < 2) {
          toast.error(`Question ${i + 1} needs at least 2 options`);
          setActiveQuestionIndex(i);
          return;
        }
        cleanedQuestions.push({
          text: q.text.trim(),
          type: q.type,
          visualization: q.visualization || null,
          imageUrl: q.imageUrl ? q.imageUrl.trim() : null,
          options: validOptions.map((opt) =>
            typeof opt === "string"
              ? { text: opt.trim(), imageUrl: null }
              : { text: (opt.text || "").trim(), imageUrl: opt.imageUrl ? opt.imageUrl.trim() : null },
          ),
        });
      }
    }

    try {
      const pollId = await createPoll(title.trim(), cleanedQuestions, selectedThemeId);

      toast.success("Poll created successfully!");
      if (redirectPath === "dashboard") {
        router.push("/home");
      } else {
        router.push(`/present/${pollId}`);
      }
    } catch (err) {
      console.error("Error creating poll:", err);
      toast.error("Failed to create poll");
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
      <StandardCreate
        title={title}
        setTitle={setTitle}
        questions={questions}
        setQuestions={setQuestions}
        activeQuestionIndex={activeQuestionIndex}
        setActiveQuestionIndex={setActiveQuestionIndex}
        isSaving={isSaving}
        handleCreatePoll={handleCreatePoll}
        router={router}
        themeDropdown={themeDropdown}
      />
    </ProtectedRoute>
  );
}
