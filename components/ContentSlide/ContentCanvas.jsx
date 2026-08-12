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
  CloudUpload,
  Undo2,
  Redo2
} from "lucide-react";
import MediaUploadModal from "@/components/MediaUploadModal";
import ColorPalettePopover from "@/components/ContentSlide/ColorPalettePopover";
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
  selectedElementId: externalSelectedElementId,
  onSelectElementId,
}) {
  const elements = question.elements || [DEFAULT_TEXT_ELEMENT];

  // Selection state (Array of element IDs for single & multi-selection)
  const [selectedIds, setSelectedIds] = useState([externalSelectedElementId || elements[0]?.id].filter(Boolean));
  const selectedId = selectedIds[0] || null;
  const [editingTextId, setEditingTextId] = useState(null);

  useEffect(() => {
    if (externalSelectedElementId && !selectedIds.includes(externalSelectedElementId)) {
      setSelectedIds([externalSelectedElementId]);
    }
  }, [externalSelectedElementId]);

  // Undo / Redo History Stack Engine
  const historyRef = useRef([elements]);
  const historyIndexRef = useRef(0);
  const elementsRef = useRef(elements);
  elementsRef.current = elements;

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    historyRef.current = [elements];
    historyIndexRef.current = 0;
    setCanUndo(false);
    setCanRedo(false);
  }, [question.id]);

  const pushHistory = (newElems) => {
    const trimmed = historyRef.current.slice(0, historyIndexRef.current + 1);
    trimmed.push(newElems);
    if (trimmed.length > 40) trimmed.shift();
    historyRef.current = trimmed;
    historyIndexRef.current = trimmed.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  };

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const prev = historyRef.current[historyIndexRef.current];
      onChange({ ...question, elements: prev });
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const next = historyRef.current[historyIndexRef.current];
      onChange({ ...question, elements: next });
      setCanUndo(true);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    }
  };

  // Top toolbar popovers toggles
  const [showTextPicker, setShowTextPicker] = useState(false);
  const [showShapePicker, setShowShapePicker] = useState(false);
  const [shapeCategory, setShapeCategory] = useState("Essential"); // Essential, Lines, Sticky notes, Buttons and labels, Process
  const [editingTableCell, setEditingTableCell] = useState(null); // { id, rIdx, cIdx }
  const [showContextMenu, setShowContextMenu] = useState(null); // { x, y, id }
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showSlideStylePicker, setShowSlideStylePicker] = useState(false);
  const [clipboard, setClipboard] = useState(null); // Array of copied element objects
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaModalMode, setMediaModalMode] = useState("element"); // "element" | "background"

  // Dragging and Resizing state
  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const dragStartPositionsRef = useRef([]);
  const dragStartMouseRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ w: 0, h: 0, x: 0, y: 0 });

  const selectedElement = elements.find((e) => e.id === selectedId);

  const updateElements = (newElements, recordHistory = true) => {
    onChange({
      ...question,
      elements: newElements,
    });
    if (recordHistory) {
      pushHistory(newElements);
    }
  };

  const addElement = (newElem) => {
    const updated = [...elements, newElem];
    updateElements(updated, true);
    setSelectedIds([newElem.id]);
  };

  const updateSelectedElement = (partial) => {
    if (selectedIds.length === 0) return;
    const updated = elements.map((elem) =>
      selectedIds.includes(elem.id) ? { ...elem, ...partial } : elem
    );
    updateElements(updated, true);
  };

  // Close all popovers helper
  const closeAllPopovers = () => {
    setShowTextPicker(false);
    setShowShapePicker(false);
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

  const handleAddTable = () => {
    const id = `elem-${Date.now()}`;
    addElement({
      id,
      type: "table",
      x: 140,
      y: 90,
      width: 520,
      height: 220,
      headers: ["Header 1", "Header 2", "Header 3"],
      rows: [
        ["Item A", "10", "High"],
        ["Item B", "20", "Medium"],
        ["Item C", "35", "Low"],
      ],
      showHeader: true,
      headerBg: "#F8FAFC",
      headerColor: "#0F172A",
      borderColor: "#E2E8F0",
      locked: false,
    });
  };

  const handleUpdateTableCell = (elemId, rIdx, cIdx, value) => {
    const elem = elements.find((e) => e.id === elemId);
    if (!elem) return;
    if (rIdx === -1) {
      const newHeaders = [...(elem.headers || ["Header 1", "Header 2", "Header 3"])];
      newHeaders[cIdx] = value;
      updateSelectedElement({ headers: newHeaders });
    } else {
      const newRows = (elem.rows || []).map((row, rowI) => {
        if (rowI === rIdx) {
          const newRow = [...row];
          newRow[cIdx] = value;
          return newRow;
        }
        return row;
      });
      updateSelectedElement({ rows: newRows });
    }
  };

  const handleAddTableColumn = (elemId) => {
    const elem = elements.find((e) => e.id === elemId);
    if (!elem) return;
    const currentHeaders = elem.headers || ["Header 1", "Header 2", "Header 3"];
    const colCount = currentHeaders.length;
    const newHeaders = [...currentHeaders, `Header ${colCount + 1}`];
    const newRows = (elem.rows || [["", "", ""]]).map((row) => [...row, ""]);
    updateSelectedElement({
      headers: newHeaders,
      rows: newRows,
      width: Math.min(820, elem.width + 120),
    });
  };

  const handleRemoveTableColumn = (elemId) => {
    const elem = elements.find((e) => e.id === elemId);
    if (!elem) return;
    const headers = elem.headers || ["Header 1", "Header 2", "Header 3"];
    if (headers.length <= 1) return;
    const newHeaders = headers.slice(0, -1);
    const newRows = (elem.rows || []).map((row) => row.slice(0, -1));
    updateSelectedElement({
      headers: newHeaders,
      rows: newRows,
      width: Math.max(260, elem.width - 100),
    });
  };

  const handleAddTableRow = (elemId) => {
    const elem = elements.find((e) => e.id === elemId);
    if (!elem) return;
    const colCount = (elem.headers || ["Header 1", "Header 2", "Header 3"]).length;
    const emptyRow = Array(colCount).fill("");
    emptyRow[0] = `Item ${(elem.rows || []).length + 1}`;
    const newRows = [...(elem.rows || []), emptyRow];
    updateSelectedElement({
      rows: newRows,
      height: elem.height + 40,
    });
  };

  const handleRemoveTableRow = (elemId) => {
    const elem = elements.find((e) => e.id === elemId);
    if (!elem) return;
    const rows = elem.rows || [];
    if (rows.length <= 1) return;
    const newRows = rows.slice(0, -1);
    updateSelectedElement({
      rows: newRows,
      height: Math.max(120, elem.height - 40),
    });
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
    e.preventDefault();
    e.stopPropagation();

    let newSelectedIds = selectedIds;
    if (e.shiftKey) {
      if (selectedIds.includes(elem.id)) {
        newSelectedIds = selectedIds.filter((id) => id !== elem.id);
      } else {
        newSelectedIds = [...selectedIds, elem.id];
      }
    } else {
      if (!selectedIds.includes(elem.id)) {
        newSelectedIds = [elem.id];
      }
    }
    setSelectedIds(newSelectedIds);
    onSelectElementId?.(elem.id);
    setShowContextMenu(null);

    const canvasBounds = canvasRef.current.getBoundingClientRect();
    isDraggingRef.current = true;
    dragStartMouseRef.current = { x: e.clientX, y: e.clientY };
    dragStartPositionsRef.current = elements
      .filter((el) => newSelectedIds.includes(el.id))
      .map((el) => ({ id: el.id, x: el.x, y: el.y, width: el.width, height: el.height, locked: el.locked }));
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
    if (!canvasRef.current || selectedIds.length === 0) return;
    const canvasBounds = canvasRef.current.getBoundingClientRect();

    if (isDraggingRef.current) {
      const deltaX = e.clientX - dragStartMouseRef.current.x;
      const deltaY = e.clientY - dragStartMouseRef.current.y;

      const updated = elements.map((el) => {
        const start = dragStartPositionsRef.current.find((p) => p.id === el.id);
        if (start && !start.locked) {
          let newX = Math.round(start.x + deltaX);
          let newY = Math.round(start.y + deltaY);

          newX = Math.max(0, Math.min(newX, canvasBounds.width - start.width));
          newY = Math.max(0, Math.min(newY, canvasBounds.height - start.height));

          return { ...el, x: newX, y: newY };
        }
        return el;
      });

      updateElements(updated, false); // Don't push to history while continuously dragging
    } else if (isResizingRef.current && selectedId) {
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
    if (isDraggingRef.current || isResizingRef.current) {
      pushHistory(elementsRef.current);
    }
    isDraggingRef.current = false;
    isResizingRef.current = false;
  };

  // ── Group Context Menu & Action Methods ──
  const handleContextMenu = (e, elem) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedIds.includes(elem.id)) {
      setSelectedIds([elem.id]);
    }
    const canvasBounds = canvasRef.current.getBoundingClientRect();
    setShowContextMenu({
      x: e.clientX - canvasBounds.left,
      y: e.clientY - canvasBounds.top,
      id: elem.id,
    });
  };

  const handleDuplicate = () => {
    if (selectedIds.length === 0) return;
    const toDup = elements.filter((e) => selectedIds.includes(e.id));
    const now = Date.now();
    const dups = toDup.map((el, i) => ({
      ...el,
      id: `elem-${now}-${i}`,
      x: el.x + 20,
      y: el.y + 20,
    }));
    const updated = [...elements, ...dups];
    updateElements(updated, true);
    setSelectedIds(dups.map((d) => d.id));
    setShowContextMenu(null);
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) return;
    const updated = elements.filter((e) => !selectedIds.includes(e.id));
    updateElements(updated, true);
    setSelectedIds(updated[0]?.id ? [updated[0].id] : []);
    setShowContextMenu(null);
  };

  const handleCopy = () => {
    if (selectedIds.length === 0) return;
    const toCopy = elements.filter((e) => selectedIds.includes(e.id));
    setClipboard(toCopy);
    toast.success(`${toCopy.length} element(s) copied`);
    setShowContextMenu(null);
  };

  const handleCut = () => {
    if (selectedIds.length === 0) return;
    handleCopy();
    handleDelete();
  };

  const handlePaste = () => {
    if (!clipboard || clipboard.length === 0) return;
    const now = Date.now();
    const pasted = clipboard.map((el, i) => ({
      ...el,
      id: `elem-${now}-${i}`,
      x: el.x + 30,
      y: el.y + 30,
    }));
    const updated = [...elements, ...pasted];
    updateElements(updated, true);
    setSelectedIds(pasted.map((p) => p.id));
    toast.success(`${pasted.length} element(s) pasted`);
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
      updateElements(newElems, true);
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
      updateElements(newElems, true);
    }
    setShowContextMenu(null);
  };

  const handleToggleLock = () => {
    if (selectedIds.length === 0) return;
    const anyUnlocked = elements.some((e) => selectedIds.includes(e.id) && !e.locked);
    const updated = elements.map((e) =>
      selectedIds.includes(e.id) ? { ...e, locked: anyUnlocked } : e
    );
    updateElements(updated, true);
    setShowContextMenu(null);
  };

  // ── Global Keyboard Shortcuts Listener ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.isContentEditable);

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Undo: Ctrl+Z / Cmd+Z (when not holding shift)
      if (isCtrlOrCmd && key === "z" && !e.shiftKey) {
        if (!isInput) {
          e.preventDefault();
          handleUndo();
        }
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z / Cmd+Shift+Z
      if (isCtrlOrCmd && (key === "y" || (key === "z" && e.shiftKey))) {
        if (!isInput) {
          e.preventDefault();
          handleRedo();
        }
        return;
      }

      if (isInput) return; // Do not trigger keyboard shortcuts while typing inside text fields

      // Copy: Ctrl+C
      if (isCtrlOrCmd && key === "c") {
        e.preventDefault();
        handleCopy();
      }
      // Cut: Ctrl+X
      else if (isCtrlOrCmd && key === "x") {
        e.preventDefault();
        handleCut();
      }
      // Paste: Ctrl+V
      else if (isCtrlOrCmd && key === "v") {
        e.preventDefault();
        handlePaste();
      }
      // Duplicate: Ctrl+D
      else if (isCtrlOrCmd && key === "d") {
        e.preventDefault();
        handleDuplicate();
      }
      // Delete / Backspace
      else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDelete();
      }
      // Arrow Nudges
      else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        let dx = 0, dy = 0;
        if (e.key === "ArrowLeft") dx = -step;
        if (e.key === "ArrowRight") dx = step;
        if (e.key === "ArrowUp") dy = -step;
        if (e.key === "ArrowDown") dy = step;

        const updated = elementsRef.current.map((el) => {
          if (selectedIds.includes(el.id) && !el.locked) {
            return { ...el, x: Math.max(0, el.x + dx), y: Math.max(0, el.y + dy) };
          }
          return el;
        });
        updateElements(updated, true);
      }
      // Escape: Deselect all
      else if (e.key === "Escape") {
        setSelectedIds([]);
        closeAllPopovers();
        setShowContextMenu(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, clipboard, canUndo, canRedo]);

  // ── Global Pointer Event Listeners for Fail-Safe Drag & Resize (Excalidraw Pattern) ──
  useEffect(() => {
    const handleGlobalPointerMove = (e) => {
      if (!canvasRef.current || selectedIds.length === 0) return;
      if (!isDraggingRef.current && !isResizingRef.current) return;

      const canvasBounds = canvasRef.current.getBoundingClientRect();

      if (isDraggingRef.current) {
        const deltaX = e.clientX - dragStartMouseRef.current.x;
        const deltaY = e.clientY - dragStartMouseRef.current.y;

        const updated = elementsRef.current.map((el) => {
          const start = dragStartPositionsRef.current.find((p) => p.id === el.id);
          if (start && !start.locked) {
            let newX = Math.round(start.x + deltaX);
            let newY = Math.round(start.y + deltaY);

            newX = Math.max(0, Math.min(newX, canvasBounds.width - start.width));
            newY = Math.max(0, Math.min(newY, canvasBounds.height - start.height));

            return { ...el, x: newX, y: newY };
          }
          return el;
        });

        updateElements(updated, false);
      } else if (isResizingRef.current && selectedId) {
        const elem = elementsRef.current.find((el) => el.id === selectedId);
        if (!elem || elem.locked) return;

        const deltaX = e.clientX - resizeStartRef.current.x;
        const deltaY = e.clientY - resizeStartRef.current.y;

        const newW = Math.max(50, resizeStartRef.current.w + deltaX);
        const newH = Math.max(30, resizeStartRef.current.h + deltaY);

        const updated = elementsRef.current.map((el) =>
          el.id === selectedId ? { ...el, width: Math.round(newW), height: Math.round(newH) } : el
        );
        updateElements(updated, false);
      }
    };

    const handleGlobalPointerUp = () => {
      if (isDraggingRef.current || isResizingRef.current) {
        pushHistory(elementsRef.current);
      }
      isDraggingRef.current = false;
      isResizingRef.current = false;
    };

    window.addEventListener("pointermove", handleGlobalPointerMove);
    window.addEventListener("pointerup", handleGlobalPointerUp);
    return () => {
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
    };
  }, [selectedIds, selectedId]);

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
            setMediaModalMode("element");
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

        {/* TABLE BUTTON */}
        <button
          type="button"
          onClick={() => {
            closeAllPopovers();
            handleAddTable();
          }}
          className="flex flex-col items-center gap-1 text-slate-700 hover:text-indigo-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100/80 cursor-pointer"
          title="Add Custom Table"
        >
          <TableIcon className="w-5 h-5" />
          <span className="text-[11px] font-semibold">Table</span>
        </button>
      </div>

      {/* ── MAIN CANVAS WORKSPACE ── */}
      <div
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={() => {
          setSelectedIds([]);
          setEditingTextId(null);
          setShowContextMenu(null);
          closeAllPopovers();
          setShowColorPicker(false);
        }}
        className="w-full max-w-4xl h-[480px] rounded-[24px] border-[3.5px] border-slate-900/90 shadow-2xl relative overflow-visible transition-all bg-white"
      >
        {/* Background color / background image layer at lowest z-0 */}
        <div
          className="absolute inset-0 z-0 rounded-[20px] overflow-hidden pointer-events-none transition-all"
          style={{
            backgroundColor: question.backgroundColor || "#FFFFFF",
            backgroundImage: question.backgroundImage ? `url(${question.backgroundImage})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* Render Elements at z-10 and above */}
        {elements.map((elem) => {
          const isSelected = selectedIds.includes(elem.id);

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
                opacity: elem.opacity !== undefined ? elem.opacity : 1,
              }}
            >
              {/* FLOATING TOOLBAR ABOVE OR BELOW SELECTED ELEMENT */}
              {isSelected && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`absolute left-0 bg-white border border-slate-200/90 shadow-lg rounded-xl px-2 py-1 flex items-center gap-2 z-40 animate-fade-in shrink-0 whitespace-nowrap ${
                    elem.y < 55 ? "top-full mt-2" : "-top-12"
                  }`}
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

                  {/* TABLE ACTION CONTROLS */}
                  {elem.type === "table" && (
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => handleAddTableColumn(elem.id)}
                        className="px-2 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-700 rounded text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                        title="Add Column"
                      >
                        <Plus className="w-3 h-3 text-indigo-600" />
                        <span>Col</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveTableColumn(elem.id)}
                        disabled={(elem.headers || []).length <= 1}
                        className="px-1.5 py-1 bg-white hover:bg-rose-50 hover:text-rose-600 border border-slate-200 text-slate-700 disabled:opacity-40 rounded text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                        title="Remove Column"
                      >
                        <Minus className="w-3 h-3 text-rose-500" />
                        <span>Col</span>
                      </button>
                      <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />
                      <button
                        type="button"
                        onClick={() => handleAddTableRow(elem.id)}
                        className="px-2 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-700 rounded text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                        title="Add Row"
                      >
                        <Plus className="w-3 h-3 text-indigo-600" />
                        <span>Row</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveTableRow(elem.id)}
                        disabled={(elem.rows || []).length <= 1}
                        className="px-1.5 py-1 bg-white hover:bg-rose-50 hover:text-rose-600 border border-slate-200 text-slate-700 disabled:opacity-40 rounded text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                        title="Remove Row"
                      >
                        <Minus className="w-3 h-3 text-rose-500" />
                        <span>Row</span>
                      </button>
                      <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />
                      <button
                        type="button"
                        onClick={() => updateSelectedElement({ showHeader: elem.showHeader === false ? true : false })}
                        className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                          elem.showHeader !== false ? "bg-indigo-100 text-indigo-700" : "bg-white text-slate-600 hover:bg-slate-100"
                        }`}
                        title="Toggle Header Row"
                      >
                        Header
                      </button>
                    </div>
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
                  className="w-full h-full p-2 flex items-center focus:outline-none whitespace-pre-wrap select-none"
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
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setEditingTextId(null);
                        }
                      }}
                      onBlur={() => setEditingTextId(null)}
                      autoFocus
                      className="w-full h-full bg-transparent resize-none border-none outline-none focus:outline-none focus:ring-0 p-0 m-0 overflow-hidden leading-[1.2]"
                      style={{
                        fontSize: `${elem.fontSize || 32}px`,
                        fontWeight: elem.fontWeight || "normal",
                        fontStyle: elem.fontStyle || "normal",
                        fontFamily: elem.fontFamily === "mono" ? "monospace" : elem.fontFamily === "serif" ? "serif" : elem.fontFamily === "handdrawn" ? "cursive, sans-serif" : "sans-serif",
                        color: elem.color || elem.stroke || "#1E293B",
                        textAlign: elem.align || "left",
                        lineHeight: 1.2,
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: `${elem.fontSize || 32}px`,
                        fontWeight: elem.fontWeight || "normal",
                        fontStyle: elem.fontStyle || "normal",
                        fontFamily: elem.fontFamily === "mono" ? "monospace" : elem.fontFamily === "serif" ? "serif" : elem.fontFamily === "handdrawn" ? "cursive, sans-serif" : "sans-serif",
                        color: elem.color || elem.stroke || "#1E293B",
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

              {elem.type === "shape" && (() => {
                const strokeColor = elem.stroke || "#1E293B";
                const patternColor = (elem.fill && elem.fill !== "transparent") ? elem.fill : strokeColor;
                const isStripes = elem.fillFormat === "stripes";
                const isCrossHatch = elem.fillFormat === "crosshatch" || elem.fillFormat === "pattern";
                const isHollow = elem.isHollow || elem.fillFormat === "hollow" || elem.fill === "transparent";
                const strokeWidthVal = elem.strokeWidth || (isHollow || isStripes || isCrossHatch ? 2.5 : 0);

                const bgStyle = isStripes
                  ? {
                      backgroundImage: `repeating-linear-gradient(45deg, ${patternColor} 0, ${patternColor} 1.5px, transparent 0, transparent 8px)`,
                      backgroundSize: "12px 12px",
                      backgroundColor: "transparent",
                    }
                  : isCrossHatch
                  ? {
                      backgroundImage: `repeating-linear-gradient(45deg, ${patternColor} 0, ${patternColor} 1.5px, transparent 0, transparent 8px), repeating-linear-gradient(-45deg, ${patternColor} 0, ${patternColor} 1.5px, transparent 0, transparent 8px)`,
                      backgroundSize: "12px 12px",
                      backgroundColor: "transparent",
                    }
                  : {
                      backgroundColor: isHollow ? "transparent" : (elem.fill || "#6366F1"),
                    };

                return (
                  <div className="w-full h-full flex items-center justify-center">
                    {elem.shapeType === "circle" ? (
                      <div
                        className="w-full h-full rounded-full shadow-md"
                        style={{
                          ...bgStyle,
                          border: `${strokeWidthVal}px ${elem.strokeStyle || "solid"} ${strokeColor}`,
                        }}
                      />
                    ) : elem.shapeType === "triangle" ? (
                      <div
                        className="w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-b-[100px]"
                        style={{ borderBottomColor: strokeColor }}
                      />
                    ) : elem.shapeType === "line" ? (
                      <div className="w-full h-1" style={{ backgroundColor: strokeColor }} />
                    ) : elem.shapeType === "arrow" ? (
                      <div className="w-full flex items-center">
                        <div className="flex-1 h-1" style={{ backgroundColor: strokeColor }} />
                        <div className="w-0 h-0 border-t-6 border-t-transparent border-b-6 border-b-transparent border-l-8" style={{ borderLeftColor: strokeColor }} />
                      </div>
                    ) : elem.shapeType === "dashed" ? (
                      <div className="w-full h-1 border-b-2 border-dashed" style={{ borderColor: strokeColor }} />
                    ) : (
                      <div
                        className="w-full h-full shadow-md"
                        style={{
                          borderRadius: elem.borderRadius !== undefined ? `${elem.borderRadius}px` : "16px",
                          ...bgStyle,
                          border: `${strokeWidthVal}px ${elem.strokeStyle || "solid"} ${strokeColor}`,
                        }}
                      />
                    )}
                  </div>
                );
              })()}

              {elem.type === "media" && (
                <div className="w-full h-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center shadow-md relative">
                  {elem.url ? (
                    <img
                      src={elem.url}
                      alt="Media"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      className="w-full h-full object-cover select-none pointer-events-none"
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

              {elem.type === "table" && (() => {
                const headers = elem.headers || ["Header 1", "Header 2", "Header 3"];
                const rows = elem.rows || [
                  ["Item A", "10", "High"],
                  ["Item B", "20", "Medium"],
                  ["Item C", "35", "Low"],
                ];
                const showHeader = elem.showHeader !== false;

                return (
                  <div className="w-full h-full bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between select-none">
                    <div className="flex-1 overflow-auto">
                      <table className="w-full border-collapse text-xs">
                        {showHeader && (
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-800 font-bold">
                              {headers.map((h, cIdx) => {
                                const isEditing = editingTableCell?.id === elem.id && editingTableCell?.rIdx === -1 && editingTableCell?.cIdx === cIdx;
                                return (
                                  <th
                                    key={cIdx}
                                    onDoubleClick={(e) => {
                                      e.stopPropagation();
                                      setEditingTableCell({ id: elem.id, rIdx: -1, cIdx });
                                    }}
                                    className="p-2 border-r border-slate-200 last:border-r-0 text-left font-bold relative group"
                                  >
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        defaultValue={h}
                                        autoFocus
                                        onBlur={(e) => {
                                          handleUpdateTableCell(elem.id, -1, cIdx, e.target.value);
                                          setEditingTableCell(null);
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" || e.key === "Escape") {
                                            handleUpdateTableCell(elem.id, -1, cIdx, e.currentTarget.value);
                                            setEditingTableCell(null);
                                          }
                                        }}
                                        className="w-full bg-white px-1 py-0.5 border border-indigo-500 rounded font-bold text-xs text-slate-800 focus:outline-none"
                                      />
                                    ) : (
                                      <span className="cursor-text block truncate" title="Double-click to edit">{h || `Col ${cIdx + 1}`}</span>
                                    )}
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                        )}
                        <tbody>
                          {rows.map((row, rIdx) => (
                            <tr key={rIdx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors">
                              {row.map((cell, cIdx) => {
                                const isEditing = editingTableCell?.id === elem.id && editingTableCell?.rIdx === rIdx && editingTableCell?.cIdx === cIdx;
                                return (
                                  <td
                                    key={cIdx}
                                    onDoubleClick={(e) => {
                                      e.stopPropagation();
                                      setEditingTableCell({ id: elem.id, rIdx, cIdx });
                                    }}
                                    className="p-2 border-r border-slate-100 last:border-r-0 text-slate-700 font-medium relative group"
                                  >
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        defaultValue={cell}
                                        autoFocus
                                        onBlur={(e) => {
                                          handleUpdateTableCell(elem.id, rIdx, cIdx, e.target.value);
                                          setEditingTableCell(null);
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" || e.key === "Escape") {
                                            handleUpdateTableCell(elem.id, rIdx, cIdx, e.currentTarget.value);
                                            setEditingTableCell(null);
                                          }
                                        }}
                                        className="w-full bg-white px-1 py-0.5 border border-indigo-500 rounded text-xs text-slate-800 focus:outline-none"
                                      />
                                    ) : (
                                      <span className="cursor-text block truncate" title="Double-click to edit">
                                        {cell !== "" ? cell : <span className="text-slate-300 italic font-normal">Empty</span>}
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Quick Add Row footer bar when selected */}
                    {isSelected && !elem.locked && (
                      <div className="bg-slate-50/90 border-t border-slate-100 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAddTableRow(elem.id)}
                          className="font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer hover:underline"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Row</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddTableColumn(elem.id)}
                          className="font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer hover:underline"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Column</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

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
              top: `${showContextMenu.y > 240 ? Math.max(10, showContextMenu.y - 220) : showContextMenu.y}px`,
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

      {/* ── BOTTOM CANVAS TOOLBAR (Undo/Redo, Slide style, Slide color, Background image, ...) ── */}
      <div className="mt-3 bg-white border border-slate-200/90 rounded-full shadow-sm px-4 py-1.5 flex items-center gap-3 text-xs font-semibold text-slate-700">
        {/* UNDO & REDO BUTTONS */}
        <div className="flex items-center gap-1 pr-3 border-r border-slate-200">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
              canUndo
                ? "text-slate-700 hover:text-indigo-600 hover:bg-slate-100 active:scale-95 cursor-pointer"
                : "text-slate-300 cursor-not-allowed opacity-40"
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
              canRedo
                ? "text-slate-700 hover:text-indigo-600 hover:bg-slate-100 active:scale-95 cursor-pointer"
                : "text-slate-300 cursor-not-allowed opacity-40"
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

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
            <div className="absolute bottom-full mb-2 left-0 z-50">
              <ColorPalettePopover
                selectedColor={question.backgroundColor || "#FFFFFF"}
                showTransparent={false}
                onSelectColor={(bg) => {
                  onChange({ ...question, backgroundColor: bg });
                  setShowBgColorPicker(false);
                }}
              />
            </div>
          )}
        </div>

        <span className="text-slate-300">|</span>

        {/* Background image */}
        <div className="relative flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setMediaModalMode("background");
              setIsMediaModalOpen(true);
            }}
            className="flex items-center gap-1.5 hover:text-indigo-600 cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-slate-500" />
            <span>{question.backgroundImage ? "Change bg image" : "Background image"}</span>
          </button>
          {question.backgroundImage && (
            <button
              type="button"
              onClick={() => onChange({ ...question, backgroundImage: "" })}
              className="text-slate-400 hover:text-red-500 text-xs font-bold px-1"
              title="Remove background image"
            >
              ✕
            </button>
          )}
        </div>

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
        title={mediaModalMode === "background" ? "Upload Canvas Background Image" : "Upload Image for Canvas"}
        onSelectUrl={(url) => {
          if (!url) return;
          if (mediaModalMode === "background") {
            onChange({ ...question, backgroundImage: url });
          } else {
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
          }
          setIsMediaModalOpen(false);
        }}
      />
    </div>
  );
}
