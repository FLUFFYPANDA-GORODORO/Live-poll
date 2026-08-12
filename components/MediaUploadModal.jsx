"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Upload, Link, Image as ImageIcon, Music, Loader2, Check, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

export default function MediaUploadModal({
  isOpen,
  onClose,
  onSelectUrl,
  initialUrl = "",
  type = "image", // "image" | "audio"
  title,
}) {
  const [activeTab, setActiveTab] = useState("upload"); // "upload" | "url"
  const [urlInput, setUrlInput] = useState(initialUrl || "");
  const [previewUrl, setPreviewUrl] = useState(initialUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setUrlInput(initialUrl || "");
    setPreviewUrl(initialUrl || "");
    setImageError(false);
  }, [initialUrl, isOpen]);

  if (!isOpen) return null;

  const defaultTitle = type === "audio" ? "Select or Upload Audio" : "Select or Upload Image";
  const modalTitle = title || defaultTitle;
  const isAudio = type === "audio";

  const handleFileSelect = async (file) => {
    if (!file) return;

    if (isAudio) {
      const allowedExts = [".mp3", ".wav", ".ogg", ".aac", ".m4a", ".flac"];
      const ext = "." + file.name.split(".").pop().toLowerCase();
      if (!allowedExts.includes(ext)) {
        toast.error("Invalid audio file format. Allowed: mp3, wav, ogg, aac, m4a, flac");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Audio size exceeds 50MB limit");
        return;
      }
    } else {
      const allowedExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
      const ext = "." + file.name.split(".").pop().toLowerCase();
      if (!allowedExts.includes(ext)) {
        toast.error("Invalid image format. Allowed: jpg, jpeg, png, gif, webp, svg");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size exceeds 10MB limit");
        return;
      }
    }

    try {
      setIsUploading(true);
      const folder = isAudio ? "polls/audio" : "polls/images";
      const result = isAudio
        ? await api.uploadAudio(file, folder)
        : await api.uploadImage(file, folder);

      if (result?.url) {
        setPreviewUrl(result.url);
        setUrlInput(result.url);
        toast.success(`${isAudio ? "Audio" : "Image"} uploaded to Cloudinary successfully!`);
      }
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      toast.error(err.message || "Failed to upload file to Cloudinary");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleApply = () => {
    const finalUrl = previewUrl || urlInput;
    onSelectUrl?.(finalUrl.trim());
    onClose?.();
  };

  const handleClear = () => {
    setPreviewUrl("");
    setUrlInput("");
    onSelectUrl?.("");
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-md max-w-lg w-full p-6 shadow-2xl relative text-left border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-950 flex items-center justify-center font-bold border border-slate-200">
              {isAudio ? <Music className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{modalTitle}</h3>
              <p className="text-xs text-slate-500">Upload to Cloudinary or paste a direct URL</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-md mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`flex-1 py-2 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "upload"
                ? "bg-slate-950 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-950"
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Upload File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`flex-1 py-2 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "url"
                ? "bg-slate-950 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-950"
            }`}
          >
            <Link className="w-3.5 h-3.5" /> Paste URL
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {activeTab === "upload" && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 min-h-[160px] ${
                dragActive
                  ? "border-slate-950 bg-slate-100"
                  : "border-slate-300 hover:border-slate-950 hover:bg-slate-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={isAudio ? "audio/*" : "image/*"}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-slate-950 animate-spin" />
                  <p className="text-xs font-bold text-slate-800">Uploading to Cloudinary...</p>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-md bg-slate-100 text-slate-950 flex items-center justify-center border border-slate-200">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isAudio
                        ? "MP3, WAV, OGG, AAC, M4A, FLAC (Max 50MB)"
                        : "PNG, JPG, JPEG, GIF, WEBP, SVG (Max 10MB)"}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "url" && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                Direct Media Link URL
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setPreviewUrl(e.target.value);
                }}
                placeholder={isAudio ? "https://example.com/audio.mp3" : "https://images.unsplash.com/photo-..."}
                className="w-full p-2.5 border border-slate-300 rounded-md text-xs outline-none focus:border-slate-950 font-medium text-slate-900"
              />
            </div>
          )}

          {/* Preview Section */}
          {Boolean(previewUrl?.trim()) && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Media Preview</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                  imageError ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                }`}>
                  {imageError ? "Invalid URL" : "Ready"}
                </span>
              </div>
              {isAudio ? (
                <audio controls src={previewUrl} className="w-full h-9 rounded-md" />
              ) : imageError ? (
                <div className="w-full h-28 rounded-md border border-slate-200 bg-slate-100 flex flex-col items-center justify-center text-slate-400 gap-1 p-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <span className="text-[11px] font-medium text-slate-600">Unable to load image from URL</span>
                </div>
              ) : (
                <div className="relative w-full h-36 rounded-md overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Media preview"
                    className="max-h-full max-w-full object-contain rounded-md"
                    onError={() => setImageError(true)}
                    onLoad={() => setImageError(false)}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-4">
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
          >
            Remove Current
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isUploading}
              className="px-5 py-2 rounded-md bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> Apply {isAudio ? "Audio" : "Image"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
