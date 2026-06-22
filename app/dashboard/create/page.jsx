"use client";

import { useState } from "react";
import { usePollStore } from "@/lib/store/usePollStore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import toast from "react-hot-toast";

import StandardCreate from "@/components/Themes/StandardCreate";

export default function CreatePoll() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([{ text: "", type: "MultipleChoice", options: ["", ""] }]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState("standard");
  const [enableBidding, setEnableBidding] = useState(false);
  const [skillCost, setSkillCost] = useState(20);

  const { createPoll, isSaving } = usePollStore();

  // Create poll handler
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

    // Append suffix to title when sending to backend
    let titleWithSuffix = title.trim();
    if (selectedTheme === "synergy_sphere") {
      titleWithSuffix = `${titleWithSuffix} ~SS`;
    } else if (selectedTheme === "masterclass") {
      titleWithSuffix = `${titleWithSuffix} ~MC`;
    }

    const cleanedQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        toast.error(`Please enter text for Question ${i + 1}`);
        setActiveQuestionIndex(i);
        return;
      }
      if (q.type === "WordCloud") {
        cleanedQuestions.push({ ...q, options: [] });
      } else {
        const validOptions = q.options.filter((opt) => opt.trim() !== "");
        if (validOptions.length < 2) {
          toast.error(`Question ${i + 1} needs at least 2 options`);
          setActiveQuestionIndex(i);
          return;
        }
        cleanedQuestions.push({ ...q, options: validOptions });
      }
    }

    try {
      // Send title to API with suffix to persist theme
      const actualSkillCost = enableBidding ? skillCost : 0;
      const pollId = await createPoll(titleWithSuffix, cleanedQuestions, selectedTheme, actualSkillCost);

      toast.success("Poll created successfully!");
      if (redirectPath === "dashboard") {
        router.push("/dashboard");
      } else {
        router.push(`/present/${pollId}?theme=${selectedTheme}`);
      }
    } catch (err) {
      console.error("Error creating poll:", err);
      toast.error("Failed to create poll");
    }
  };

  // Shared Theme Dropdown component
  const themeDropdown = (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label htmlFor="theme-select" className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Theme:
        </label>
        <select
          id="theme-select"
          value={selectedTheme}
          onChange={(e) => {
            setSelectedTheme(e.target.value);
            // Auto-enable bidding for themed polls
            if (e.target.value === "synergy_sphere" || e.target.value === "masterclass") {
              setEnableBidding(true);
            } else {
              setEnableBidding(false);
            }
          }}
          className="bg-white border border-slate-300 rounded px-2 py-1 text-sm font-semibold focus:outline-none focus:border-slate-500 text-slate-700"
        >
          <option value="standard">Standard</option>
          <option value="synergy_sphere">Synergy Sphere</option>
          <option value="masterclass">Masterclass</option>
        </select>
      </div>

      {/* Bidding Config — only for themed polls */}
      {(selectedTheme === "synergy_sphere" || selectedTheme === "masterclass") && (
        <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enableBidding}
              onChange={(e) => setEnableBidding(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Skill Bidding
            </span>
          </label>
          {enableBidding && (
            <div className="flex items-center gap-2">
              <label htmlFor="skill-cost" className="text-xs text-slate-400">
                Cost per skill:
              </label>
              <input
                id="skill-cost"
                type="number"
                min={5}
                max={100}
                value={skillCost}
                onChange={(e) => setSkillCost(Math.max(5, Math.min(100, parseInt(e.target.value) || 20)))}
                className="w-20 px-2 py-1 text-sm border border-slate-300 rounded text-slate-700 font-semibold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400">
                (max picks: {Math.floor(100 / skillCost)})
              </span>
            </div>
          )}
        </div>
      )}
    </div>
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
        theme={selectedTheme}
      />
    </ProtectedRoute>
  );
}
