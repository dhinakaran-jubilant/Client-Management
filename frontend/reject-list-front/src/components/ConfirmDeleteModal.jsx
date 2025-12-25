import React from "react";

export default function ConfirmDeleteModal({
  open,
  title = "Delete?",
  message = "Are you sure you want to delete this item?",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  loading = false,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] grid place-items-center bg-slate-900/60 px-4 font-sans">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="px-6 pt-6">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-2 text-sm text-slate-600">{message}</p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 px-6 pb-6">
          <button
            type="button"
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
