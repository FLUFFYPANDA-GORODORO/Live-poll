"use client";

import { useEffect, useState } from "react";
import { usePollStore } from "@/lib/store/usePollStore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { getThemeStyles } from "@/lib/themeHelper";
import {
  Plus,
  Upload,
  ChevronRight,
  ArrowRight,
  MoreHorizontal,
  Trash2,
  RotateCcw,
  X,
} from "lucide-react";

export default function HomeOutlet() {
  const router = useRouter();
  const { user } = useAuth();
  const [openMenuId, setOpenMenuId] = useState(null);

  const {
    polls,
    loading,
    templates,
    fetchPolls,
    fetchTemplates,
    deletePoll,
    restartPoll,
    createPoll,
    useTemplate,
  } = usePollStore();

  useEffect(() => {
    if (user) {
      fetchPolls(user.uid);
      fetchTemplates(user.uid);
    }
  }, [user, fetchPolls, fetchTemplates]);

  const getUserDisplayName = () => {
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split("@")[0];
    return "Creator";
  };

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
            toast.error(
              "Invalid JSON format. Must contain a 'questions' array."
            );
            return;
          }

          const cleanedQuestions = [];
          for (let i = 0; i < importData.questions.length; i++) {
            const q = importData.questions[i];
            if (!q.text || typeof q.text !== "string" || !q.text.trim()) {
              toast.error(`Question ${i + 1} is missing text`);
              return;
            }

            const isQWordCloud =
              q.type === "WordCloud" ||
              q.type === 1 ||
              String(q.type).toLowerCase() === "wordcloud" ||
              !q.options ||
              q.options.length === 0;

            if (isQWordCloud) {
              cleanedQuestions.push({
                text: q.text.trim(),
                type: "WordCloud",
                options: [],
              });
            } else {
              if (!Array.isArray(q.options) || q.options.length < 2) {
                toast.error(`Question ${i + 1} needs at least 2 options`);
                return;
              }
              const validOptions = q.options
                .map((o) =>
                  typeof o === "string" ? o.trim() : (o.text || "").trim()
                )
                .filter((opt) => opt !== "");

              if (validOptions.length < 2) {
                toast.error(
                  `Question ${i + 1} needs at least 2 non-empty options`
                );
                return;
              }
              cleanedQuestions.push({
                text: q.text.trim(),
                type: "MultipleChoice",
                options: validOptions,
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

  const handleUseTemplate = async (template) => {
    try {
      const loadingToast = toast.loading("Creating from template...");
      const result = await useTemplate(
        template.id,
        user.uid,
        user.email,
        user.displayName
      );
      await fetchPolls(user.uid);
      toast.dismiss(loadingToast);
      toast.success("Created from template!");
      if (result?.id) {
        router.push(`/home/edit/${result.id}`);
      }
    } catch (err) {
      toast.error("Failed to create from template");
    }
  };

  const formatRelativeTime = (date) => {
    if (!date) return "";
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);
    if (diff < 3600) return "Just now";
    if (diff < 86400) return "a day ago";
    if (diff < 172800) return "2 days ago";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleDeletePoll = async (e, pollId) => {
    e.stopPropagation();
    setOpenMenuId(null);
    if (!confirm("Delete this presentation?")) return;
    try {
      await deletePoll(pollId);
      toast.success("Deleted!");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleRestartPoll = async (e, pollId) => {
    e.stopPropagation();
    setOpenMenuId(null);
    try {
      await restartPoll(pollId);
      toast.success("Restarted!");
    } catch {
      toast.error("Failed to restart");
    }
  };

  // Template card colors for visual variety
  const templateColors = [
    "#7B2FF2", "#10B981", "#3B82F6", "#F59E0B", "#EC4899", "#6366F1",
    "#14B8A6", "#F97316", "#8B5CF6", "#EF4444",
  ];

  // Mini bar chart SVG for poll preview thumbnails
  const PollPreviewBars = () => (
    <div className="w-full h-full flex items-end justify-center gap-[3px] px-3 pb-2">
      <div className="w-3 bg-indigo-400/90 rounded-t-sm" style={{ height: "55%" }} />
      <div className="w-3 bg-pink-400/90 rounded-t-sm" style={{ height: "80%" }} />
      <div className="w-3 bg-emerald-400/90 rounded-t-sm" style={{ height: "35%" }} />
      <div className="w-3 bg-amber-400/80 rounded-t-sm" style={{ height: "65%" }} />
    </div>
  );

  return (
    <div
      className="min-h-screen -m-6 md:-m-8"
      style={{
        background: `
          radial-gradient(circle at 0% 0%, rgba(51, 65, 85, 0.22), transparent 50%),
          radial-gradient(circle at 100% 0%, rgba(71, 85, 105, 0.18), transparent 50%),
          linear-gradient(to bottom, rgba(241, 245, 249, 0.95), #ffffff 75%)
        `,
      }}
    >
      {/* ── Hero Heading ── */}
      <div className="flex flex-col items-center pt-14 pb-6 px-6">
        <h1 className="text-3xl md:text-[42px] font-bold tracking-tight text-center leading-tight text-slate-900">
          Welcome, {getUserDisplayName()} !
        </h1>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 mt-7">
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-7 py-3 rounded-md font-semibold text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            New presentation
          </button>
          <button
            onClick={handleImportPoll}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-7 py-3 rounded-md font-semibold text-sm shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-700" />
            Import presentation
          </button>
        </div>
      </div>

      {/* ── Content area (seamless from gradient) ── */}
      <div className="px-8 md:px-10 pb-16">

        {/* ── Continue Designing / My Polls (Only shown if polls exist or loading) ── */}
        {(loading || (polls && polls.length > 0)) && (
          <section className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Continue editing
              </h2>
              {polls?.length > 0 && (
                <button
                  onClick={() => router.push("/home/presentations")}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  See all
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-5 gap-4.5 w-full">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-full h-[155px] rounded-xl bg-slate-100 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-4.5 w-full">
                {(polls || []).slice(0, 5).map((poll) => {
                  // Compute exact theme styles for this poll
                  const themeStyles = getThemeStyles(poll.theme);
                  const isImageTheme = poll.theme?.backgroundType === "image" && Boolean(poll.theme?.backgroundValue);
                  const barColor1 = themeStyles.paletteColors[0] || "#6366F1";
                  const barColor2 = themeStyles.paletteColors[1] || themeStyles.paletteColors[0] || "#818CF8";

                  return (
                    <div
                      key={poll.id}
                      onClick={() => router.push(`/home/edit/${poll.id}`)}
                      className={`group w-full h-[155px] flex flex-col justify-between rounded-md bg-white border border-slate-300 hover:border-slate-400 hover:shadow-md transition-all cursor-pointer ${
                        openMenuId === poll.id ? "z-50 relative" : "z-10 relative"
                      }`}
                    >
                      {/* More Menu (High z-index z-50 so popover isn't clipped) */}
                      <div className="absolute top-1.5 right-1.5 z-40">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === poll.id ? null : poll.id);
                          }}
                          className="p-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer shadow-xs"
                        >
                          {openMenuId === poll.id ? (
                            <X className="w-3.5 h-3.5" />
                          ) : (
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {openMenuId === poll.id && (
                          <div className="absolute right-0 top-7 bg-white rounded-md shadow-2xl border border-slate-300 py-1.5 z-50 min-w-[160px] text-xs font-medium text-slate-800 animate-in fade-in zoom-in-95 duration-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                router.push(`/present/${poll.id}`);
                              }}
                              className="flex items-center gap-2 px-3.5 py-1.5 w-full hover:bg-slate-100 text-emerald-700 font-bold cursor-pointer"
                            >
                              <ArrowRight className="w-3.5 h-3.5" /> Present
                            </button>
                            <button
                              onClick={(e) => handleRestartPoll(e, poll.id)}
                              className="flex items-center gap-2 px-3.5 py-1.5 w-full hover:bg-slate-100 text-slate-800 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> Restart
                            </button>
                            <button
                              onClick={(e) => handleDeletePoll(e, poll.id)}
                              className="flex items-center gap-2 px-3.5 py-1.5 w-full hover:bg-red-50 text-red-600 font-bold cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Thumbnail preview */}
                      <div
                        className="h-[105px] flex items-end justify-end gap-2.5 pl-12 pr-4 relative rounded-t-md overflow-hidden shrink-0"
                        style={themeStyles.backgroundStyle}
                      >
                        {/* Custom Theme Logo or default RapidPolls mark */}
                        {themeStyles.logoUrl ? (
                          <img
                            src={themeStyles.logoUrl}
                            alt="Theme Logo"
                            className="absolute top-2.5 left-3 max-h-4 max-w-[60px] object-contain drop-shadow-sm opacity-90 select-none z-10"
                          />
                        ) : (
                          <img
                            src="/RapidPolls.png"
                            alt="RapidPolls"
                            className="absolute top-2.5 left-3 h-3 w-auto object-contain opacity-50 select-none z-10 filter drop-shadow-sm"
                          />
                        )}

                        {/* Bars rendered ONLY if not an image background theme */}
                        {!isImageTheme && (
                          <>
                            <div
                              className="w-14 rounded-t-xs shadow-2xs transition-colors"
                              style={{ height: "42px", backgroundColor: barColor1 }}
                            />
                            <div
                              className="w-14 rounded-t-xs shadow-2xs transition-colors"
                              style={{ height: "70px", backgroundColor: barColor2 }}
                            />
                          </>
                        )}
                      </div>

                      {/* Compact Poll title + timestamp footer */}
                      <div className="px-3 py-2 border-t border-slate-200 bg-white shrink-0 rounded-b-md">
                        <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                          {poll.title || "Untitled"}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-none font-medium">
                          Edited{" "}
                          {formatRelativeTime(poll.updatedAt || poll.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Templates Section ── */}
        {templates && templates.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              Templates
            </h2>

            <div className="grid grid-cols-5 gap-4.5 w-full">
              {templates.slice(0, 5).map((template, idx) => {
                const bgColor = templateColors[idx % templateColors.length];
                const themeData = template.theme;
                const hasThemeBg =
                  themeData?.backgroundType === "image" &&
                  themeData?.backgroundValue;

                return (
                  <div
                    key={template.id}
                    onClick={() => handleUseTemplate(template)}
                    className="w-full h-[155px] rounded-xl overflow-hidden cursor-pointer group relative transition-all hover:-translate-y-1 hover:shadow-xl"
                    style={{ backgroundColor: bgColor }}
                  >
                    {/* Card content */}
                    <div className="p-4 flex flex-col h-full relative z-10">
                      <div className="flex-1">
                        <p className="text-white font-bold text-sm leading-snug max-w-[170px]">
                          {template.title || "Untitled Template"}
                          <span className="inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="w-3.5 h-3.5 inline" />
                          </span>
                        </p>
                        {template.description && (
                          <p className="text-white/70 text-[11px] mt-1 line-clamp-2">
                            {template.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-auto">
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-semibold">
                          {template.category || "General"}
                        </span>
                      </div>
                    </div>

                    {hasThemeBg && (
                      <div className="absolute bottom-2 right-2 w-16 h-12 rounded-md overflow-hidden shadow-lg opacity-80 group-hover:opacity-100 transition-opacity border border-white/20">
                        <img
                          src={themeData.backgroundValue}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
