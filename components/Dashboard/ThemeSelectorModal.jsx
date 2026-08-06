"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePollStore } from "@/lib/store/usePollStore";
import { useAuth } from "@/contexts/AuthContext";
import { Palette, Check, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ThemeSelectorModal({ selectedThemeId, onSelectTheme }) {
  const { user } = useAuth();
  const { themes, palettes, fetchThemes, fetchPalettes, createTheme } = usePollStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [mounted, setMounted] = useState(false);

  // New Theme Form State
  const [name, setName] = useState("");
  const [backgroundType, setBackgroundType] = useState("color");
  const [backgroundValue, setBackgroundValue] = useState("#F8FAFC");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [primaryTextColor, setPrimaryTextColor] = useState("#000000");
  const [secondaryTextColor, setSecondaryTextColor] = useState("#FFFFFF");
  const [accentColor, setAccentColor] = useState("#6366F1");
  const [cardBackgroundColor, setCardBackgroundColor] = useState("#FFFFFF");
  const [paletteId, setPaletteId] = useState("palette_indigo_sunset");

  useEffect(() => {
    setMounted(true);
    fetchThemes(user?.uid);
    fetchPalettes();
  }, [user?.uid, fetchThemes, fetchPalettes]);

  const handleSaveTheme = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a theme name");
      return;
    }

    try {
      setIsCreating(true);
      const newTheme = await createTheme(user?.uid || "admin", {
        name: name.trim(),
        backgroundType,
        backgroundValue: backgroundValue.trim(),
        fontFamily,
        primaryTextColor,
        secondaryTextColor,
        accentColor,
        cardBackgroundColor,
        paletteId,
      });

      toast.success("Theme created!");
      onSelectTheme(newTheme.id);
      setIsOpen(false);
    } catch (err) {
      console.error("Error creating theme:", err);
      toast.error("Failed to create theme");
    } finally {
      setIsCreating(false);
    }
  };

  const modalJSX = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-slate-900"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto relative z-[100000]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Palette className="w-5 h-5 text-[var(--color-primary)]" />
            Create Custom Theme
          </h3>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveTheme} className="space-y-4 text-sm">
          <div>
            <label className="block font-semibold mb-1">Theme Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Modern Sunset"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Background Type</label>
              <select
                value={backgroundType}
                onChange={(e) => setBackgroundType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none"
              >
                <option value="color">Solid Hex Color</option>
                <option value="image">Background Image URL</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">
                {backgroundType === "image" ? "Image URL" : "Hex Color"}
              </label>
              <input
                type="text"
                value={backgroundValue}
                onChange={(e) => setBackgroundValue(e.target.value)}
                placeholder={backgroundType === "image" ? "https://..." : "#F8FAFC"}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Font Family</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none"
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Outfit">Outfit</option>
                <option value="Epilogue">Epilogue</option>
                <option value="Libre Baskerville">Libre Baskerville</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Color Palette</label>
              <select
                value={paletteId}
                onChange={(e) => setPaletteId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none"
              >
                {palettes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Primary Text Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryTextColor}
                  onChange={(e) => setPrimaryTextColor(e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryTextColor}
                  onChange={(e) => setPrimaryTextColor(e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Card Background</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={cardBackgroundColor}
                  onChange={(e) => setCardBackgroundColor(e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={cardBackgroundColor}
                  onChange={(e) => setCardBackgroundColor(e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Secondary Text Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryTextColor}
                  onChange={(e) => setSecondaryTextColor(e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={secondaryTextColor}
                  onChange={(e) => setSecondaryTextColor(e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-lg border text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:opacity-90 disabled:opacity-50"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Custom Theme
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Selected Theme
        </label>
        <select
          value={selectedThemeId || "11111111-1111-1111-1111-111111111111"}
          onChange={(e) => onSelectTheme(e.target.value)}
          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20 text-slate-800 truncate"
        >
          {themes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} {t.isPreset ? "(Preset)" : "(Custom)"}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#6366F1] font-semibold text-xs transition-colors cursor-pointer"
      >
        <Palette className="w-4 h-4" />
        Customize & Create Theme
      </button>

      {isOpen && mounted && createPortal(modalJSX, document.body)}
    </div>
  );
}
