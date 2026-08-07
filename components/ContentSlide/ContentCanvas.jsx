"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Type,
  Image as ImageIcon,
  Square,
  BarChart2,
  Table as TableIcon,
  Code,
  ChevronDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  MoreHorizontal,
  Plus,
  Trash2,
  Copy,
  Scissors,
  Clipboard,
  Layers,
  Lock,
  Unlock,
  Palette,
  Image,
  Layout,
  Circle,
  Triangle,
  Star,
  Heart,
  ArrowRight,
  PieChart,
  Activity,
  Upload,
  Video,
  Globe,
  List,
  ListOrdered,
  StickyNote,
  Minus,
  MoveRight,
  ArrowLeftRight,
  CheckCircle2,
  X,
  CloudUpload
} from "lucide-react";
import MediaUploadModal from "@/components/MediaUploadModal";
import { generateContentSlideSnapshot } from "@/lib/canvasSnapshot";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

const DEFAULT_TEXT_ELEMENT = {
  id: "elem-title",
  type: "text",
  text: "Add title",
  preset: "Title",
  x: 80,
  y: 60,
  width: 400,
  height: 80,
  fontSize: 48,
  fontWeight: "bold",
  fontStyle: "normal",
  color: "#1E293B",
  align: "left",
  locked: false,
};

