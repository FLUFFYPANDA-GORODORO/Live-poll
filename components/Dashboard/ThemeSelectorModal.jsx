"use client";

import { useState, useEffect } from "react";
import { usePollStore } from "@/lib/store/usePollStore";
import { useAuth } from "@/contexts/AuthContext";
import { Palette, Check, X, Loader2, Plus, HelpCircle, ChevronDown, Trash2, Sparkles, Pencil, ChevronLeft, Image as ImageIcon, Upload } from "lucide-react";
import toast from "react-hot-toast";
import MediaUploadModal from "@/components/MediaUploadModal";

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

function getLuminance(hexColor) {
  if (!hexColor || typeof hexColor !== "string" || !hexColor.startsWith("#")) return 0.5;
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function checkLowContrast(bgValue, bgType, textHex) {
  if (bgType === "image") return false;
  const bgLum = getLuminance(bgValue || "#0F172A");
  const isWhiteText = textHex === "#FFFFFF" || textHex === "#ffffff";
  const isBlackText = textHex === "#000000" || textHex === "#0f172a";

  if (bgLum > 0.5 && isWhiteText) return true;
  if (bgLum <= 0.5 && isBlackText) return true;

  return false;
}

function isThemeDark(t) {
  if (!t) return false;
  if (t.backgroundType === "image") return true;
  const bg = (t.backgroundValue && typeof t.backgroundValue === "string" && t.backgroundValue.trim().startsWith("#"))
    ? t.backgroundValue.trim()
    : "#F8FAFC";
  return getLuminance(bg) < 0.5;
}


export default function ThemeSelectorModal({ selectedThemeId, onSelectTheme, onPreviewTheme, initialTab }) {
  const { user } = useAuth();
  const { themes, palettes, fetchThemes, fetchPalettes, createTheme, updateTheme, deleteTheme } = usePollStore();

  const [activeTab, setActiveTab] = useState(initialTab || "themes");
  const [isCreating, setIsCreating] = useState(false);
  const [showBgImageInput, setShowBgImageInput] = useState(false);
  const [savedCustomThemeId, setSavedCustomThemeId] = useState(null);
  const [paletteDropdownOpen, setPaletteDropdownOpen] = useState(false);
  const [mediaModalConfig, setMediaModalConfig] = useState({ isOpen: false, target: null, initialUrl: "", title: "" });

  // New Custom Theme Form State
  const [name, setName] = useState("");
  const [backgroundType, setBackgroundType] = useState("color");
  const [backgroundValue, setBackgroundValue] = useState("#F8FAFC");
  const [mobileBackgroundValue, setMobileBackgroundValue] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [primaryTextColor, setPrimaryTextColor] = useState("#000000");
  const [secondaryTextColor, setSecondaryTextColor] = useState("#94A3B8");
  const [accentColor, setAccentColor] = useState("#6366F1");
  const [cardBackgroundColor, setCardBackgroundColor] = useState("#FFFFFF");
  const [paletteId, setPaletteId] = useState("palette_indigo_sunset");

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    fetchThemes(user?.uid);
    fetchPalettes();
  }, [user?.uid, fetchThemes, fetchPalettes]);

  // Real-time Live Preview Effect
  useEffect(() => {
    if (activeTab === "customise") {
      const matchedPalette = palettes.find((p) => p.id === paletteId);
      const paletteColors = matchedPalette?.colors || ["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6"];
      const draftTheme = {
        id: savedCustomThemeId || "draft_preview",
        name: name || "Draft Custom Theme",
        backgroundType,
        backgroundValue,
        mobileBackgroundValue,
        logoUrl,
        fontFamily,
        textColor: primaryTextColor,
        primaryTextColor,
        secondaryTextColor,
        accentColor,
        cardBackgroundColor,
        paletteId,
        palette: { colors: paletteColors },
        paletteColors,
      };
      onPreviewTheme?.(draftTheme);
    } else {
      onPreviewTheme?.(null);
    }
  }, [
    activeTab,
    backgroundType,
    backgroundValue,
    mobileBackgroundValue,
    logoUrl,
    fontFamily,
    primaryTextColor,
    secondaryTextColor,
    accentColor,
    cardBackgroundColor,
    paletteId,
    palettes,
    savedCustomThemeId,
    name,
    onPreviewTheme,
  ]);

  const customThemes = themes.filter((t) => !t.isPreset);
  const presetThemes = themes.filter((t) => t.isPreset);
  const displayPresets = presetThemes.length > 0 ? presetThemes : [DEFAULT_STANDARD_DARK];

  const handleStartCreateNew = () => {
    setSavedCustomThemeId(null);
    setName("");
    setBackgroundType("color");
    setBackgroundValue("#F8FAFC");
    setMobileBackgroundValue("");
    setLogoUrl("");
    setFontFamily("Inter");
    setPrimaryTextColor("#000000");
    setSecondaryTextColor("#94A3B8");
    setAccentColor("#6366F1");
    setCardBackgroundColor("#FFFFFF");
    setPaletteId("palette_indigo_sunset");
    setPaletteDropdownOpen(false);
    setActiveTab("customise");
  };

  const handleSelectCustomTheme = (t) => {
    onSelectTheme(t.id);
  };

  const handleEditCustomTheme = (t, e) => {
    if (e) e.stopPropagation();
    onSelectTheme(t.id);
    setSavedCustomThemeId(t.id);
    setName(t.name || "");
    setBackgroundType(t.backgroundType || "color");
    setBackgroundValue(t.backgroundValue || "#F8FAFC");
    setMobileBackgroundValue(t.mobileBackgroundValue || "");
    setLogoUrl(t.logoUrl || "");
    setFontFamily(t.fontFamily || "Inter");
    setPrimaryTextColor(t.primaryTextColor || t.textColor || "#000000");
    setSecondaryTextColor(t.secondaryTextColor || "#94A3B8");
    setAccentColor(t.accentColor || "#6366F1");
    setCardBackgroundColor(t.cardBackgroundColor || "#FFFFFF");
    setPaletteId(t.paletteId || "palette_indigo_sunset");
    setPaletteDropdownOpen(false);
    setActiveTab("customise");
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
      mobileBackgroundValue: mobileBackgroundValue.trim() || null,
      logoUrl: logoUrl.trim() || null,
      fontFamily,
      textColor: primaryTextColor,
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
      {/* ── TOP TABS: Themes & Customise (50-50 Full Width) ── */}
      <div className="w-full grid grid-cols-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("themes")}
          className={`pb-2.5 text-center text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === "themes"
              ? "text-slate-950 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-slate-950 after:rounded-t-full"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Themes
        </button>
        <button
          type="button"
          onClick={handleStartCreateNew}
          className={`pb-2.5 text-center text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === "customise"
              ? "text-slate-950 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-slate-950 after:rounded-t-full"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Customise
        </button>
      </div>

      {/* ── TAB 1: THEMES ── */}
      {activeTab === "themes" && (
        <div className="space-y-6 pt-1">
          {/* My Themes Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600">My Themes</h4>
              <button
                type="button"
                onClick={handleStartCreateNew}
                className="px-3 py-1 border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 rounded-md font-bold text-xs shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Create
              </button>
            </div>

            {customThemes.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 w-full">
                {customThemes.map((t) => {
                  const isSelected = selectedThemeId === t.id;
                  const colors = t.palette?.colors || ["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6"];
                  const isDark = isThemeDark(t);

                  return (
                    <div
                      key={t.id}
                      onClick={() => handleSelectCustomTheme(t)}
                      className={`rounded-md p-2.5 border cursor-pointer relative overflow-hidden transition-all h-26 flex flex-col justify-between shadow-2xs ${
                        isSelected
                          ? "border-2 border-slate-950 ring-2 ring-slate-950/10 shadow-md"
                          : "border-slate-300 hover:border-slate-400"
                      }`}
                      style={
                        t.backgroundType === "image"
                          ? { backgroundImage: `url('${t.backgroundValue}')`, backgroundSize: "cover", backgroundPosition: "center" }
                          : { backgroundColor: t.backgroundValue || "#F8FAFC" }
                      }
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className="text-xs font-bold truncate flex-1 min-w-0 drop-shadow-xs"
                          style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                          title={t.name}
                        >
                          {t.name}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-slate-950 text-white flex items-center justify-center shrink-0 shadow-xs">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleEditCustomTheme(t, e)}
                            className="p-1 rounded-md bg-white/80 hover:bg-white text-slate-700 hover:text-slate-950 transition-colors shrink-0 cursor-pointer border border-slate-200/80 shadow-2xs"
                            title="Edit theme"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTheme(t.id, e)}
                            className="p-1 rounded-md bg-white/80 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors shrink-0 cursor-pointer border border-slate-200/80 shadow-2xs"
                            title="Delete theme"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Mini Bar Chart Preview */}
                      <div className="h-8 flex items-end gap-1 px-0.5">
                        <div className="flex-1 rounded-t-xs" style={{ height: "60%", backgroundColor: colors[0] || "#6366F1" }} />
                        <div className="flex-1 rounded-t-xs" style={{ height: "100%", backgroundColor: colors[1] || "#EC4899" }} />
                        <div className="flex-1 rounded-t-xs" style={{ height: "75%", backgroundColor: colors[2] || "#10B981" }} />
                        <div className="flex-1 rounded-t-xs" style={{ height: "40%", backgroundColor: colors[3] || "#F59E0B" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                onClick={handleStartCreateNew}
                className="border-2 border-dashed border-slate-300 rounded-md p-4 text-center cursor-pointer hover:border-slate-950 hover:bg-slate-50/50 transition-all"
              >
                <p className="text-xs font-semibold text-slate-600">
                  No custom themes yet. Click <span className="text-slate-950 font-bold">+ Create</span> to build one!
                </p>
              </div>
            )}
          </div>

          <div className="border-b border-slate-200" />

          {/* Default Themes Section */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 mb-3">Default themes</h4>
            <div className="grid grid-cols-2 gap-3 w-full">
              {displayPresets.map((pt) => {
                const isSelected = (selectedThemeId || "11111111-1111-1111-1111-111111111111") === pt.id;
                const colors = pt.palette?.colors || pt.colors || ["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6"];
                const isDark = isThemeDark(pt);

                return (
                  <div
                    key={pt.id}
                    onClick={() => onSelectTheme(pt.id)}
                    className={`rounded-md p-2.5 border cursor-pointer relative overflow-hidden transition-all h-26 flex flex-col justify-between shadow-2xs ${
                      isSelected
                        ? "border-2 border-slate-950 ring-2 ring-slate-950/10 shadow-md"
                        : "border-slate-300 hover:border-slate-400"
                    }`}
                    style={
                      pt.backgroundType === "image"
                        ? { backgroundImage: `url('${pt.backgroundValue}')`, backgroundSize: "cover", backgroundPosition: "center" }
                        : { backgroundColor: pt.backgroundValue || "#0F172A" }
                    }
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className="text-xs font-bold truncate flex-1 min-w-0 drop-shadow-xs"
                        style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                        title={pt.name}
                      >
                        {pt.name}
                      </span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-slate-950 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    {/* Mini Bar Chart Preview */}
                    <div className="h-8 flex items-end gap-1 px-0.5">
                      <div className="flex-1 rounded-t-xs" style={{ height: "60%", backgroundColor: colors[0] || "#6366F1" }} />
                      <div className="flex-1 rounded-t-xs" style={{ height: "100%", backgroundColor: colors[1] || "#EC4899" }} />
                      <div className="flex-1 rounded-t-xs" style={{ height: "75%", backgroundColor: colors[2] || "#10B981" }} />
                      <div className="flex-1 rounded-t-xs" style={{ height: "40%", backgroundColor: colors[3] || "#F59E0B" }} />
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
          {/* Theme Name Row */}
          <div>
            <label className="font-bold text-slate-900 text-xs block mb-1.5">Theme Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Modern Sunset"
              className="w-full p-2 border border-slate-300 rounded-md text-xs font-medium outline-none focus:border-slate-950 text-slate-900 bg-white"
              required
            />
          </div>

          {/* Background Type & Value */}
          <div className="space-y-3 border-b border-slate-200 pb-4">
            {/* Background Header Row with Dark/Light style Toggle Switch */}
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 text-xs">Background</label>
              
              {/* Dark/Light style Toggle Switch */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500">
                  {backgroundType === "image" ? "Image" : "Color"}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={backgroundType === "image"}
                  onClick={() => {
                    const nextType = backgroundType === "image" ? "color" : "image";
                    setBackgroundType(nextType);
                    if (nextType === "color" && backgroundValue && !backgroundValue.startsWith("#")) {
                      setBackgroundValue("#F8FAFC");
                    }
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    backgroundType === "image" ? "bg-slate-950" : "bg-slate-300"
                  }`}
                  title="Toggle between Solid Color and Background Image"
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      backgroundType === "image" ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Solid Color Row (Clean Inline Layout with Custom Color Picker) */}
            <div className={`flex items-center justify-between py-1 transition-all ${
              backgroundType === "color" ? "opacity-100" : "opacity-40 pointer-events-none"
            }`}>
              <span className="text-xs font-bold text-slate-800">Solid Color</span>
              <div className="flex items-center gap-2">
                {/* Custom Color Picker Circle/Box Button matching text color picker */}
                <div
                  className="w-7 h-7 rounded-md border border-slate-300 flex items-center justify-center bg-white shadow-2xs relative transition-all cursor-pointer overflow-hidden hover:border-slate-400"
                  title="Solid Color Picker"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs"
                    style={{
                      background: "conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)"
                    }}
                  />
                  <input
                    type="color"
                    disabled={backgroundType !== "color"}
                    value={backgroundValue && backgroundValue.startsWith("#") ? backgroundValue : "#F8FAFC"}
                    onChange={(e) => setBackgroundValue(e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </div>

                <input
                  type="text"
                  disabled={backgroundType !== "color"}
                  value={backgroundValue && backgroundValue.startsWith("#") ? backgroundValue : "#F8FAFC"}
                  onChange={(e) => setBackgroundValue(e.target.value)}
                  className="w-20 p-1 border border-slate-300 rounded-md text-xs text-center font-mono text-slate-900 bg-white"
                />
              </div>
            </div>

            {/* Background Image Row (Clean Inline Layout matching screenshot) */}
            <div className={`space-y-3 transition-all ${
              backgroundType === "image" ? "opacity-100" : "opacity-40 pointer-events-none"
            }`}>
              {/* Desktop Background */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Desktop background</span>
                    <span className="text-[10px] text-slate-500">16:9 / Landscape presentation view</span>
                  </div>

                  <button
                    type="button"
                    disabled={backgroundType !== "image"}
                    onClick={() =>
                      setMediaModalConfig({
                        isOpen: true,
                        target: "desktopBg",
                        initialUrl: backgroundValue.startsWith("#") ? "" : backgroundValue,
                        title: "Desktop Background Image",
                      })
                    }
                    className="px-3 py-1 border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-md shadow-2xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>

                {/* Show attached desktop image info / preview card if image URL exists */}
                {backgroundType === "image" && backgroundValue && !backgroundValue.startsWith("#") && (
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate max-w-[190px]">
                      <img
                        src={backgroundValue}
                        alt="Desktop Background"
                        className="w-7 h-7 rounded-md object-cover border border-slate-200 shrink-0"
                      />
                      <span className="truncate text-[11px] font-semibold text-slate-700" title={backgroundValue}>
                        {backgroundValue.split("/").pop() || "Desktop Background"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setMediaModalConfig({
                            isOpen: true,
                            target: "desktopBg",
                            initialUrl: backgroundValue,
                            title: "Desktop Background Image",
                          })
                        }
                        className="p-1 text-slate-500 hover:text-slate-900 rounded-md transition-colors cursor-pointer"
                        title="Edit desktop image"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setBackgroundValue("#F8FAFC")}
                        className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors cursor-pointer"
                        title="Remove desktop image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Background */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Mobile background</span>
                    <span className="text-[10px] text-slate-500">Portrait wallpaper for participant phones</span>
                  </div>

                  <button
                    type="button"
                    disabled={backgroundType !== "image"}
                    onClick={() =>
                      setMediaModalConfig({
                        isOpen: true,
                        target: "mobileBg",
                        initialUrl: mobileBackgroundValue || "",
                        title: "Mobile Background Image",
                      })
                    }
                    className="px-3 py-1 border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-md shadow-2xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>

                {/* Show attached mobile image info / preview card if image URL exists */}
                {backgroundType === "image" && Boolean(mobileBackgroundValue?.trim()) && (
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate max-w-[190px]">
                      <img
                        src={mobileBackgroundValue}
                        alt="Mobile Background"
                        className="w-7 h-7 rounded-md object-cover border border-slate-200 shrink-0"
                      />
                      <span className="truncate text-[11px] font-semibold text-slate-700" title={mobileBackgroundValue}>
                        {mobileBackgroundValue.split("/").pop() || "Mobile Background"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setMediaModalConfig({
                            isOpen: true,
                            target: "mobileBg",
                            initialUrl: mobileBackgroundValue,
                            title: "Mobile Background Image",
                          })
                        }
                        className="p-1 text-slate-500 hover:text-slate-900 rounded-md transition-colors cursor-pointer"
                        title="Edit mobile image"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileBackgroundValue("")}
                        className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors cursor-pointer"
                        title="Remove mobile image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Theme Logo Section */}
          <div className="space-y-2 border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Theme Logo</span>

              <button
                type="button"
                onClick={() =>
                  setMediaModalConfig({
                    isOpen: true,
                    target: "logo",
                    initialUrl: logoUrl,
                    title: "Theme Logo Image",
                  })
                }
                className="px-3 py-1 border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-md shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {/* Attached Logo Preview Card */}
            {Boolean(logoUrl?.trim()) && (
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between text-xs mt-2">
                <div className="flex items-center gap-2 truncate max-w-[190px]">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-7 h-7 rounded-md object-contain border border-slate-200 bg-white p-0.5 shrink-0"
                  />
                  <span className="truncate text-[11px] font-semibold text-slate-700" title={logoUrl}>
                    {logoUrl.split("/").pop() || "Logo Image"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setMediaModalConfig({
                        isOpen: true,
                        target: "logo",
                        initialUrl: logoUrl,
                        title: "Theme Logo Image",
                      })
                    }
                    className="p-1 text-slate-500 hover:text-slate-900 rounded-md transition-colors cursor-pointer"
                    title="Edit logo"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors cursor-pointer"
                    title="Remove logo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Text & Typography Section */}
          <div className="space-y-3 border-b border-slate-200 pb-4">
            {/* Font Family Row */}
            <div className="flex items-center justify-between gap-2">
              <label className="font-bold text-slate-900 text-xs shrink-0">Font Family</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="p-1.5 border border-slate-300 rounded-md text-xs font-semibold bg-white outline-none cursor-pointer min-w-[130px]"
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Outfit">Outfit</option>
                <option value="Epilogue">Epilogue</option>
                <option value="Libre Baskerville">Libre Baskerville</option>
                <option value="Plus Jakarta Sans">Plus Jakarta</option>
              </select>
            </div>

            {/* Text Color Row */}
            <div className="flex items-center justify-between gap-2">
              <label className="font-bold text-slate-900 text-xs shrink-0">Text Color</label>
              
              <div className="flex items-center gap-2">
                {/* White Text Circle Button */}
                <button
                  type="button"
                  onClick={() => {
                    setPrimaryTextColor("#FFFFFF");
                    setSecondaryTextColor("#FFFFFF");
                  }}
                  className={`w-7 h-7 rounded-md border flex items-center justify-center bg-white shadow-2xs transition-all cursor-pointer ${
                    primaryTextColor === "#FFFFFF" || primaryTextColor === "#ffffff"
                      ? "border-slate-950 ring-2 ring-slate-950/10 font-bold"
                      : "border-slate-300 hover:border-slate-400"
                  }`}
                  title="White Text"
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-white border border-slate-300 shadow-xs" />
                </button>

                {/* Black Text Circle Button */}
                <button
                  type="button"
                  onClick={() => {
                    setPrimaryTextColor("#000000");
                    setSecondaryTextColor("#000000");
                  }}
                  className={`w-7 h-7 rounded-md border flex items-center justify-center bg-white shadow-2xs transition-all cursor-pointer ${
                    primaryTextColor === "#000000" || primaryTextColor === "#0f172a"
                      ? "border-slate-950 ring-2 ring-slate-950/10 font-bold"
                      : "border-slate-300 hover:border-slate-400"
                  }`}
                  title="Black Text"
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-slate-900 shadow-xs" />
                </button>

                {/* Custom Color Picker Button */}
                <div
                  className={`w-7 h-7 rounded-md border flex items-center justify-center bg-white shadow-2xs relative transition-all cursor-pointer overflow-hidden ${
                    primaryTextColor !== "#FFFFFF" && primaryTextColor !== "#ffffff" && primaryTextColor !== "#000000" && primaryTextColor !== "#0f172a"
                      ? "border-slate-950 ring-2 ring-slate-950/10 font-bold"
                      : "border-slate-300 hover:border-slate-400"
                  }`}
                  title="Custom Text Color Palette"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs"
                    style={{
                      background: primaryTextColor && primaryTextColor !== "#FFFFFF" && primaryTextColor !== "#000000"
                        ? primaryTextColor
                        : "conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)"
                    }}
                  />
                  <input
                    type="color"
                    value={primaryTextColor && primaryTextColor.startsWith("#") ? primaryTextColor : "#6366F1"}
                    onChange={(e) => {
                      setPrimaryTextColor(e.target.value);
                      setSecondaryTextColor(e.target.value);
                    }}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Readability Callout Alert Box (Only shown on low contrast) */}
            {checkLowContrast(backgroundValue, backgroundType, primaryTextColor) && (
              <div className="p-3 bg-orange-50 border border-orange-200/80 rounded-xl flex items-start gap-2.5 animate-fade-in">
                <span className="w-4 h-4 rounded-full border border-orange-500 text-orange-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  !
                </span>
                <p className="text-xs text-orange-950 font-medium leading-snug">
                  For readability, make sure there is a clear contrast between text colour and base colour.
                </p>
              </div>
            )}
          </div>

          {/* Visualization Palette Custom Dropdown */}
          <div className="space-y-2 border-b border-slate-100 pb-3 relative">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 text-xs flex items-center gap-1">
                Visualisation colours <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
              </label>
            </div>

            {/* Custom Dropdown Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setPaletteDropdownOpen(!paletteDropdownOpen)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white hover:border-slate-400 flex items-center justify-between gap-2 shadow-2xs transition-all cursor-pointer text-left"
              >
                {(() => {
                  const selectedPalette = palettes.find((p) => p.id === paletteId) || palettes[0];
                  const colors = selectedPalette?.colors || ["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6"];
                  return (
                    <>
                      <span className="text-slate-900 truncate font-medium flex-1">
                        {selectedPalette?.name || "Select palette"}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {colors.slice(0, 5).map((c, i) => (
                          <span
                            key={i}
                            className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10 shadow-2xs"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                        <ChevronDown className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
                      </div>
                    </>
                  );
                })()}
              </button>

              {/* Dropdown Menu */}
              {paletteDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setPaletteDropdownOpen(false)}
                  />
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-1 space-y-1">
                    {palettes.map((p) => {
                      const isSelected = p.id === paletteId;
                      const colors = p.colors || ["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6"];

                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setPaletteId(p.id);
                            setPaletteDropdownOpen(false);
                          }}
                          className={`w-full px-2.5 py-2 rounded-md text-xs font-medium flex items-center justify-between gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-slate-100 text-slate-950 font-bold"
                              : "hover:bg-slate-50 text-slate-700 hover:text-slate-950"
                          }`}
                        >
                          <span className="truncate flex-1 text-left">
                            {p.name}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {colors.slice(0, 5).map((c, i) => (
                              <span
                                key={i}
                                className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10 shadow-2xs"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isCreating}
              className="w-full py-2.5 rounded-md bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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

      {/* Media Upload Modal for Background and Logo Images */}
      <MediaUploadModal
        isOpen={mediaModalConfig.isOpen}
        onClose={() => setMediaModalConfig({ isOpen: false, target: null, initialUrl: "", title: "" })}
        initialUrl={mediaModalConfig.initialUrl}
        title={mediaModalConfig.title}
        type="image"
        onSelectUrl={(url) => {
          if (mediaModalConfig.target === "desktopBg") setBackgroundValue(url);
          else if (mediaModalConfig.target === "mobileBg") setMobileBackgroundValue(url);
          else if (mediaModalConfig.target === "logo") setLogoUrl(url);
        }}
      />
    </div>
  );
}
