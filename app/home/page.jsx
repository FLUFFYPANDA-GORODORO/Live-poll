"use client";

import { useEffect, useState } from "react";
import { usePollStore } from "@/lib/store/usePollStore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { 
  Plus, 
  Upload, 
  ChevronRight,
  MoreVertical,
  Play,
  Share2,
  Edit,
  Copy,
  Download,
  Trash2,
  Sparkles
} from "lucide-react";

export default function HomeOutlet() {
  const router = useRouter();
  const { user } = useAuth();
  
  const {
    polls,
    loading,
    fetchPolls,
    deletePoll,
    restartPoll,
    createPoll,
    fetchPollById
  } = usePollStore();

  const [processingPoll, setProcessingPoll] = useState(null);

  useEffect(() => {
    if (user) fetchPolls(user.uid);
  }, [user, fetchPolls]);

  const recentWorks = (polls || []).slice(0, 4);

  const popularTemplates = [
    { title: "Lunar New Year: Symbols and...", category: "Culture" },
    { title: "How Much Do You Know...", category: "Quiz" },
    { title: "Matching Pairs Quiz", category: "Interactive" },
    { title: "Valentine Specials: The...", category: "Icebreaker" },
    { title: "Random Song Generator", category: "Fun" },
    { title: "LCP_Standards_Pilot_Modul...", category: "Education" },
  ];

  // Action Handlers
  const handleCreateNew = () => {
    router.push("/home/create");
  };

  const handleImportPoll = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const importData = JSON.parse(event.target.result);
          if (!importData || !Array.isArray(importData.questions)) {
            toast.error("Invalid JSON format. Must contain a 'questions' array.");
            return;
          }

          const cleanedQuestions = [];
          for (let i = 0; i < importData.questions.length; i++) {
            const q = importData.questions[i];
            if (!q.text || typeof q.text !== "string" || !q.text.trim()) {
              toast.error(`Question ${i + 1} is missing text`);
              return;
            }

            const isQWordCloud = q.type === "WordCloud" || q.type === 1 || String(q.type).toLowerCase() === "wordcloud" || !q.options || q.options.length === 0;

            if (isQWordCloud) {
              cleanedQuestions.push({
                text: q.text.trim(),
                type: "WordCloud",
                options: []
              });
            } else {
              if (!Array.isArray(q.options) || q.options.length < 2) {
                toast.error(`Question ${i + 1} needs at least 2 options`);
                return;
              }
              const validOptions = q.options
                .map(o => typeof o === "string" ? o.trim() : (o.text || "").trim())
                .filter(opt => opt !== "");

              if (validOptions.length < 2) {
                toast.error(`Question ${i + 1} needs at least 2 non-empty options`);
                return;
              }
              cleanedQuestions.push({
                text: q.text.trim(),
                type: "MultipleChoice",
                options: validOptions
              });
            }
          }

          const loadingToast = toast.loading("Importing poll...");
          const newPoll = await createPoll(
            importData.title?.trim() || "Imported Presentation",
            cleanedQuestions,
            importData.theme || "11111111-1111-1111-1111-111111111111"
          );

          await fetchPolls(user.uid);
          toast.dismiss(loadingToast);
          toast.success("Poll imported successfully!");

          if (newPoll && newPoll.id) {
            router.push(`/present/${newPoll.id}`);
          }
        } catch (err) {
          console.error("Error importing JSON:", err);
          toast.error("Failed to parse JSON file");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const getUserDisplayName = () => {
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  const formatRelativeTime = (date) => {
    if (!date) return "";
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);
    if (diff < 3600) return "Just now";
    if (diff < 86400) return "a day ago";
    if (diff < 172800) return "2 days ago";
    return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Welcome, <span className="text-[#6366F1]">{getUserDisplayName()}!</span>
        </h1>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#5558DD] text-white px-5 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New presentation
          </button>
          <button
            onClick={handleImportPoll}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer shadow-xs"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            Import
          </button>
        </div>
      </div>

      {/* Your Recent Works */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Your recent works</h2>
          <button
            onClick={() => router.push("/home/presentations")}
            className="text-sm font-semibold text-[#6366F1] hover:underline flex items-center gap-1"
          >
            View more <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {recentWorks.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50">
            <p className="text-slate-500 text-sm mb-3">No presentations created yet.</p>
            <button
              onClick={handleCreateNew}
              className="text-[#6366F1] font-semibold text-sm hover:underline"
            >
              Create your first presentation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {recentWorks.map((poll) => (
              <div
                key={poll.id}
                onClick={() => router.push(`/present/${poll.id}`)}
                className="group border border-slate-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                {/* Grey image placeholder container */}
                <div className="h-32 bg-slate-100 border-b border-slate-100 relative p-4 flex items-center justify-center">
                  <div className="w-full h-full bg-slate-200/70 rounded-lg flex items-center justify-center">
                    <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Presentation</span>
                  </div>
                </div>

                <div className="p-3.5">
                  <h3 className="font-bold text-slate-900 text-sm truncate group-hover:text-[#6366F1] transition-colors">
                    {poll.title || "Untitled Presentation"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatRelativeTime(poll.updatedAt || poll.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Explore Popular Templates */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Explore popular templates</h2>
          <button
            onClick={() => router.push("/home/presentations")}
            className="text-sm font-semibold text-[#6366F1] hover:underline flex items-center gap-1"
          >
            View more <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {popularTemplates.map((template, idx) => (
            <div
              key={idx}
              onClick={handleCreateNew}
              className="group border border-slate-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-all cursor-pointer flex flex-col"
            >
              {/* Grey image placeholder container */}
              <div className="h-24 bg-slate-100 border-b border-slate-100 flex items-center justify-center p-2">
                <div className="w-full h-full bg-slate-200/80 rounded-md flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div className="p-2.5">
                <h4 className="font-semibold text-slate-800 text-xs truncate group-hover:text-[#6366F1] transition-colors">
                  {template.title}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
