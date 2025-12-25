// src/components/AddClientModal.jsx
import { useEffect, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/$/, "");

export default function AddClientModal({ open, onClose, onCreated, initial }) {
  const isEdit = Boolean(initial);

  const emptyForm = {
    group: "",
    name: "",
    proposal_date: "",
    location: "",
    follow: "",
    proprietor: "",   // text field
    mediator: "",     // text field
    contact_no: "",
    file_seen: false, // boolean checkbox -> YES/NO
    status: "REJECTED",
    reason: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Prefill when opening in edit mode
  useEffect(() => {
    if (!open) return;
    setError(null);

    if (isEdit) {
      setForm({
        group: initial.group ?? "",
        name: initial.name ?? "",
        proposal_date: initial.proposal_date ? String(initial.proposal_date).slice(0, 10) : "",
        location: initial.location ?? "",
        follow: initial.follow ?? "",
        proprietor: initial.proprietor ?? "",
        mediator: initial.mediator ?? "",
        contact_no: initial.contact_no ?? "",
        file_seen: String(initial.file_seen ?? "").toUpperCase() === "YES",
        status: initial.status ?? "REJECTED",
        reason: initial.reason ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, isEdit, initial]);

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        group: form.group || null,
        name: form.name || null,
        proposal_date: form.proposal_date ? new Date(form.proposal_date).toISOString() : null,
        location: form.location || null,
        follow: form.follow || null,
        proprietor: form.proprietor?.trim() || null,
        mediator: form.mediator?.trim() || null,
        contact_no: form.contact_no || null,
        file_seen: form.file_seen ? "YES" : "NO",
        status: form.status || null,
        reason: form.reason || null,
      };

      const url = isEdit ? `${API_BASE}/clients/${initial.id}/` : `${API_BASE}/clients/`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }

      const row = await res.json();
      onCreated?.(row);
      onClose?.();
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 p-4 font-sans">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-800">
            {isEdit ? "Edit client" : "Add client"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-auto px-6 py-5">
          {error && (
            <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Group">
              <Input value={form.group} onChange={(e) => update("group", e.target.value)} />
            </Field>
            <Field label="Name" required>
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} required />
            </Field>

            <Field label="Proposal date">
              <Input type="date" value={form.proposal_date} onChange={(e) => update("proposal_date", e.target.value)} />
            </Field>
            <Field label="Location">
              <Input value={form.location} onChange={(e) => update("location", e.target.value)} />
            </Field>

            <Field label="Follow">
              <Input value={form.follow} onChange={(e) => update("follow", e.target.value)} />
            </Field>
            <Field label="Proprietor">
              <Input value={form.proprietor} onChange={(e) => update("proprietor", e.target.value)} />
            </Field>

            <Field label="Mediator">
              <Input value={form.mediator} onChange={(e) => update("mediator", e.target.value)} />
            </Field>
            <Field label="Contact no">
              <Input value={form.contact_no} onChange={(e) => update("contact_no", e.target.value)} />
            </Field>

            <Field label="File seen">
              {/* Light checkbox that keeps a light look when checked */}
              <label className="inline-flex select-none items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.file_seen}
                  onChange={(e) => update("file_seen", e.target.checked)}
                  className="
                    h-4 w-4 appearance-none rounded
                    border border-slate-300 bg-slate-50
                    outline-none ring-1 ring-inset ring-slate-200
                    checked:bg-slate-200 checked:ring-slate-300
                  "
                />
                <span className="text-sm text-slate-700">Yes</span>
              </label>
            </Field>

            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-400"
              >
                {["REJECTED", "PAYMENT", "PENDING", "FOLLOW UP", "ENQUIRED", "TRY IN FUTURE"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>

            <Field className="md:col-span-2" label="Reason">
              <textarea
                rows={4}
                value={form.reason}
                onChange={(e) => update("reason", e.target.value)}
                className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-400"
                placeholder="Notes / reason…"
              />
            </Field>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isEdit ? (saving ? "Updating…" : "Update") : (saving ? "Saving…" : "Save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ----- tiny presentational helpers ----- */

function Field({ label, children, className = "", required = false }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-sm font-medium text-slate-600">
        {label}{required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-400 ${props.className || ""}`}
    />
  );
}
