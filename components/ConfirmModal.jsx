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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 p-6 shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        <div className="flex justify-end items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300/60 rounded-lg transition-colors cursor-pointer"
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
              className="px-3.5 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
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
            className={`px-3.5 py-2 text-xs font-bold text-white rounded-lg transition-colors shadow-sm cursor-pointer ${
              isDanger
                ? "bg-red-600 hover:bg-red-700 active:bg-red-800"
                : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
