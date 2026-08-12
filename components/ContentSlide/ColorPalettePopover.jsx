"use client";

import React, { useState } from "react";
import { Pipette } from "lucide-react";

const PALETTE_GRID = [
  // Row 1
  { letter: "q", color: "transparent" },
  { letter: "w", color: "#FFFFFF" },
  { letter: "e", color: "#334155" },
  { letter: "r", color: "#1E293B" },
  { letter: "t", color: "#78350F" },
  // Row 2
  { letter: "a", color: "#0891B2" },
  { letter: "s", color: "#2563EB" },
  { letter: "d", color: "#4F46E5" },
  { letter: "f", color: "#9333EA" },
  { letter: "g", color: "#BE185D" },
  // Row 3
  { letter: "z", color: "#16A34A" },
  { letter: "x", color: "#059669" },
  { letter: "c", color: "#D97706" },
  { letter: "v", color: "#EA580C" },
  { letter: "b", color: "#DC2626" },
];

// Helper to generate 5 shades of a hex color
function generateShades(hexColor) {
  if (!hexColor || hexColor === "transparent") return null;
  let hex = hexColor.replace("#", "");
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  if (hex.length !== 6) return null;

  const num = parseInt(hex, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;

  const shades = [];
  const factors = [0.65, 0.8, 1, 1.15, 1.3]; // Lighter to darker factors
  factors.forEach((f) => {
    let nr = Math.min(255, Math.max(0, Math.round(r * f)));
    let ng = Math.min(255, Math.max(0, Math.round(g * f)));
    let nb = Math.min(255, Math.max(0, Math.round(b * f)));
    const sHex = "#" + ((1 << 24) + (nr << 16) + (ng << 8) + nb).toString(16).slice(1);
    shades.push(sHex);
  });
  return shades;
}

export default function ColorPalettePopover({
  selectedColor = "#1E293B",
  onSelectColor,
  showTransparent = true,
  onClose,
}) {
  const [hexInput, setHexInput] = useState(
    selectedColor === "transparent" ? "1e1e1e" : selectedColor.replace("#", "")
  );

  const shades = generateShades(selectedColor);

  const handleHexChange = (val) => {
    setHexInput(val);
    const cleaned = val.replace("#", "").trim();
    if (cleaned.length === 6 || cleaned.length === 3) {
      onSelectColor?.(`#${cleaned}`);
    }
  };

  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      className="bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-3 w-[215px] max-w-full text-xs font-sans animate-fade-in z-50 select-none text-left"
    >
      {/* ── COLORS SECTION ── */}
      <div className="mb-3">
        <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Colors</label>
        <div className="grid grid-cols-5 gap-1.5">
          {PALETTE_GRID.map((item) => {
            if (item.color === "transparent" && !showTransparent) return null;
            const isSelected = selectedColor === item.color;
            const isDark = item.color === "#1E293B" || item.color === "#334155" || item.color === "#78350F" || item.color === "#4F46E5" || item.color === "#9333EA" || item.color === "#BE185D" || item.color === "#059669" || item.color === "#DC2626";

            return (
              <button
                key={item.letter}
                type="button"
                onClick={() => {
                  onSelectColor?.(item.color);
                  if (item.color !== "transparent") setHexInput(item.color.replace("#", ""));
                }}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center relative transition-all cursor-pointer overflow-hidden ${
                  isSelected
                    ? "ring-2 ring-indigo-600 ring-offset-1 border-transparent scale-105"
                    : "border-slate-200 hover:scale-105 shadow-2xs"
                }`}
                style={{ backgroundColor: item.color === "transparent" ? "#FFFFFF" : item.color }}
              >
                {item.color === "transparent" ? (
                  <span className="text-[10px] font-extrabold text-slate-400">ø</span>
                ) : null}
                <span
                  className={`absolute text-[9px] font-bold ${
                    item.color === "transparent" || item.color === "#FFFFFF"
                      ? "text-slate-500"
                      : isDark
                      ? "text-white/80"
                      : "text-slate-800/80"
                  }`}
                >
                  {item.letter}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SHADES SECTION ── */}
      <div className="mb-3">
        <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Shades</label>
        {shades ? (
          <div className="flex items-center gap-1 justify-between">
            {shades.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onSelectColor?.(s);
                  setHexInput(s.replace("#", ""));
                }}
                className={`w-7 h-7 rounded-md border transition-all cursor-pointer hover:scale-105 ${
                  selectedColor.toLowerCase() === s.toLowerCase()
                    ? "ring-2 ring-indigo-600 ring-offset-1 border-transparent scale-105"
                    : "border-slate-200"
                }`}
                style={{ backgroundColor: s }}
              />
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-[10px] font-medium py-0.5">
            No shades available for this color
          </p>
        )}
      </div>

      {/* ── HEX CODE & EYEDROPPER SECTION ── */}
      <div>
        <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Hex code</label>
        <div className="border border-slate-200/90 rounded-lg bg-slate-50/70 px-2 py-1 flex items-center justify-between focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
          <div className="flex items-center gap-1.5 font-mono font-bold text-slate-700 text-[11px]">
            <span className="text-slate-400">#</span>
            <input
              type="text"
              value={hexInput}
              onChange={(e) => handleHexChange(e.target.value)}
              className="bg-transparent focus:outline-none w-20 uppercase tracking-wider text-[11px]"
            />
          </div>

          <label className="relative cursor-pointer hover:bg-slate-200/80 p-1 rounded transition-colors flex items-center justify-center">
            <Pipette className="w-3.5 h-3.5 text-slate-600" />
            <input
              type="color"
              value={selectedColor.startsWith("#") ? selectedColor : "#6366F1"}
              onChange={(e) => {
                const newColor = e.target.value;
                onSelectColor?.(newColor);
                setHexInput(newColor.replace("#", ""));
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
