"use client";

import React, { useState } from "react";
import ColorPalettePopover from "@/components/ContentSlide/ColorPalettePopover";
import {
  Copy,
  Trash2,
  Lock,
  Unlock,
  ChevronsDown,
  ChevronDown,
  ChevronUp,
  ChevronsUp,
  Square,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Pencil,
  Type,
  Code2
} from "lucide-react";

const STROKE_COLORS = [
  "#1E293B", // Black / Dark
  "#EF4444", // Red
  "#22C55E", // Green
  "#3B82F6", // Blue
  "#F97316", // Orange
  "#0F172A", // Dark Slate
];

const BG_COLORS = [
  "transparent", // Transparent / Checkerboard
  "#FEE2E2", // Soft Pink
  "#DCFCE7", // Soft Green
  "#E0F2FE", // Soft Blue
  "#FEF3C7", // Soft Yellow
  "#FFFFFF", // White
];

export default function ExcalidrawStylePanel({ question, onChange, selectedElementId }) {
  const [activeColorPopover, setActiveColorPopover] = useState(null); // 'stroke' | 'background' | null
  const elements = question?.elements || [];

  // Find selected element based on selectedElementId, or fallback to first element
  const selectedElement = (selectedElementId ? elements.find((el) => el.id === selectedElementId) : null) || elements[0] || null;

  if (!selectedElement) {
    return (
      <div className="text-center py-8 text-slate-400 text-xs font-semibold">
        Select an element on the canvas to customize its style
      </div>
    );
  }

  const updateSelectedElement = (updates) => {
    const updatedElements = elements.map((el) => {
      if (el.id === selectedElement.id) {
        return { ...el, ...updates };
      }
      return el;
    });
    onChange({ ...question, elements: updatedElements });
  };

  // Move layers
  const moveLayer = (direction) => {
    const idx = elements.findIndex((el) => el.id === selectedElement.id);
    if (idx === -1) return;
    const newElements = [...elements];
    const item = newElements.splice(idx, 1)[0];

    if (direction === "back") {
      newElements.unshift(item);
    } else if (direction === "backward") {
      newElements.splice(Math.max(0, idx - 1), 0, item);
    } else if (direction === "forward") {
      newElements.splice(Math.min(newElements.length, idx + 1), 0, item);
    } else if (direction === "front") {
      newElements.push(item);
    }
    onChange({ ...question, elements: newElements });
  };

  // Duplicate
  const handleDuplicate = () => {
    const dup = {
      ...selectedElement,
      id: `elem-${Date.now()}`,
      x: (selectedElement.x || 100) + 20,
      y: (selectedElement.y || 100) + 20,
    };
    onChange({ ...question, elements: [...elements, dup] });
  };

  // Delete
  const handleDelete = () => {
    const remaining = elements.filter((el) => el.id !== selectedElement.id);
    onChange({ ...question, elements: remaining });
  };

  const isTextElement = selectedElement.type === "text" || (selectedElement.text !== undefined && selectedElement.type !== "shape");
  const isHollow = selectedElement.isHollow || selectedElement.fillFormat === "hollow" || selectedElement.fill === "transparent";
  const currentTextColor = selectedElement.color || selectedElement.stroke || "#1E293B";
  const currentFontFamily = selectedElement.fontFamily || "sans";
  const currentFontSize = selectedElement.fontSize || 32;
  const currentAlign = selectedElement.align || "left";

  return (
    <div className="space-y-5 text-xs select-none">
      {/* ── STROKE / TEXT COLOR ── */}
      <div>
        <label className="font-bold text-slate-700 block mb-2">
          {isTextElement ? "Text Color" : "Stroke"}
        </label>
        <div className="flex items-center gap-2 mb-2">
          {STROKE_COLORS.slice(0, 5).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                updateSelectedElement({ stroke: c, color: c });
                setActiveColorPopover(null);
              }}
              className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                (selectedElement.stroke === c || selectedElement.color === c)
                  ? "ring-2 ring-indigo-600 ring-offset-1 border-transparent scale-105"
                  : "border-slate-300 hover:scale-105"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}

          {/* Custom Stroke/Text Color Button & Anchored Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveColorPopover(activeColorPopover === "stroke" ? null : "stroke")}
              className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer relative overflow-hidden ${
                activeColorPopover === "stroke" || (!STROKE_COLORS.slice(0, 5).includes(currentTextColor) && currentTextColor)
                  ? "ring-2 ring-indigo-600 ring-offset-1 border-transparent scale-105"
                  : "border-slate-300 hover:scale-105"
              }`}
              style={{ backgroundColor: currentTextColor }}
              title="Custom Colors Palette"
            >
              <span className="text-[10px] font-bold text-white drop-shadow-xs">+</span>
            </button>

            {activeColorPopover === "stroke" && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setActiveColorPopover(null)} />
                <div className="absolute right-0 top-full mt-2 z-50 animate-scale-in">
                  <ColorPalettePopover
                    selectedColor={currentTextColor}
                    showTransparent={false}
                    onClose={() => setActiveColorPopover(null)}
                    onSelectColor={(c) => {
                      updateSelectedElement({ stroke: c, color: c });
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── TEXT ELEMENT SPECIFIC CONTROLS (Screenshot 2) ── */}
      {isTextElement && (
        <div className="space-y-5">
          {/* FONT FAMILY */}
          <div>
            <label className="font-bold text-slate-700 block mb-2">Font family</label>
            <div className="flex items-center gap-2">
              {[
                { id: "handdrawn", label: "Casual", icon: Pencil },
                { id: "sans", label: "Sans", icon: Type },
                { id: "mono", label: "Mono", icon: Code2 },
                { id: "serif", label: "Serif", icon: Type },
              ].map((f) => {
                const IconComp = f.icon;
                const isSelected = currentFontFamily === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => updateSelectedElement({ fontFamily: f.id })}
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-100/80 border-indigo-500 text-indigo-700 shadow-2xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                    title={f.label}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* FONT SIZE (S, M, L, XL) */}
          <div>
            <label className="font-bold text-slate-700 block mb-2">Font size</label>
            <div className="flex items-center gap-2">
              {[
                { label: "S", size: 16 },
                { label: "M", size: 24 },
                { label: "L", size: 36 },
                { label: "XL", size: 48 },
              ].map((s) => {
                const isSelected = currentFontSize === s.size;
                return (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => updateSelectedElement({ fontSize: s.size })}
                    className={`flex-1 py-2 rounded-xl border flex items-center justify-center font-bold text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-100/80 border-indigo-500 text-indigo-700 shadow-2xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TEXT ALIGN (Left, Center, Right) */}
          <div>
            <label className="font-bold text-slate-700 block mb-2">Text align</label>
            <div className="flex items-center gap-2">
              {[
                { id: "left", icon: AlignLeft },
                { id: "center", icon: AlignCenter },
                { id: "right", icon: AlignRight },
              ].map((a) => {
                const IconComp = a.icon;
                const isSelected = currentAlign === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => updateSelectedElement({ align: a.id })}
                    className={`flex-1 py-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-100/80 border-indigo-500 text-indigo-700 shadow-2xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── SHAPE ELEMENT SPECIFIC CONTROLS (Screenshot 1) ── */}
      {!isTextElement && (
        <div className="space-y-5">
          {/* BACKGROUND / FILL COLOR */}
          <div>
            <label className="font-bold text-slate-700 block mb-2">Background</label>
            <div className="flex items-center gap-2 mb-2">
              {BG_COLORS.slice(0, 5).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    updateSelectedElement({ fill: c, isHollow: c === "transparent" });
                    setActiveColorPopover(null);
                  }}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer relative overflow-hidden ${
                    (selectedElement.fill === c || (c === "transparent" && isHollow))
                      ? "ring-2 ring-indigo-600 ring-offset-1 border-transparent scale-105"
                      : "border-slate-300 hover:scale-105"
                  }`}
                  style={{ backgroundColor: c === "transparent" ? "#FFFFFF" : c }}
                >
                  {c === "transparent" && (
                    <span className="text-[10px] font-extrabold text-slate-400">∅</span>
                  )}
                </button>
              ))}

              {/* Custom Background Color Button & Anchored Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveColorPopover(activeColorPopover === "background" ? null : "background")}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer relative overflow-hidden ${
                    activeColorPopover === "background" || (!BG_COLORS.slice(0, 5).includes(selectedElement.fill) && selectedElement.fill && selectedElement.fill !== "transparent")
                      ? "ring-2 ring-indigo-600 ring-offset-1 border-transparent scale-105"
                      : "border-slate-300 hover:scale-105"
                  }`}
                  style={{ backgroundColor: (selectedElement.fill && selectedElement.fill !== "transparent") ? selectedElement.fill : "#FFFFFF" }}
                  title="Custom Colors Palette"
                >
                  <span className="text-[10px] font-bold text-slate-600 drop-shadow-xs">+</span>
                </button>

                {activeColorPopover === "background" && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setActiveColorPopover(null)} />
                    <div className="absolute right-0 top-full mt-2 z-50 animate-scale-in">
                      <ColorPalettePopover
                        selectedColor={selectedElement.fill || "transparent"}
                        showTransparent={true}
                        onClose={() => setActiveColorPopover(null)}
                        onSelectColor={(c) => {
                          updateSelectedElement({ fill: c, isHollow: c === "transparent" });
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* FILL FORMAT */}
          <div>
            <label className="font-bold text-slate-700 block mb-2">Fill</label>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => updateSelectedElement({ isHollow: true, fillFormat: "hollow" })}
                className={`py-2 px-1 rounded-xl border flex items-center justify-center gap-1 font-bold text-[11px] transition-all cursor-pointer ${
                  (isHollow || selectedElement.fillFormat === "hollow")
                    ? "bg-indigo-100/80 border-indigo-500 text-indigo-700 shadow-2xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Square className="w-3.5 h-3.5 stroke-[2]" />
                <span>Hollow</span>
              </button>

              <button
                type="button"
                onClick={() => updateSelectedElement({ isHollow: false, fillFormat: "stripes" })}
                className={`py-2 px-1 rounded-xl border flex items-center justify-center gap-1 font-bold text-[11px] transition-all cursor-pointer ${
                  selectedElement.fillFormat === "stripes"
                    ? "bg-indigo-100/80 border-indigo-500 text-indigo-700 shadow-2xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="font-extrabold text-xs">▨</span>
                <span>Stripes</span>
              </button>

              <button
                type="button"
                onClick={() => updateSelectedElement({ isHollow: false, fillFormat: "crosshatch" })}
                className={`py-2 px-1 rounded-xl border flex items-center justify-center gap-1 font-bold text-[11px] transition-all cursor-pointer ${
                  selectedElement.fillFormat === "crosshatch"
                    ? "bg-indigo-100/80 border-indigo-500 text-indigo-700 shadow-2xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="font-extrabold text-xs">▩</span>
                <span>Cross</span>
              </button>

              <button
                type="button"
                onClick={() => updateSelectedElement({ isHollow: false, fillFormat: "solid", fill: selectedElement.fill === "transparent" ? "#6366F1" : selectedElement.fill })}
                className={`py-2 px-1 rounded-xl border flex items-center justify-center gap-1 font-bold text-[11px] transition-all cursor-pointer ${
                  (!isHollow && selectedElement.fillFormat !== "stripes" && selectedElement.fillFormat !== "crosshatch")
                    ? "bg-indigo-100/80 border-indigo-500 text-indigo-700 shadow-2xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="font-extrabold text-xs">■</span>
                <span>Solid</span>
              </button>
            </div>
          </div>

          {/* STROKE WIDTH */}
          <div>
            <label className="font-bold text-slate-700 block mb-2">Stroke width</label>
            <div className="flex items-center gap-2">
              {[
                { label: "Thin", val: 1, line: "h-[1.5px]" },
                { label: "Medium", val: 2.5, line: "h-[3px]" },
                { label: "Thick", val: 4, line: "h-[5px]" },
              ].map((w) => (
                <button
                  key={w.val}
                  type="button"
                  onClick={() => updateSelectedElement({ strokeWidth: w.val })}
                  className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                    (selectedElement.strokeWidth || 2.5) === w.val
                      ? "bg-indigo-100/80 border-indigo-500 text-indigo-700 shadow-2xs"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className={`w-6 bg-current rounded-full ${w.line}`} />
                </button>
              ))}
            </div>
          </div>

          {/* STROKE STYLE */}
          <div>
            <label className="font-bold text-slate-700 block mb-2">Stroke style</label>
            <div className="flex items-center gap-2">
              {[
                { label: "Solid", style: "solid" },
                { label: "Dashed", style: "dashed" },
                { label: "Dotted", style: "dotted" },
              ].map((st) => (
                <button
                  key={st.style}
                  type="button"
                  onClick={() => updateSelectedElement({ strokeStyle: st.style })}
                  className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center font-extrabold tracking-widest text-xs transition-all cursor-pointer ${
                    (selectedElement.strokeStyle || "solid") === st.style
                      ? "bg-indigo-100/80 border-indigo-500 text-indigo-700 shadow-2xs"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {st.style === "solid" && "─────"}
                  {st.style === "dashed" && "- - -"}
                  {st.style === "dotted" && "· · ·"}
                </button>
              ))}
            </div>
          </div>

          {/* EDGES */}
          <div>
            <label className="font-bold text-slate-700 block mb-2">Edges</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateSelectedElement({ borderRadius: 0 })}
                className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer ${
                  selectedElement.borderRadius === 0
                    ? "bg-indigo-100/80 border-indigo-500 text-indigo-700 shadow-2xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Square className="w-3.5 h-3.5" />
                <span>Sharp</span>
              </button>

              <button
                type="button"
                onClick={() => updateSelectedElement({ borderRadius: 16 })}
                className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer ${
                  (selectedElement.borderRadius === undefined || selectedElement.borderRadius > 0)
                    ? "bg-indigo-100/80 border-indigo-500 text-indigo-700 shadow-2xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-sm border-2 border-current" />
                <span>Rounded</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── OPACITY ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="font-bold text-slate-700">Opacity</label>
          <span className="font-semibold text-slate-500">{Math.round((selectedElement.opacity ?? 1) * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={selectedElement.opacity ?? 1}
          onChange={(e) => updateSelectedElement({ opacity: parseFloat(e.target.value) })}
          className="w-full accent-indigo-600 cursor-pointer"
        />
      </div>

      {/* ── LAYERS ── */}
      <div>
        <label className="font-bold text-slate-700 block mb-2">Layers</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => moveLayer("back")}
            className="flex-1 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
            title="Send to back"
          >
            <ChevronsDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => moveLayer("backward")}
            className="flex-1 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
            title="Send backward"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => moveLayer("forward")}
            className="flex-1 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
            title="Bring forward"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => moveLayer("front")}
            className="flex-1 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
            title="Bring to front"
          >
            <ChevronsUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── ACTIONS ── */}
      <div>
        <label className="font-bold text-slate-700 block mb-2">Actions</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDuplicate}
            className="flex-1 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 flex items-center justify-center gap-1.5 font-bold text-slate-700 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate</span>
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 py-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-100 flex items-center justify-center gap-1.5 font-bold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
          <button
            type="button"
            onClick={() => updateSelectedElement({ isLocked: !selectedElement.isLocked })}
            className={`py-2 px-3 rounded-xl border flex items-center justify-center transition-colors ${
              selectedElement.isLocked
                ? "bg-amber-100 border-amber-400 text-amber-800"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
            title={selectedElement.isLocked ? "Unlock element" : "Lock element"}
          >
            {selectedElement.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