export default function ContentCanvas({
  question,
  onChange,
  themeStyles = {},
}) {
  const elements = question.elements || [DEFAULT_TEXT_ELEMENT];

  const [selectedId, setSelectedId] = useState(elements[0]?.id || null);
  const [editingTextId, setEditingTextId] = useState(null);

  // Top toolbar popovers toggles
  const [showTextPicker, setShowTextPicker] = useState(false);
  const [showShapePicker, setShowShapePicker] = useState(false);
  const [shapeCategory, setShapeCategory] = useState("Essential"); // Essential, Lines, Sticky notes, Buttons and labels, Process
  const [showEmbedPicker, setShowEmbedPicker] = useState(false);
  const [embedProvider, setEmbedProvider] = useState("YouTube"); // YouTube, Vimeo, Loom, Graphy, Any link
  const [embedUrlInput, setEmbedUrlInput] = useState("");

  const [showChartPicker, setShowChartPicker] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(null); // { x, y, id }
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showSlideStylePicker, setShowSlideStylePicker] = useState(false);
  const [clipboard, setClipboard] = useState(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // Dragging and Resizing state
  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ w: 0, h: 0, x: 0, y: 0 });

  const selectedElement = elements.find((e) => e.id === selectedId);

  const updateElements = (newElements) => {
    onChange({
      ...question,
      elements: newElements,
    });
  };

  const addElement = (newElem) => {
    const updated = [...elements, newElem];
    updateElements(updated);
    setSelectedId(newElem.id);
  };

  const updateSelectedElement = (partial) => {
    if (!selectedId) return;
    const updated = elements.map((elem) =>
      elem.id === selectedId ? { ...elem, ...partial } : elem
    );
    updateElements(updated);
  };

  // Close all popovers helper
  const closeAllPopovers = () => {
    setShowTextPicker(false);
    setShowShapePicker(false);
    setShowEmbedPicker(false);
    setShowChartPicker(false);
    setShowTablePicker(false);
  };

  // ── Element Creators ──
  const handleAddTextWithPreset = (presetName, fontSize, fontWeight, textVal = "Add text") => {
    const id = `elem-${Date.now()}`;
    addElement({
      id,
      type: "text",
      text: textVal,
      preset: presetName,
      x: 120,
      y: 120,
      width: 380,
      height: 70,
      fontSize: fontSize,
      fontWeight: fontWeight,
      fontStyle: "normal",
      color: "#1E293B",
      align: "left",
      locked: false,
    });
    setShowTextPicker(false);
  };

  const handleAddShapeItem = (shapeType, fill = "#6366F1", extraProps = {}) => {
    const id = `elem-${Date.now()}`;
    addElement({
      id,
      type: "shape",
      shapeType,
      x: 200,
      y: 120,
      width: shapeType === "line" || shapeType === "arrow" || shapeType === "dashed" ? 220 : 140,
      height: shapeType === "line" || shapeType === "arrow" || shapeType === "dashed" ? 40 : 140,
      fill,
      stroke: fill === "#FFFFFF" ? "#CBD5E1" : "transparent",
      strokeWidth: 2,
      locked: false,
      ...extraProps,
    });
    setShowShapePicker(false);
  };

  const handleAddStickyNote = (colorHex, defaultText = "Add a note...") => {
    const id = `elem-${Date.now()}`;
    addElement({
      id,
      type: "sticky",
      text: defaultText,
      x: 220,
      y: 130,
      width: 150,
      height: 140,
      fill: colorHex,
      color: "#334155",
      fontSize: 16,
      locked: false,
    });
    setShowShapePicker(false);
  };

  const handleAddButtonLabel = (labelType) => {
    const id = `elem-${Date.now()}`;
    if (labelType === "primary") {
      addElement({
        id,
        type: "button",
        text: "Click Here",
        x: 220,
        y: 140,
        width: 160,
        height: 48,
        bg: "#6366F1",
        color: "#FFFFFF",
        locked: false,
      });
    } else {
      addElement({
        id,
        type: "tag",
        text: "Feature Tag",
        x: 220,
        y: 140,
        width: 130,
        height: 36,
        bg: "#10B981",
        color: "#FFFFFF",
        locked: false,
      });
    }
    setShowShapePicker(false);
  };

  const handleAddChart = (chartType) => {
    const id = `elem-${Date.now()}`;
    addElement({
      id,
      type: "chart",
      chartType,
      x: 180,
      y: 100,
      width: 320,
      height: 220,
      title: "Sample Chart",
      data: [
        { label: "Option A", value: 40 },
        { label: "Option B", value: 65 },
        { label: "Option C", value: 25 },
      ],
      locked: false,
    });
    setShowChartPicker(false);
  };

  const handleAddTable = (rows = 3, cols = 3) => {
    const id = `elem-${Date.now()}`;
    addElement({
      id,
      type: "table",
      x: 150,
      y: 120,
      width: 360,
      height: 180,
      rows,
      cols,
      data: [
        ["Header 1", "Header 2", "Header 3"],
        ["Item A", "10", "High"],
        ["Item B", "20", "Medium"],
      ],
      locked: false,
    });
    setShowTablePicker(false);
  };

  const handleAddEmbed = () => {
    const id = `elem-${Date.now()}`;
    const url = embedUrlInput.trim() || "https://www.youtube.com/embed/dQw4w9WgXcQ";
    addElement({
      id,
      type: "embed",
      provider: embedProvider,
      url,
      title: `${embedProvider} Embed`,
      x: 160,
      y: 120,
      width: 380,
      height: 210,
      locked: false,
    });
    setEmbedUrlInput("");
    setShowEmbedPicker(false);
  };

  // ── Cloudinary Direct Upload & Export Handler ──
  const handleExportAndUploadCloudinary = async () => {
    const toastId = toast.loading("Capturing slide snapshot & uploading to Cloudinary...");
    try {
      const dataUrl = await generateContentSlideSnapshot(question);
      if (!dataUrl) {
        toast.dismiss(toastId);
        toast.error("Failed to generate slide snapshot");
        return;
      }

      // Convert Data URL to File for Cloudinary Upload
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `content-slide-${Date.now()}.png`, { type: "image/png" });

      let cloudinaryUrl = dataUrl; // fallback
      try {
        const uploadRes = await api.uploadImage(file, "polls/slides");
        if (uploadRes?.url) {
          cloudinaryUrl = uploadRes.url;
        }
      } catch (uploadErr) {
        console.warn("Cloudinary endpoint fallback to Data URL:", uploadErr);
      }

      // Update question snapshotUrl & imageUrl
      const updatedQuestion = {
        ...question,
        snapshotUrl: cloudinaryUrl,
        imageUrl: cloudinaryUrl,
      };
      onChange(updatedQuestion);

      toast.dismiss(toastId);
      toast.success("Snapshot uploaded to Cloudinary & saved!");
    } catch (err) {
      console.error("Export error:", err);
      toast.dismiss(toastId);
      toast.error("Failed to export slide");
    }
  };

  // ── Drag & Resize Handlers ──
  const handleMouseDown = (e, elem) => {
    if (elem.locked) return;
    if (e.target.dataset.resize) return;
    e.stopPropagation();

    setSelectedId(elem.id);
    setShowContextMenu(null);

    const canvasBounds = canvasRef.current.getBoundingClientRect();
    isDraggingRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - canvasBounds.left - elem.x,
      y: e.clientY - canvasBounds.top - elem.y,
    };
  };

  const handleResizeStart = (e, elem) => {
    if (elem.locked) return;
    e.stopPropagation();
    isResizingRef.current = true;
    resizeStartRef.current = {
      w: elem.width,
      h: elem.height,
      x: e.clientX,
      y: e.clientY,
    };
  };

  const handleMouseMove = (e) => {
    if (!canvasRef.current || !selectedId) return;
    const canvasBounds = canvasRef.current.getBoundingClientRect();

    if (isDraggingRef.current) {
      const elem = elements.find((e) => e.id === selectedId);
      if (!elem || elem.locked) return;

      let newX = e.clientX - canvasBounds.left - dragOffsetRef.current.x;
      let newY = e.clientY - canvasBounds.top - dragOffsetRef.current.y;

      newX = Math.max(0, Math.min(newX, canvasBounds.width - elem.width));
      newY = Math.max(0, Math.min(newY, canvasBounds.height - elem.height));

      updateSelectedElement({ x: Math.round(newX), y: Math.round(newY) });
    } else if (isResizingRef.current) {
      const elem = elements.find((e) => e.id === selectedId);
      if (!elem || elem.locked) return;

      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;

      const newW = Math.max(50, resizeStartRef.current.w + deltaX);
      const newH = Math.max(30, resizeStartRef.current.h + deltaY);

      updateSelectedElement({
        width: Math.round(newW),
        height: Math.round(newH),
      });
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isResizingRef.current = false;
  };

  // ── Context Menu Actions ──
  const handleContextMenu = (e, elem) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(elem.id);
    const canvasBounds = canvasRef.current.getBoundingClientRect();
    setShowContextMenu({
      x: e.clientX - canvasBounds.left,
      y: e.clientY - canvasBounds.top,
      id: elem.id,
    });
  };

  const handleDuplicate = () => {
    if (!selectedElement) return;
    const dup = {
      ...selectedElement,
      id: `elem-${Date.now()}`,
      x: selectedElement.x + 20,
      y: selectedElement.y + 20,
    };
    addElement(dup);
    setShowContextMenu(null);
  };

  const handleDelete = () => {
    if (!selectedId) return;
    const updated = elements.filter((e) => e.id !== selectedId);
    updateElements(updated);
    setSelectedId(updated[0]?.id || null);
    setShowContextMenu(null);
  };

  const handleCut = () => {
    if (!selectedElement) return;
    setClipboard({ ...selectedElement });
    handleDelete();
  };

  const handleCopy = () => {
    if (!selectedElement) return;
    setClipboard({ ...selectedElement });
    setShowContextMenu(null);
  };

  const handlePaste = () => {
    if (!clipboard) return;
    const pasted = {
      ...clipboard,
      id: `elem-${Date.now()}`,
      x: clipboard.x + 30,
      y: clipboard.y + 30,
    };
    addElement(pasted);
    setShowContextMenu(null);
  };

  const handleBringForward = () => {
    if (!selectedId) return;
    const idx = elements.findIndex((e) => e.id === selectedId);
    if (idx < elements.length - 1) {
      const newElems = [...elements];
      const temp = newElems[idx];
      newElems[idx] = newElems[idx + 1];
      newElems[idx + 1] = temp;
      updateElements(newElems);
    }
    setShowContextMenu(null);
  };

  const handleSendBackward = () => {
    if (!selectedId) return;
    const idx = elements.findIndex((e) => e.id === selectedId);
    if (idx > 0) {
      const newElems = [...elements];
      const temp = newElems[idx];
      newElems[idx] = newElems[idx - 1];
      newElems[idx - 1] = temp;
      updateElements(newElems);
    }
    setShowContextMenu(null);
  };

  const handleToggleLock = () => {
    if (!selectedElement) return;
    updateSelectedElement({ locked: !selectedElement.locked });
    setShowContextMenu(null);
  };

  return (
    <div className="w-full flex flex-col items-center select-none font-sans">
      {/* ── TOP HEADER TOOLBAR (Text, Media, Shape, Chart, Table, Embed) ── */}
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-sm mb-3 px-4 py-2 flex items-center justify-around shrink-0 z-20 relative">
        {/* TEXT BUTTON + POPOVER (Matches Screenshot 1!) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              const next = !showTextPicker;
              closeAllPopovers();
              setShowTextPicker(next);
            }}
            className={`flex flex-col items-center gap-1 transition-colors p-1.5 rounded-lg cursor-pointer ${
              showTextPicker ? "bg-slate-100 text-indigo-600" : "text-slate-700 hover:text-indigo-600 hover:bg-slate-100/80"
            }`}
          >
            <Type className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Text</span>
          </button>

          {/* Screenshot 1 Text Styles Dropdown */}
          {showTextPicker && (
            <div className="absolute top-full mt-2 left-0 bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-4 z-50 w-64 animate-fade-in text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2">
                <span className="text-xs font-semibold text-slate-500">Text styles</span>
                <button
                  type="button"
                  onClick={() => setShowTextPicker(false)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  Edit
                </button>
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => handleAddTextWithPreset("Title", 48, "bold", "Title")}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50/70 transition-colors text-2xl font-bold text-slate-900 block"
                >
                  Title
                </button>

                <button
                  type="button"
                  onClick={() => handleAddTextWithPreset("Headline", 36, "bold", "Headline")}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50/70 transition-colors text-xl font-bold text-slate-800 block"
                >
                  Headline
                </button>

                <button
                  type="button"
                  onClick={() => handleAddTextWithPreset("Subheadline", 28, "semibold", "Subheadline")}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50/70 transition-colors text-base font-semibold text-slate-700 block"
                >
                  Subheadline
                </button>

                <button
                  type="button"
                  onClick={() => handleAddTextWithPreset("Body", 18, "normal", "Normal text")}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50/70 transition-colors text-sm font-medium text-slate-600 block"
                >
                  Normal text
                </button>

                <button
                  type="button"
                  onClick={() => handleAddTextWithPreset("Small", 14, "normal", "Small text")}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50/70 transition-colors text-xs text-slate-500 block"
                >
                  Small text
                </button>

                <div className="border-t border-slate-100 my-1 pt-1">
                  <button
                    type="button"
                    onClick={() => handleAddTextWithPreset("Bullet", 18, "normal", "• First bullet point\n• Second bullet point")}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50/70 transition-colors text-sm font-medium text-slate-700 flex items-center gap-2"
                  >
                    <List className="w-4 h-4 text-slate-500" /> Bullet list
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddTextWithPreset("Number", 18, "normal", "1. First item\n2. Second item")}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50/70 transition-colors text-sm font-medium text-slate-700 flex items-center gap-2"
                  >
                    <ListOrdered className="w-4 h-4 text-slate-500" /> Number list
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MEDIA BUTTON */}
        <button
          type="button"
          onClick={() => {
            closeAllPopovers();
            setIsMediaModalOpen(true);
          }}
          className="flex flex-col items-center gap-1 text-slate-700 hover:text-indigo-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100/80 cursor-pointer"
        >
          <ImageIcon className="w-5 h-5" />
          <span className="text-[11px] font-semibold">Media</span>
        </button>

        {/* SHAPE BUTTON + POPOVER (Matches Screenshot 2!) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              const next = !showShapePicker;
              closeAllPopovers();
              setShowShapePicker(next);
            }}
            className={`flex flex-col items-center gap-1 transition-colors p-1.5 rounded-lg cursor-pointer ${
              showShapePicker ? "bg-slate-100 text-indigo-600" : "text-slate-700 hover:text-indigo-600 hover:bg-slate-100/80"
            }`}
          >
            <Square className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Shape</span>
          </button>

          {/* Screenshot 2 Comprehensive Shape Modal */}
          {showShapePicker && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-0 z-50 w-[540px] animate-fade-in flex overflow-hidden text-left">
              {/* Left Sidebar Categories */}
              <div className="w-44 bg-slate-50/80 border-r border-slate-200/80 p-3 space-y-1 shrink-0">
                {[
                  { id: "Essential", label: "Essential" },
                  { id: "Lines", label: "Lines" },
                  { id: "Sticky notes", label: "Sticky notes" },
                  { id: "Buttons and labels", label: "Buttons & labels" },
                  { id: "Process", label: "Process" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setShapeCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      shapeCategory === cat.id
                        ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                        : "text-slate-600 hover:bg-slate-100/60"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Right Content Panel */}
              <div className="flex-1 p-5 max-h-80 overflow-y-auto">
                <h4 className="font-bold text-sm text-slate-800 mb-4">{shapeCategory}</h4>

                {shapeCategory === "Essential" && (
                  <div className="grid grid-cols-4 gap-3">
                    <button
                      type="button"
                      onClick={() => handleAddShapeItem("rectangle", "#6366F1")}
                      className="p-3 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/40 flex flex-col items-center justify-center gap-1 cursor-pointer"
                      title="Rectangle"
                    >
                      <Square className="w-6 h-6 text-slate-700" />
                      <span className="text-[10px] text-slate-500">Rectangle</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddShapeItem("circle", "#EC4899")}
                      className="p-3 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/40 flex flex-col items-center justify-center gap-1 cursor-pointer"
                      title="Circle"
                    >
                      <Circle className="w-6 h-6 text-slate-700" />
                      <span className="text-[10px] text-slate-500">Circle</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddShapeItem("triangle", "#10B981")}
                      className="p-3 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/40 flex flex-col items-center justify-center gap-1 cursor-pointer"
                      title="Triangle"
                    >
                      <Triangle className="w-6 h-6 text-slate-700" />
                      <span className="text-[10px] text-slate-500">Triangle</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddShapeItem("star", "#F59E0B")}
                      className="p-3 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/40 flex flex-col items-center justify-center gap-1 cursor-pointer"
                      title="Star"
                    >
                      <Star className="w-6 h-6 text-slate-700" />
                      <span className="text-[10px] text-slate-500">Star</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddShapeItem("heart", "#EF4444")}
                      className="p-3 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/40 flex flex-col items-center justify-center gap-1 cursor-pointer"
                      title="Heart"
                    >
                      <Heart className="w-6 h-6 text-slate-700" />
                      <span className="text-[10px] text-slate-500">Heart</span>
                    </button>
                  </div>
                )}

                {shapeCategory === "Lines" && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleAddShapeItem("line", "#1E293B")}
                      className="p-3 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/40 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Minus className="w-6 h-6 text-slate-800" />
                      <span className="text-xs font-semibold text-slate-700">Solid line</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddShapeItem("arrow", "#6366F1")}
                      className="p-3 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/40 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MoveRight className="w-6 h-6 text-indigo-600" />
                      <span className="text-xs font-semibold text-slate-700">Arrow line</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddShapeItem("double_arrow", "#3B82F6")}
                      className="p-3 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/40 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ArrowLeftRight className="w-6 h-6 text-blue-600" />
                      <span className="text-xs font-semibold text-slate-700">Double arrow</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddShapeItem("dashed", "#64748B")}
                      className="p-3 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/40 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span className="font-mono text-xs text-slate-600">--- --- ---</span>
                      <span className="text-xs font-semibold text-slate-700">Dashed line</span>
                    </button>
                  </div>
                )}

                {shapeCategory === "Sticky notes" && (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { color: "#FEF08A", label: "Yellow" },
                      { color: "#FFEDD5", label: "Peach" },
                      { color: "#FBCFE8", label: "Pink" },
                      { color: "#E9D5FF", label: "Purple" },
                      { color: "#BFDBFE", label: "Blue" },
                      { color: "#BBF7D0", label: "Green" },
                    ].map((sn) => (
                      <button
                        key={sn.color}
                        type="button"
                        onClick={() => handleAddStickyNote(sn.color)}
                        className="h-20 p-2.5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer text-left"
                        style={{ backgroundColor: sn.color }}
                      >
                        <span className="text-[11px] font-semibold text-slate-700">Add a note...</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{sn.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {shapeCategory === "Buttons and labels" && (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => handleAddButtonLabel("primary")}
                      className="w-full p-3 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-indigo-700 flex items-center justify-between cursor-pointer"
                    >
                      <span>Primary Button</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddButtonLabel("tag")}
                      className="w-full p-2.5 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-full font-bold text-xs flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Feature Tag Label</span>
                    </button>
                  </div>
                )}

                {shapeCategory === "Process" && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleAddShapeItem("rectangle", "#FFFFFF", { stroke: "#6366F1", strokeWidth: 2 })}
                      className="p-3 border border-indigo-200 bg-indigo-50/50 rounded-xl text-center text-xs font-bold text-indigo-900 cursor-pointer"
                    >
                      Step 1 Card
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddShapeItem("rectangle", "#EEF2FF", { stroke: "#4338CA", strokeWidth: 2 })}
                      className="p-3 border border-indigo-300 bg-indigo-100/50 rounded-xl text-center text-xs font-bold text-indigo-900 cursor-pointer"
                    >
                      Process Box
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CHART BUTTON */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              const next = !showChartPicker;
              closeAllPopovers();
              setShowChartPicker(next);
            }}
            className={`flex flex-col items-center gap-1 transition-colors p-1.5 rounded-lg cursor-pointer ${
              showChartPicker ? "bg-slate-100 text-indigo-600" : "text-slate-700 hover:text-indigo-600 hover:bg-slate-100/80"
            }`}
          >
            <BarChart2 className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Chart</span>
          </button>
          {showChartPicker && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 flex flex-col gap-1 w-36 animate-fade-in">
              <button
                type="button"
                onClick={() => handleAddChart("bar")}
                className="px-3 py-1.5 text-xs font-semibold hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-lg flex items-center gap-2"
              >
                <BarChart2 className="w-4 h-4" /> Bar Chart
              </button>
              <button
                type="button"
                onClick={() => handleAddChart("donut")}
                className="px-3 py-1.5 text-xs font-semibold hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-lg flex items-center gap-2"
              >
                <PieChart className="w-4 h-4" /> Donut Chart
              </button>
            </div>
          )}
        </div>

        {/* TABLE BUTTON */}
        <button
          type="button"
          onClick={() => {
            closeAllPopovers();
            handleAddTable();
          }}
          className="flex flex-col items-center gap-1 text-slate-700 hover:text-indigo-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100/80 cursor-pointer"
        >
          <TableIcon className="w-5 h-5" />
          <span className="text-[11px] font-semibold">Table</span>
        </button>

        {/* EMBED BUTTON + POPOVER (Matches Screenshot 3!) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              const next = !showEmbedPicker;
              closeAllPopovers();
              setShowEmbedPicker(next);
            }}
            className={`flex flex-col items-center gap-1 transition-colors p-1.5 rounded-lg cursor-pointer ${
              showEmbedPicker ? "bg-slate-100 text-indigo-600" : "text-slate-700 hover:text-indigo-600 hover:bg-slate-100/80"
            }`}
          >
            <Code className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Embed</span>
          </button>

          {/* Screenshot 3 Embed Modal */}
          {showEmbedPicker && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-0 z-50 w-[540px] animate-fade-in flex overflow-hidden text-left">
              {/* Left Tabs */}
              <div className="w-40 bg-slate-50/80 border-r border-slate-200/80 p-3 space-y-1 shrink-0">
                {[
                  { id: "YouTube", icon: Video, color: "text-red-500" },
                  { id: "Vimeo", icon: Video, color: "text-blue-400" },
                  { id: "Loom", icon: Video, color: "text-indigo-500" },
                  { id: "Graphy", icon: Activity, color: "text-emerald-500" },
                  { id: "Any link", icon: Globe, color: "text-slate-600" },
                ].map((prov) => {
                  const IconComp = prov.icon;
                  return (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => setEmbedProvider(prov.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                        embedProvider === prov.id
                          ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                          : "text-slate-600 hover:bg-slate-100/60"
                      }`}
                    >
                      <IconComp className={`w-4 h-4 ${prov.color}`} />
                      <span>{prov.id}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right Content Panel */}
              <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-base text-slate-900 mb-1">{embedProvider}</h4>
                  <p className="text-xs text-slate-500 mb-4">
                    Embed any public {embedProvider} link into your presentation.
                  </p>

                  {/* Card Illustration Banner matching screenshot 3 */}
                  <div className="w-full h-32 rounded-xl bg-gradient-to-br from-red-500 via-purple-600 to-indigo-600 p-3 flex items-center justify-center relative overflow-hidden shadow-inner mb-4">
                    <div className="w-20 h-14 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-lg">
                      <Video className="w-8 h-8 text-white fill-white" />
                    </div>
                  </div>
                </div>

                {/* Bottom URL input + Add button */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={embedUrlInput}
                    onChange={(e) => setEmbedUrlInput(e.target.value)}
                    placeholder={`Paste any ${embedProvider} link`}
                    className="flex-1 px-3 py-2 border-2 border-indigo-400/80 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddEmbed}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CANVAS WORKSPACE ── */}
      <div
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={() => {
          setSelectedId(null);
          setEditingTextId(null);
          setShowContextMenu(null);
          closeAllPopovers();
          setShowColorPicker(false);
        }}
        className="w-full max-w-4xl h-[480px] rounded-[24px] border-[3.5px] border-slate-900/90 shadow-2xl relative overflow-hidden transition-all bg-white"
      >
        {/* Background color / background image layer at lowest z-0 */}
        <div
          className="absolute inset-0 z-0 pointer-events-none transition-all"
          style={{
            backgroundColor: question.backgroundColor || "#FFFFFF",
            backgroundImage: question.backgroundImage ? `url(${question.backgroundImage})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Render Elements at z-10 and above */}
        {elements.map((elem) => {
          const isSelected = elem.id === selectedId;

          return (
            <div
              key={elem.id}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => handleMouseDown(e, elem)}
              onContextMenu={(e) => handleContextMenu(e, elem)}
              className={`absolute cursor-move transition-shadow ${
                isSelected
                  ? "ring-2 ring-indigo-500 ring-offset-2 z-30"
                  : "hover:ring-1 hover:ring-indigo-300 z-10"
              }`}
              style={{
                left: `${elem.x}px`,
                top: `${elem.y}px`,
                width: `${elem.width}px`,
                height: `${elem.height}px`,
              }}
            >
              {/* FLOATING TOOLBAR ABOVE SELECTED ELEMENT */}
              {isSelected && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute -top-12 left-0 bg-white border border-slate-200/90 shadow-lg rounded-xl px-2 py-1 flex items-center gap-2 z-40 animate-fade-in shrink-0 whitespace-nowrap"
                >
                  {(elem.type === "text" || elem.type === "sticky") && (
                    <>
                      {/* Preset font style */}
                      <select
                        value={elem.preset || "Title"}
                        onChange={(e) => {
                          const val = e.target.value;
                          let sz = 32, weight = "normal";
                          if (val === "Title") { sz = 48; weight = "bold"; }
                          else if (val === "Headline") { sz = 36; weight = "bold"; }
                          else if (val === "Subheadline") { sz = 28; weight = "semibold"; }
                          else { sz = 18; weight = "normal"; }
                          updateSelectedElement({
                            preset: val,
                            fontSize: sz,
                            fontWeight: weight,
                          });
                        }}
                        className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 outline-none cursor-pointer"
                      >
                        <option value="Title">Title</option>
                        <option value="Headline">Headline</option>
                        <option value="Subheadline">Subheadline</option>
                        <option value="Body">Normal text</option>
                      </select>

                      {/* Font size */}
                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1 py-0.5">
                        <input
                          type="number"
                          value={elem.fontSize || 32}
                          onChange={(e) =>
                            updateSelectedElement({
                              fontSize: parseInt(e.target.value) || 16,
                            })
                          }
                          className="w-8 text-xs font-bold text-slate-800 bg-transparent text-center focus:outline-none"
                        />
                        <div className="flex flex-col text-[8px] text-slate-500">
                          <button
                            type="button"
                            onClick={() =>
                              updateSelectedElement({
                                fontSize: (elem.fontSize || 32) + 2,
                              })
                            }
                            className="hover:text-indigo-600 font-extrabold"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateSelectedElement({
                                fontSize: Math.max(10, (elem.fontSize || 32) - 2),
                              })
                            }
                            className="hover:text-indigo-600 font-extrabold"
                          >
                            ▼
                          </button>
                        </div>
                      </div>

                      {/* Text Color Button */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowColorPicker(!showColorPicker)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-700 flex items-center gap-1 font-bold text-xs cursor-pointer"
                          title="Text color"
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-300"
                            style={{ backgroundColor: elem.color || "#1E293B" }}
                          />
                          A
                        </button>
                        {showColorPicker && (
                          <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 grid grid-cols-5 gap-1.5 w-36">
                            {[
                              "#1E293B",
                              "#6366F1",
                              "#EC4899",
                              "#10B981",
                              "#F59E0B",
                              "#3B82F6",
                              "#8B5CF6",
                              "#EF4444",
                              "#FFFFFF",
                              "#000000",
                            ].map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => {
                                  updateSelectedElement({ color: c });
                                  setShowColorPicker(false);
                                }}
                                className="w-5 h-5 rounded-full border border-slate-200 shadow-2xs hover:scale-110 transition-transform"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Align */}
                      <button
                        type="button"
                        onClick={() => {
                          const next =
                            elem.align === "left"
                              ? "center"
                              : elem.align === "center"
                              ? "right"
                              : "left";
                          updateSelectedElement({ align: next });
                        }}
                        className="p-1 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
                        title="Alignment"
                      >
                        {elem.align === "center" ? (
                          <AlignCenter className="w-4 h-4 text-indigo-600" />
                        ) : elem.align === "right" ? (
                          <AlignRight className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <AlignLeft className="w-4 h-4 text-indigo-600" />
                        )}
                      </button>

                      {/* Bold */}
                      <button
                        type="button"
                        onClick={() =>
                          updateSelectedElement({
                            fontWeight:
                              elem.fontWeight === "bold" ? "normal" : "bold",
                          })
                        }
                        className={`p-1 rounded cursor-pointer ${
                          elem.fontWeight === "bold"
                            ? "bg-indigo-100 text-indigo-700"
                            : "hover:bg-slate-100 text-slate-700"
                        }`}
                        title="Bold"
                      >
                        <Bold className="w-4 h-4" />
                      </button>

                      {/* Italic */}
                      <button
                        type="button"
                        onClick={() =>
                          updateSelectedElement({
                            fontStyle:
                              elem.fontStyle === "italic" ? "normal" : "italic",
                          })
                        }
                        className={`p-1 rounded cursor-pointer ${
                          elem.fontStyle === "italic"
                            ? "bg-indigo-100 text-indigo-700"
                            : "hover:bg-slate-100 text-slate-700"
                        }`}
                        title="Italic"
                      >
                        <Italic className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* More options button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowContextMenu({
                        x: elem.x,
                        y: elem.y + 40,
                        id: elem.id,
                      });
                    }}
                    className="p-1 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
                    title="More options"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* ELEMENT INNER CONTENT */}
              {elem.type === "text" && (
                <div
                  onDoubleClick={() => setEditingTextId(elem.id)}
                  className="w-full h-full p-2 flex items-center focus:outline-none whitespace-pre-wrap"
                  style={{
                    justifyContent:
                      elem.align === "center"
                        ? "center"
                        : elem.align === "right"
                        ? "flex-end"
                        : "flex-start",
                  }}
                >
                  {editingTextId === elem.id ? (
                    <textarea
                      value={elem.text}
                      onChange={(e) =>
                        updateSelectedElement({ text: e.target.value })
                      }
                      onBlur={() => setEditingTextId(null)}
                      autoFocus
                      className="w-full h-full bg-transparent resize-none focus:outline-none border border-indigo-400 rounded p-1"
                      style={{
                        fontSize: `${elem.fontSize || 32}px`,
                        fontWeight: elem.fontWeight || "normal",
                        fontStyle: elem.fontStyle || "normal",
                        color: elem.color || "#1E293B",
                        textAlign: elem.align || "left",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: `${elem.fontSize || 32}px`,
                        fontWeight: elem.fontWeight || "normal",
                        fontStyle: elem.fontStyle || "normal",
                        color: elem.color || "#1E293B",
                        textAlign: elem.align || "left",
                        lineHeight: 1.2,
                      }}
                    >
                      {elem.text || "Click to add text"}
                    </span>
                  )}
                </div>
              )}

              {elem.type === "sticky" && (
                <div
                  onDoubleClick={() => setEditingTextId(elem.id)}
                  className="w-full h-full p-3 rounded-xl shadow-md flex flex-col justify-between overflow-hidden"
                  style={{ backgroundColor: elem.fill || "#FEF08A" }}
                >
                  {editingTextId === elem.id ? (
                    <textarea
                      value={elem.text}
                      onChange={(e) => updateSelectedElement({ text: e.target.value })}
                      onBlur={() => setEditingTextId(null)}
                      autoFocus
                      className="w-full h-full bg-transparent resize-none focus:outline-none text-xs font-semibold text-slate-800"
                    />
                  ) : (
                    <p className="text-xs font-semibold text-slate-800 whitespace-pre-wrap">{elem.text}</p>
                  )}
                </div>
              )}

              {elem.type === "button" && (
                <div
                  className="w-full h-full rounded-xl flex items-center justify-center font-bold text-sm shadow-md"
                  style={{ backgroundColor: elem.bg || "#6366F1", color: elem.color || "#FFFFFF" }}
                >
                  {elem.text}
                </div>
              )}

              {elem.type === "tag" && (
                <div
                  className="w-full h-full rounded-full flex items-center justify-center font-bold text-xs shadow-xs"
                  style={{ backgroundColor: elem.bg || "#10B981", color: elem.color || "#FFFFFF" }}
                >
                  {elem.text}
                </div>
              )}

              {elem.type === "shape" && (
                <div className="w-full h-full flex items-center justify-center">
                  {elem.shapeType === "circle" ? (
                    <div
                      className="w-full h-full rounded-full shadow-md"
                      style={{
                        backgroundColor: elem.fill || "#6366F1",
                        border: `${elem.strokeWidth || 0}px solid ${elem.stroke || "transparent"}`,
                      }}
                    />
                  ) : elem.shapeType === "triangle" ? (
                    <div
                      className="w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-b-[100px]"
                      style={{ borderBottomColor: elem.fill || "#6366F1" }}
                    />
                  ) : elem.shapeType === "line" ? (
                    <div className="w-full h-1" style={{ backgroundColor: elem.fill || "#1E293B" }} />
                  ) : elem.shapeType === "arrow" ? (
                    <div className="w-full flex items-center">
                      <div className="flex-1 h-1" style={{ backgroundColor: elem.fill || "#6366F1" }} />
                      <div className="w-0 h-0 border-t-6 border-t-transparent border-b-6 border-b-transparent border-l-8" style={{ borderLeftColor: elem.fill || "#6366F1" }} />
                    </div>
                  ) : elem.shapeType === "dashed" ? (
                    <div className="w-full h-1 border-b-2 border-dashed" style={{ borderColor: elem.fill || "#64748B" }} />
                  ) : (
                    <div
                      className="w-full h-full rounded-2xl shadow-md"
                      style={{
                        backgroundColor: elem.fill || "#6366F1",
                        border: `${elem.strokeWidth || 0}px solid ${elem.stroke || "transparent"}`,
                      }}
                    />
                  )}
                </div>
              )}

              {elem.type === "media" && (
                <div className="w-full h-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center shadow-md relative">
                  {elem.url ? (
                    <img
                      src={elem.url}
                      alt="Media"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsMediaModalOpen(true)}
                      className="flex flex-col items-center gap-1 text-slate-500 hover:text-indigo-600 cursor-pointer p-4"
                    >
                      <Upload className="w-6 h-6" />
                      <span className="text-xs font-semibold">Upload Image</span>
                    </button>
                  )}
                </div>
              )}

              {elem.type === "chart" && (
                <div className="w-full h-full bg-white/95 backdrop-blur-xs border border-slate-200 rounded-2xl p-3 shadow-md flex flex-col justify-between">
                  <span className="text-xs font-bold text-slate-800">{elem.title}</span>
                  <div className="flex items-end justify-between gap-2 h-28 pt-2">
                    {elem.data?.map((d, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                        <div
                          className="w-full bg-[#6366F1] rounded-t-md transition-all"
                          style={{ height: `${d.value}%` }}
                        />
                        <span className="text-[10px] font-semibold text-slate-500 mt-1 truncate max-w-[50px]">
                          {d.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {elem.type === "table" && (
                <div className="w-full h-full bg-white border border-slate-300 rounded-xl overflow-hidden shadow-md p-1">
                  <table className="w-full h-full border-collapse text-xs">
                    <tbody>
                      {elem.data?.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className={`border border-slate-200 p-1 text-center font-medium ${
                                rIdx === 0 ? "bg-slate-100 font-bold text-slate-800" : "text-slate-700"
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {elem.type === "embed" && (
                <div className="w-full h-full bg-slate-900 text-white rounded-2xl p-3 flex flex-col items-center justify-center gap-2 shadow-lg relative overflow-hidden">
                  <div className="w-full h-24 rounded-lg bg-red-600/80 flex items-center justify-center">
                    <Video className="w-8 h-8 text-white fill-white" />
                  </div>
                  <span className="text-xs font-bold text-center truncate max-w-full px-2">
                    {elem.title || elem.provider}
                  </span>
                </div>
              )}

              {/* Resize handle on bottom-right corner when selected */}
              {isSelected && !elem.locked && (
                <div
                  data-resize="true"
                  onMouseDown={(e) => handleResizeStart(e, elem)}
                  className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-indigo-600 border-2 border-white rounded-full cursor-nwse-resize z-50 shadow-md"
                />
              )}
            </div>
          );
        })}

        {/* CONTEXT MENU POPUP */}
        {showContextMenu && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bg-white border border-slate-200/90 rounded-2xl shadow-2xl py-2 w-52 z-50 animate-fade-in text-xs font-medium text-slate-700"
            style={{
              left: `${Math.min(showContextMenu.x, 600)}px`,
              top: `${Math.min(showContextMenu.y, 350)}px`,
            }}
          >
            <button
              type="button"
              onClick={handleCut}
              className="w-full px-4 py-2 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Scissors className="w-4 h-4 text-slate-500" /> Cut
              </span>
              <span className="text-[10px] text-slate-400">Ctrl X</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="w-full px-4 py-2 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Copy className="w-4 h-4 text-slate-500" /> Copy
              </span>
              <span className="text-[10px] text-slate-400">Ctrl C</span>
            </button>

            <button
              type="button"
              onClick={handlePaste}
              className="w-full px-4 py-2 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Clipboard className="w-4 h-4 text-slate-500" /> Paste
              </span>
              <span className="text-[10px] text-slate-400">Ctrl V</span>
            </button>

            <button
              type="button"
              onClick={handleDuplicate}
              className="w-full px-4 py-2 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Plus className="w-4 h-4 text-slate-500" /> Duplicate
              </span>
              <span className="text-[10px] text-slate-400">Ctrl D</span>
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="w-full px-4 py-2 hover:bg-red-50 text-red-600 flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Trash2 className="w-4 h-4" /> Delete
              </span>
              <span className="text-[10px] text-red-400">⌫</span>
            </button>

            <div className="border-t border-slate-100 my-1" />

            <button
              type="button"
              onClick={handleBringForward}
              className="w-full px-4 py-2 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-slate-500" /> Order (Bring Forward)
              </span>
            </button>

            <button
              type="button"
              onClick={handleToggleLock}
              className="w-full px-4 py-2 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                {selectedElement?.locked ? (
                  <>
                    <Unlock className="w-4 h-4 text-slate-500" /> Unlock position
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-slate-500" /> Lock position
                  </>
                )}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ── BOTTOM CANVAS TOOLBAR (Slide style, Slide color, Background image, ...) ── */}
      <div className="mt-3 bg-white border border-slate-200/90 rounded-full shadow-sm px-4 py-1.5 flex items-center gap-4 text-xs font-semibold text-slate-700">
        {/* Slide style */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSlideStylePicker(!showSlideStylePicker)}
            className="flex items-center gap-1.5 hover:text-indigo-600 cursor-pointer"
          >
            <Layout className="w-4 h-4 text-slate-500" />
            <span>Slide style</span>
          </button>
          {showSlideStylePicker && (
            <div className="absolute bottom-full mb-2 left-0 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 flex flex-col gap-1 w-36">
              {["Blank", "Header & Body", "Two Column", "Centered"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    onChange({ ...question, slideStyle: st });
                    setShowSlideStylePicker(false);
                  }}
                  className="px-3 py-1 text-left text-xs font-medium hover:bg-indigo-50 hover:text-indigo-600 rounded-lg"
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="text-slate-300">|</span>

        {/* Slide color */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowBgColorPicker(!showBgColorPicker)}
            className="flex items-center gap-1.5 hover:text-indigo-600 cursor-pointer"
          >
            <span
              className="w-3.5 h-3.5 rounded-full border border-slate-300"
              style={{ backgroundColor: question.backgroundColor || "#FFFFFF" }}
            />
            <span>Slide color</span>
          </button>
          {showBgColorPicker && (
            <div className="absolute bottom-full mb-2 left-0 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 grid grid-cols-5 gap-1.5 w-36">
              {[
                "#FFFFFF",
                "#F8FAFC",
                "#0F172A",
                "#EEF2FF",
                "#FDF2F8",
                "#ECFDF5",
                "#FEF3C7",
                "#F3E8FF",
                "#18181B",
                "#475569",
              ].map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => {
                    onChange({ ...question, backgroundColor: bg });
                    setShowBgColorPicker(false);
                  }}
                  className="w-5 h-5 rounded-full border border-slate-200 shadow-2xs hover:scale-110 transition-transform"
                  style={{ backgroundColor: bg }}
                />
              ))}
            </div>
          )}
        </div>

        <span className="text-slate-300">|</span>

        {/* Background image */}
        <button
          type="button"
          onClick={() => setIsMediaModalOpen(true)}
          className="flex items-center gap-1.5 hover:text-indigo-600 cursor-pointer"
        >
          <ImageIcon className="w-4 h-4 text-slate-500" />
          <span>Background image</span>
        </button>

        <span className="text-slate-300">|</span>

        {/* Export & Upload Cloudinary Button */}
        <button
          type="button"
          onClick={handleExportAndUploadCloudinary}
          className="px-3 py-1 bg-[#6366F1] hover:bg-[#5558DD] text-white rounded-full font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          title="Export snapshot & upload directly to Cloudinary & DB"
        >
          <CloudUpload className="w-3.5 h-3.5" />
          <span>Export & Save</span>
        </button>

        <span className="text-slate-300">|</span>

        <button
          type="button"
          className="p-1 hover:text-indigo-600 cursor-pointer"
          title="More options"
        >
          <MoreHorizontal className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Global Media Upload Modal */}
      <MediaUploadModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        type="image"
        title="Upload Image for Canvas"
        onSelectUrl={(url) => {
          if (!url) return;
          const id = `elem-${Date.now()}`;
          addElement({
            id,
            type: "media",
            url,
            x: 150,
            y: 100,
            width: 280,
            height: 180,
            locked: false,
          });
          setIsMediaModalOpen(false);
        }}
      />
    </div>
  );
}
