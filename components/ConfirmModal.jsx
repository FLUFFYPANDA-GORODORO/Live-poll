"use client";

import React from "react";

export default function ConfirmModal({
  isOpen,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDanger = true,
  secondaryText = null,
  onSecondaryAction,
  onConfirm,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-md bg-white border border-slate-200 p-6 shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <h3 className="text-base font-bold text-slate-900 mb-1.5">{title}</h3>
        <p className="text-xs text-slate-600 mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors cursor-pointer shadow-2xs"
          >
            {cancelText}
          </button>
          {secondaryText && onSecondaryAction && (
            <button
              type="button"
              onClick={() => {
                onSecondaryAction();
                onClose();
              }}
              className="px-3.5 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors cursor-pointer shadow-2xs"
            >
              {secondaryText}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-xs font-bold text-white rounded-md transition-all shadow-sm cursor-pointer ${
              isDanger
                ? "bg-red-600 hover:bg-red-700 active:bg-red-800"
                : "bg-slate-950 hover:bg-slate-900 active:bg-black"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
