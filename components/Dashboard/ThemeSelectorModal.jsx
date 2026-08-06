"use client";

import { useState, useEffect } from "react";
import { usePollStore } from "@/lib/store/usePollStore";
import { useAuth } from "@/contexts/AuthContext";
import { Palette, Check, X, Loader2, Plus, HelpCircle, ChevronDown, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const DEFAULT_STANDARD_DARK = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Standard Dark",
  backgroundType: "color",
  backgroundValue: "#0F172A",
  cardBackgroundColor: "#0F172A",
  primaryTextColor: "#FFFFFF",
  secondaryTextColor: "#94A3B8",
  accentColor: "#6366F1",
  palette: { colors: ["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6"] },
  isPreset: true,
};

export default function ThemeSelectorModal({ selectedThemeId, onSelectTheme }) {
  const { user } = useAuth();
  const { themes, palettes, fetchThemes, fetchPalettes, createTheme, updateTheme, deleteTheme } = usePollStore();

  const [activeTab, setActiveTab] = useState("themes"); // "themes" or "customise"
  const [isCreating, setIsCreating] = useState(false);
  const [showBgImageInput, setShowBgImageInput] = useState(false);
  const [savedCustomThemeId, setSavedCustomThemeId] = useState(null);

  // New Custom Theme Form State
  const [name, setName] = useState("");
  const [backgroundType, setBackgroundType] = useState("color");
  const [backgroundValue, setBackgroundValue] = useState("#F8FAFC");
  const [logoUrl, setLogoUrl] = useState("");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [primaryTextColor, setPrimaryTextColor] = useState("#000000");
  const [secondaryTextColor, setSecondaryTextColor] = useState("#94A3B8");
  const [accentColor, setAccentColor] = useState("#6366F1");
  const [cardBackgroundColor, setCardBackgroundColor] = useState("#FFFFFF");
  const [paletteId, setPaletteId] = useState("palette_indigo_sunset");

  useEffect(() => {
    fetchThemes(user?.uid);
    fetchPalettes();
  }, [user?.uid, fetchThemes, fetchPalettes]);

  const customThemes = themes.filter((t) => !t.isPreset);
  const presetThemes = themes.filter((t) => t.isPreset);
  const displayPresets = presetThemes.length > 0 ? presetThemes : [DEFAULT_STANDARD_DARK];

  const handleStartCreateNew = () => {
    setSavedCustomThemeId(null);
    setName("");
    setBackgroundType("color");
    setBackgroundValue("#F8FAFC");
    setLogoUrl("");
    setFontFamily("Inter");
    setPrimaryTextColor("#000000");
    setSecondaryTextColor("#94A3B8");
    setAccentColor("#6366F1");
    setCardBackgroundColor("#FFFFFF");
    setPaletteId("palette_indigo_sunset");
    setActiveTab("customise");
  };

  const handleSelectCustomTheme = (t) => {
    onSelectTheme(t.id);
    setSavedCustomThemeId(t.id);
    setName(t.name || "");
    setBackgroundType(t.backgroundType || "color");
    setBackgroundValue(t.backgroundValue || "#F8FAFC");
    setLogoUrl(t.logoUrl || "");
    setFontFamily(t.fontFamily || "Inter");
    setPrimaryTextColor(t.primaryTextColor || "#000000");
    setSecondaryTextColor(t.secondaryTextColor || "#94A3B8");
    setAccentColor(t.accentColor || "#6366F1");
    setCardBackgroundColor(t.cardBackgroundColor || "#FFFFFF");
    setPaletteId(t.paletteId || "palette_indigo_sunset");
  };

  const handleDeleteTheme = async (themeId, e) => {
    if (e) e.stopPropagation();
    try {
      await deleteTheme(themeId, user?.uid || "admin");
      toast.success("Theme deleted!");
      if (selectedThemeId === themeId) {
        onSelectTheme("11111111-1111-1111-1111-111111111111");
      }
      if (savedCustomThemeId === themeId) {
        setSavedCustomThemeId(null);
      }
    } catch (err) {
      console.error("Error deleting theme:", err);
      toast.error("Failed to delete theme");
    }
  };

  const handleSaveTheme = async (e) => {
    if (e) e.preventDefault();
    const themeName = name.trim() || `Custom Theme ${customThemes.length + 1}`;
    const payload = {
      name: themeName,
      backgroundType,
      backgroundValue: backgroundValue.trim(),
      logoUrl: logoUrl.trim() || null,
      fontFamily,
      primaryTextColor,
      secondaryTextColor,
      accentColor,
      cardBackgroundColor,
      paletteId,
    };

    try {
      setIsCreating(true);
      let targetTheme;
      if (savedCustomThemeId) {
        targetTheme = await updateTheme(savedCustomThemeId, user?.uid || "admin", payload);
        toast.success("Custom Theme updated & applied!");
      } else {
        targetTheme = await createTheme(user?.uid || "admin", payload);
        setSavedCustomThemeId(targetTheme.id);
        toast.success("Custom Theme created & applied!");
      }
      onSelectTheme(targetTheme.id);
      setActiveTab("themes");
    } catch (err) {
      console.error("Error saving theme:", err);
      toast.error("Failed to save theme");
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetDefault = () => {
    onSelectTheme("11111111-1111-1111-1111-111111111111");
    toast.success("Reset to default theme");
  };

  return (
    <div className="w-full flex flex-col space-y-4 text-slate-800">
      {/* ── Top Header Tabs: Themes | Customise ── */}
      <div className="flex items-center border-b border-slate-200 w-full">
        <button
          type="button"
          onClick={() => setActiveTab("themes")}
          className={`flex-1 pb-2.5 text-center text-sm font-bold transition-all relative cursor-pointer ${
            activeTab === "themes" ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Themes
          {activeTab === "themes" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("customise")}
          className={`flex-1 pb-2.5 text-center text-sm font-bold transition-all relative cursor-pointer ${
            activeTab === "customise" ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Customise
          {activeTab === "customise" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
      </div>

      {/* ── TAB 1: THEMES ── */}
      {activeTab === "themes" && (
        <div className="space-y-5">
          {/* My Themes Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-slate-800">My Themes</h4>
              <button
                type="button"
                onClick={handleStartCreateNew}
                className="px-3 py-1 border border-slate-300 rounded-md font-semibold text-xs text-slate-800 hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Create
              </button>
            </div>

            {customThemes.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 w-full">
                {customThemes.map((t) => {
                  const isSelected = selectedThemeId === t.id;
                  const colors = t.palette?.colors || ["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6"];
                  const isDark = t.primaryTextColor === "#FFFFFF";

                  return (
                    <div
                      key={t.id}
                      onClick={() => handleSelectCustomTheme(t)}
                      className={`rounded-xl p-2.5 border cursor-pointer relative overflow-hidden transition-all h-24 flex flex-col justify-between shadow-2xs ${
                        isSelected
                          ? "border-2 border-indigo-600 ring-2 ring-indigo-500/20 shadow-md scale-[1.02]"
                          : "border-slate-200 hover:border-slate-400"
                      }`}
                      style={
                        t.backgroundType === "image"
                          ? { backgroundImage: `url('${t.backgroundValue}')`, backgroundSize: "cover" }
                          : { backgroundColor: t.backgroundValue || "#F8FAFC" }
                      }
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold truncate ${
                            isDark ? "text-white" : "text-slate-800"
                          }`}
                        >
                          {t.name}
                        </span>
                        <div className="flex items-center gap-1">
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTheme(t.id, e)}
                            className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50/80 transition-colors shrink-0 cursor-pointer"
                            title="Delete theme"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Mini Bar Chart Preview */}
                      <div className="h-8 flex items-end gap-1 px-1">
                        <div className="flex-1 rounded-t-sm" style={{ height: "60%", backgroundColor: colors[0] || "#6366F1" }} />
                        <div className="flex-1 rounded-t-sm" style={{ height: "100%", backgroundColor: colors[1] || "#EC4899" }} />
                        <div className="flex-1 rounded-t-sm" style={{ height: "75%", backgroundColor: colors[2] || "#10B981" }} />
                        <div className="flex-1 rounded-t-sm" style={{ height: "40%", backgroundColor: colors[3] || "#F59E0B" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                onClick={handleStartCreateNew}
                className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center cursor-pointer hover:border-indigo-300 hover:bg-slate-50/50 transition-all"
              >
                <p className="text-xs font-semibold text-slate-500">
                  No custom themes yet. Click <span className="text-indigo-600 font-bold">+ Create</span> to build one!
                </p>
              </div>
            )}
          </div>

          <div className="border-b border-slate-200" />

          {/* Default Themes Section */}
          <div>
            <h4 className="font-bold text-sm text-slate-800 mb-3">Default themes</h4>
            <div className="grid grid-cols-2 gap-3 w-full">
              {displayPresets.map((pt) => {
                const isSelected = (selectedThemeId || "11111111-1111-1111-1111-111111111111") === pt.id;
                const colors = pt.palette?.colors || pt.colors || ["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6"];
                const isDark = pt.primaryTextColor === "#FFFFFF" || pt.textColor === "#FFFFFF" || pt.backgroundValue === "#0F172A" || pt.backgroundValue === "#18181B";

                return (
                  <div
                    key={pt.id}
                    onClick={() => onSelectTheme(pt.id)}
                    className={`rounded-xl p-3 border cursor-pointer relative overflow-hidden transition-all h-24 flex flex-col justify-between shadow-2xs ${
                      isSelected
                        ? "border-2 border-indigo-600 ring-2 ring-indigo-500/20 shadow-md scale-[1.02]"
                        : "border-slate-200/90 hover:border-slate-400"
                    }`}
                    style={
                      pt.backgroundType === "image"
                        ? { backgroundImage: `url('${pt.backgroundValue}')`, backgroundSize: "cover" }
                        : { backgroundColor: pt.backgroundValue || "#0F172A" }
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold truncate ${isDark ? "text-white" : "text-slate-800"}`}>
                        {pt.name}
                      </span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>

                    {/* Mini Bar Chart Preview */}
                    <div className="h-8 flex items-end gap-1.5 px-0.5">
                      <div className="flex-1 rounded-t-sm" style={{ height: "60%", backgroundColor: colors[0] || "#6366F1" }} />
                      <div className="flex-1 rounded-t-sm" style={{ height: "100%", backgroundColor: colors[1] || "#EC4899" }} />
                      <div className="flex-1 rounded-t-sm" style={{ height: "75%", backgroundColor: colors[2] || "#10B981" }} />
                      <div className="flex-1 rounded-t-sm" style={{ height: "40%", backgroundColor: colors[3] || "#F59E0B" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: CUSTOMISE ── */}
      {activeTab === "customise" && (
        <form onSubmit={handleSaveTheme} className="space-y-4 text-xs font-medium">
          {/* Theme Name */}
          <div>
            <label className="font-bold text-slate-700 text-xs block mb-1">Theme Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Modern Sunset"
              className="w-full p-2 border border-slate-300 rounded-md text-xs font-medium outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Background Type & Value */}
          <div className="space-y-2 border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 text-xs">Background</label>
              <select
                value={backgroundType}
                onChange={(e) => setBackgroundType(e.target.value)}
                className="p-1.5 border border-slate-300 rounded-md text-xs font-semibold bg-white outline-none cursor-pointer"
              >
                <option value="color">Solid Hex Color</option>
                <option value="image">Background Image URL</option>
              </select>
            </div>
            {backgroundType === "image" ? (
              <input
                type="text"
                value={backgroundValue}
                onChange={(e) => setBackgroundValue(e.target.value)}
                placeholder="https://example.com/bg.jpg"
                className="w-full p-2 border border-slate-300 rounded-md text-xs outline-none focus:ring-1 focus:ring-indigo-500"
              />
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">Hex Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={backgroundValue.startsWith("#") ? backgroundValue : "#F8FAFC"}
                    onChange={(e) => setBackgroundValue(e.target.value)}
                    className="w-7 h-7 rounded-md border border-slate-300 cursor-pointer overflow-hidden p-0"
                  />
                  <input
                    type="text"
                    value={backgroundValue}
                    onChange={(e) => setBackgroundValue(e.target.value)}
                    className="w-20 p-1 border border-slate-300 rounded-md text-xs text-center font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Theme Logo URL */}
          <div className="border-b border-slate-100 pb-3">
            <label className="font-bold text-slate-700 text-xs block mb-1">Logo URL (Optional)</label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full p-2 border border-slate-300 rounded-md text-xs outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Font Family */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <label className="font-bold text-slate-700 text-xs">Font Family</label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="p-1.5 border border-slate-300 rounded-md text-xs font-semibold bg-white outline-none cursor-pointer"
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Outfit">Outfit</option>
              <option value="Epilogue">Epilogue</option>
              <option value="Libre Baskerville">Libre Baskerville</option>
              <option value="Plus Jakarta Sans">Plus Jakarta</option>
            </select>
          </div>

          {/* Theme Colors Grid */}
          <div className="space-y-2 border-b border-slate-100 pb-3">
            <label className="font-bold text-slate-700 text-xs block">Theme Colors</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-md">
                <span className="text-[11px] font-semibold text-slate-600">Primary Text</span>
                <input
                  type="color"
                  value={primaryTextColor}
                  onChange={(e) => setPrimaryTextColor(e.target.value)}
                  className="w-6 h-6 rounded-full border border-slate-300 cursor-pointer overflow-hidden p-0"
                />
              </div>

              <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-md">
                <span className="text-[11px] font-semibold text-slate-600">Secondary Text</span>
                <input
                  type="color"
                  value={secondaryTextColor}
                  onChange={(e) => setSecondaryTextColor(e.target.value)}
                  className="w-6 h-6 rounded-full border border-slate-300 cursor-pointer overflow-hidden p-0"
                />
              </div>

              <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-md">
                <span className="text-[11px] font-semibold text-slate-600">Accent</span>
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-6 h-6 rounded-full border border-slate-300 cursor-pointer overflow-hidden p-0"
                />
              </div>

              <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-md">
                <span className="text-[11px] font-semibold text-slate-600">Card Background</span>
                <input
                  type="color"
                  value={cardBackgroundColor}
                  onChange={(e) => setCardBackgroundColor(e.target.value)}
                  className="w-6 h-6 rounded-full border border-slate-300 cursor-pointer overflow-hidden p-0"
                />
              </div>
            </div>
          </div>

          {/* Visualization Palette */}
          <div className="space-y-2 border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 text-xs flex items-center gap-1">
                Visualisation Palette <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
              </label>
            </div>
            <select
              value={paletteId}
              onChange={(e) => setPaletteId(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md text-xs font-semibold bg-white outline-none cursor-pointer"
            >
              {palettes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isCreating}
              className="w-full py-2.5 rounded-md bg-[#6366F1] hover:bg-[#5558DD] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {savedCustomThemeId ? "Update Custom Theme" : "Save & Apply Custom Theme"}
            </button>

            <button
              type="button"
              onClick={handleResetDefault}
              className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer py-1 block"
            >
              Reset to default
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
