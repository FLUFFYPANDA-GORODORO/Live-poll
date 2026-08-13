"use client";

import { useEffect, useState } from "react";
import { usePollStore } from "@/lib/store/usePollStore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Sparkles,
  Loader2,
  Eye,
  MoreHorizontal,
  X,
} from "lucide-react";

export default function TemplatesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [usingId, setUsingId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const {
    templates,
    loading,
    fetchTemplates,
    fetchPolls,
    useTemplate,
  } = usePollStore();

  useEffect(() => {
    if (user) {
      fetchTemplates(user.uid);
    }
  }, [user, fetchTemplates]);

  const handleUseTemplate = async (template) => {
    if (!user) return;
    try {
      setUsingId(template.id);
      const loadingToast = toast.loading(`Creating poll from "${template.title}"...`);
      const result = await useTemplate(
        template.id,
        user.uid,
        user.email,
        user.displayName
      );
      await fetchPolls(user.uid);
      toast.dismiss(loadingToast);
      toast.success("Created presentation from template!");
      if (result?.id) {
        router.push(`/home/edit/${result.id}`);
      }
    } catch (err) {
      console.error("Error using template:", err);
      toast.error("Failed to create presentation from template");
    } finally {
      setUsingId(null);
    }
  };

  // Extract unique categories from fetched templates
  const categories = [
    "All",
    ...Array.from(new Set((templates || []).map((t) => t.category).filter(Boolean))),
  ];

  // Filter templates based on category & search query
  const filteredTemplates = (templates || []).filter((template) => {
    const matchesCategory =
      selectedCategory === "All" ||
      template.category?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      !searchQuery.trim() ||
      template.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Template card colors for visual variety matching home page
  const templateColors = [
    "#7B2FF2",
    "#10B981",
    "#3B82F6",
    "#F59E0B",
    "#EC4899",
    "#6366F1",
    "#14B8A6",
    "#F97316",
    "#8B5CF6",
    "#EF4444",
  ];

  return (
    <div className="min-h-screen -m-6 md:-m-8 bg-slate-50 overflow-y-auto">
      {/* Main Content */}
      <main className="w-full px-8 md:px-10 py-8">
        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Loading Skeletons */}
        {loading && (!templates || templates.length === 0) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="w-full h-[165px] rounded-2xl bg-slate-200/70 animate-pulse"
              />
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-12 text-center max-w-md mx-auto my-12">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No templates found</h3>
            <p className="text-sm text-slate-500 mb-6">
              Try adjusting your search query or selecting a different category.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Templates Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4.5">
            {filteredTemplates.map((template) => {
              const imageUrl = "https://res.cloudinary.com/dkhxnyat4/image/upload/v1786174032/polls/images/aesthetic-wallpaper-1_imvlrb.jpg";
              const isProcessing = usingId === template.id;
              const slideCount = template.questions?.length || template.slidesCount || Math.floor(Math.random() * 6) + 5;
              const isMenuOpen = openMenuId === template.id;

              return (
                <div
                  key={template.id}
                  className={`group w-full h-[155px] flex flex-col justify-between rounded-md bg-white border border-slate-300 hover:border-slate-400 hover:shadow-md transition-all ${
                    isMenuOpen ? "z-50 relative" : "z-10 relative"
                  }`}
                >
                  {/* Top Image Portion */}
                  <div className="h-[105px] w-full relative overflow-hidden rounded-t-md bg-slate-100 shrink-0">
                    <img
                      src={imageUrl}
                      alt={template.title || "Template Preview"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Top Left Category Badge */}
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-white text-[9px] font-semibold uppercase tracking-wider z-10">
                      {template.category || "General"}
                    </span>

                    {/* Top Right 3-Dots Action Button */}
                    <div className="absolute top-2.5 right-2.5 z-20">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(isMenuOpen ? null : template.id);
                        }}
                        className="p-1 rounded-md bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer backdrop-blur-xs"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <div className="absolute right-0 top-7 bg-white rounded-md shadow-2xl border border-slate-300 py-1.5 z-50 min-w-[140px] text-xs font-medium text-slate-800 animate-in fade-in zoom-in-95 duration-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              toast("Template preview", { icon: "👀" });
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 w-full hover:bg-slate-100 text-slate-800 font-semibold cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" /> Preview
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              !isProcessing && handleUseTemplate(template);
                            }}
                            disabled={isProcessing}
                            className="flex items-center gap-2 px-3 py-1.5 w-full hover:bg-indigo-50 text-indigo-700 font-bold cursor-pointer"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            )}
                            <span>Get template</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Text Portion */}
                  <div className="px-3 py-2 border-t border-slate-200 bg-white shrink-0 rounded-b-md">
                    <p className="text-xs font-bold text-slate-900 truncate leading-tight" title={template.title}>
                      {template.title || "Untitled Template"}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-none font-medium">
                      {slideCount} slides
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
