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
} from "lucide-react";

export default function TemplatesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [usingId, setUsingId] = useState(null);

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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {filteredTemplates.map((template, idx) => {
              const bgColor = templateColors[idx % templateColors.length];
              const themeData = template.theme;
              const hasThemeBg =
                themeData?.backgroundType === "image" &&
                themeData?.backgroundValue;
              const isProcessing = usingId === template.id;

              return (
                <div
                  key={template.id}
                  onClick={() => !isProcessing && handleUseTemplate(template)}
                  className="w-full h-[165px] rounded-2xl overflow-hidden cursor-pointer group relative transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between"
                  style={{ backgroundColor: bgColor }}
                >
                  {/* Card Header & Content */}
                  <div className="p-4 flex flex-col h-full relative z-10">
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm leading-snug max-w-[170px]">
                        {template.title || "Untitled Template"}
                        <span className="inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowRight className="w-3.5 h-3.5 inline" />
                        </span>
                      </p>
                      {template.description && (
                        <p className="text-white/75 text-[11px] mt-1.5 line-clamp-2 leading-tight font-normal">
                          {template.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white text-[9px] font-semibold tracking-wide">
                        {template.category || "General"}
                      </span>

                      {isProcessing && (
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      )}
                    </div>
                  </div>

                  {/* Optional Theme Image Overlay Thumbnail */}
                  {hasThemeBg && (
                    <div className="absolute bottom-2 right-2 w-16 h-12 rounded-lg overflow-hidden shadow-lg opacity-80 group-hover:opacity-100 transition-opacity border border-white/20 pointer-events-none">
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
        )}
      </main>
    </div>
  );
}
