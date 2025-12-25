import { useEffect, useMemo, useRef, useState } from "react";
import AddClientModal from "../components/AddClientModal.jsx";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal.jsx";
import { useNavigate } from "react-router-dom";

/* ===== API helpers ===== */
const API_BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/$/, "");
const formatYMD = (iso) => (iso ? String(iso).slice(0, 10) : "—");
const asInt = (v) => {
  if (v == null || v === "") return "—";
  const num = Number(v);
  if (Number.isNaN(num)) {
    const digits = String(v).match(/\d+/g)?.join("") ?? "";
    return digits ? String(Math.trunc(Number(digits))) : "—";
  }
  return String(Math.trunc(num));
};
// Add this helper function with the other helper functions at the top of the file
function formatDateTime(isoString) {
  if (!isoString) return "—";
  
  const date = new Date(isoString);
  if (isNaN(date)) return "—";
  
  // Format date: DD/MM/YYYY
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  // Format time: HH:MM AM/PM
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  // Convert 24-hour to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  hours = String(hours).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
}

function getAuthHeader() {
  const token = localStorage.getItem('access_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, { 
    method: "GET",
    headers: { 
      Accept: "application/json",
      ...getAuthHeader()
    },
    credentials: 'include'
  });
  
  // Check if unauthorized
  if (res.status === 401) {
    // Try to refresh token
    const newToken = await refreshToken();
    if (newToken) {
      // Retry with new token
      return fetch(`${API_BASE}${path}`, { 
        method: "GET",
        headers: { 
          Accept: "application/json",
          'Authorization': `Bearer ${newToken}`
        },
        credentials: 'include'
      }).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      });
    } else {
      // Logout
      localStorage.clear();
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }
  
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiDelete(id) {
  const res = await fetch(`${API_BASE}/clients/${id}/`, {
    method: "DELETE",
    headers: { 
      Accept: "application/json",
      ...getAuthHeader()
    },
    credentials: 'include'
  });
  
  // Check if unauthorized
  if (res.status === 401) {
    // Try to refresh token
    const newToken = await refreshToken();
    if (newToken) {
      // Retry with new token
      return fetch(`${API_BASE}${path}`, { 
        method: "DELETE",
        headers: { 
          Accept: "application/json",
          'Authorization': `Bearer ${newToken}`
        },
        credentials: 'include'
      }).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      });
    } else {
      // Logout
      localStorage.clear();
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }
  
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiUpdate(id, data) {
  try {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(`${API_BASE}/clients/${id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRFToken": csrfToken,
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Update error:", error);
    throw error;
  }
}

function useDebounced(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => { const id = setTimeout(() => setV(value), delay); return () => clearTimeout(id); }, [value, delay]);
  return v;
}

/* ===== COPY + text helpers ===== */
const MONTHS3 = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

function fmtDMY(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

function getYear(iso) {
  if (!iso) return "UNKNOWN";
  const d = new Date(iso);
  return isNaN(d) ? "UNKNOWN" : String(d.getFullYear());
}

function getMonth3(iso) {
  if (!iso) return "UNKNOWN";
  const d = new Date(iso);
  return isNaN(d) ? "UNKNOWN" : MONTHS3[d.getMonth()];
}

function upperOrUnknown(v) {
  return v == null || String(v).trim() === "" ? "UNKNOWN" : String(v).toUpperCase();
}

function yesNoFromSeen(v) {
  if (v === true) return "YES";
  if (v === false) return "NO";
  const s = String(v ?? "").toUpperCase();
  return s === "YES" ? "YES" : s === "NO" ? "NO" : "UNKNOWN";
}

async function copyToClipboard(text) {
  // Works on HTTPS / localhost
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    await navigator.clipboard.writeText(text);
    return;
  }

  // Works on LAN HTTP (192.168.x.x)
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.top = "-9999px";
  ta.style.left = "-9999px";
  ta.setAttribute("readonly", "");
  document.body.appendChild(ta);
  ta.select();

  const success = document.execCommand("copy");
  document.body.removeChild(ta);

  if (!success) {
    throw new Error("Clipboard copy not supported");
  }
}

function makeCopyText(r) {
  const proposal = fmtDMY(r?.proposal_date);
  const year     = getYear(r?.proposal_date);
  const month3   = getMonth3(r?.proposal_date);
  const contact  = (() => {
    const v = asInt(r?.contact_no);
    return v === "—" ? "UNKNOWN" : v;
  })();

  return [
    `NAME: *${upperOrUnknown(r?.name)}*`,
    `PROPOSAL DATE: *${proposal === "—" ? "UNKNOWN" : proposal}*`,
    `YEAR: *${year}*`,
    `MONTH: *${month3}*`,
    `LOCATION: *${upperOrUnknown(r?.location)}*`,
    `FOLLOW: *${upperOrUnknown(r?.follow)}*`,
    `PROPRIETOR: *${upperOrUnknown(r?.proprietor)}*`,
    `CONTACT NO: *${contact}*`,
    `FILE SEEN YES/NO: *${yesNoFromSeen(r?.file_seen)}*`,
    `STATUS: *${upperOrUnknown(r?.status)}*`,
    `REASON: *${upperOrUnknown(r?.reason)}*`
  ].join("\n");
}

/* ===== Export to Excel helpers ===== */
function exportToExcel(filteredRows, filterParams) {
  if (filteredRows.length === 0) {
    alert("No data to export!");
    return;
  }

  // Generate filename based on active filters
  const fileNameParts = [];
  
  if (filterParams.groupFilter !== "ALL") {
    fileNameParts.push(`group_${filterParams.groupFilter.toLowerCase().replace(/\s+/g, '_')}`);
  }
  if (filterParams.followFilter !== "ALL") {
    fileNameParts.push(`follow_${filterParams.followFilter.toLowerCase().replace(/\s+/g, '_')}`);
  }
  if (filterParams.yearFilter !== "ALL") {
    fileNameParts.push(`year_${filterParams.yearFilter}`);
  }
  if (filterParams.monthFilter !== "ALL") {
    fileNameParts.push(`month_${filterParams.monthFilter.toLowerCase()}`);
  }
  if (filterParams.statusFilter !== "ALL") {
    fileNameParts.push(`status_${filterParams.statusFilter.toLowerCase().replace(/\s+/g, '_')}`);
  }
  if (filterParams.fileSeenFilter !== "ALL") {
    fileNameParts.push(`file_${filterParams.fileSeenFilter.toLowerCase()}`);
  }
  if (filterParams.search && filterParams.search.trim() !== "") {
    fileNameParts.push(`search_${filterParams.search.toLowerCase().replace(/\s+/g, '_').substring(0, 20)}`);
  }
  
  const fileName = fileNameParts.length > 0 
    ? fileNameParts.join('_') + '.xlsx' 
    : 'all_clients.xlsx';

  // Create Excel workbook using SheetJS (xlsx library)
  const XLSX = window.XLSX;
  
  // Prepare data for export
  const exportData = filteredRows.map((row, index) => ({
    "Sl.No": index + 1,
    "Group": row.group || "—",
    "Name": row.name || "—",
    "Proposal Date": formatYMD(row.proposal_date),
    "Location": row.location || "—",
    "Follow": row.follow || "—",
    "Proprietor": row.proprietor || "—",
    "Mediator": row.mediator || "—",
    "Contact No": asInt(row.contact_no),
    "File Seen": yesNoFromSeen(row.file_seen),
    "Status": row.status || "—",
    "Reason": row.reason || "—"
  }));

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(exportData);
  
  // Add styling (borders and column widths)
  const wscols = [
    { wch: 8 },   // Sl.No
    { wch: 15 },  // Group
    { wch: 30 },  // Name
    { wch: 15 },  // Proposal Date
    { wch: 20 },  // Location
    { wch: 15 },  // Follow
    { wch: 20 },  // Proprietor
    { wch: 20 },  // Mediator
    { wch: 15 },  // Contact No
    { wch: 12 },  // File Seen
    { wch: 15 },  // Status
    { wch: 40 }   // Reason
  ];
  
  ws['!cols'] = wscols;
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clients");
  
  // Generate and download file
  XLSX.writeFile(wb, fileName);
}

/* ===== Small UI bits ===== */
function SearchBar({ value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search clients..."
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 focus:border-slate-400"
        />
      </div>
    </div>
  );
}

function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    red: "bg-red-50 text-red-700 ring-1 ring-red-200", // Add red tone
  };
  return <span className={`inline-flex items-center ring-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${tones[tone]}`}>{children}</span>;
}

function StatusPill({ status }) {
  if (!status) return null;
  const raw = String(status).trim();
  const U = raw.toUpperCase().replace(/\s+/g, " ");
  const U_NOSPACE = raw.toUpperCase().replace(/\s+/g, "");
  let cls = "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
  if (U === "REJECTED") cls = "bg-red-50 text-red-700 ring-red-200 ring-1 ring-inset";
  else if (U === "PAYMENT") cls = "bg-sky-50 text-sky-700 ring-sky-200 ring-1 ring-inset";
  else if (U === "PENDING") cls = "bg-amber-50 text-amber-700 ring-amber-200 ring-1 ring-inset";
  else if (U === "TRY IN FUTURE") cls = "bg-slate-50 text-slate-700 ring-slate-200 ring-1 ring-inset";
  else if (U === "ENQUIRED") cls = "bg-violet-50 text-violet-700 ring-violet-200 ring-1 ring-inset";
  else if (U === "FOLLOW UP" || U_NOSPACE === "FOLLOWUP") cls = "bg-indigo-50 text-indigo-700 ring-indigo-200 ring-1 ring-inset";
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${cls}`}>{raw}</span>;
}

/** Row actions */
function ActionsCell({ row, onEdit, onDelete, userInfo, onViewDetails }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    const place = () => {
      if (!btnRef.current || !menuRef.current) return;
      const pad = 8;
      const br = btnRef.current.getBoundingClientRect();
      const mr = menuRef.current.getBoundingClientRect();
      let left = Math.min(br.right - mr.width, window.innerWidth - mr.width - pad);
      left = Math.max(pad, left);
      let top = br.bottom + pad;
      if (br.bottom + mr.height + pad > window.innerHeight) top = Math.max(pad, br.top - mr.height - pad);
      setPos({ top, left });
    };
    place();
    const onScroll = () => place();
    const onResize = () => place();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (!menuRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleEditClick = () => {
    setOpen(false);
    onEdit?.(row);
  };

  const handleDeleteClick = () => {
    setOpen(false);
    onDelete?.(row.id);
  };

  const handleViewClick = () => {
    setOpen(false);
    onViewDetails?.(row);
  };

  return (
    <div className="relative flex justify-center">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 hover:bg-white hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-70">
          <circle cx="12" cy="5.5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="18.5" r="1.8" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="fixed z-[9999] w-40 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg"
          style={{ top: `${pos.top}px`, left: `${pos.left}px` }}
        >
          {/* View Details Button - Available for all users */}
          <button
            type="button"
            onClick={handleViewClick}
            className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            role="menuitem"
          >
            View Details
          </button>
          
          {/* Edit Button - Only for Team Lead */}
          {userInfo.isTeamLead && (
            <button
              type="button"
              onClick={handleEditClick}
              className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              role="menuitem"
            >
              Edit
            </button>
          )}
          
          {/* Delete Button - Only for Team Lead */}
          {userInfo.isTeamLead && (
            <button
              onClick={handleDeleteClick}
              className="block w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
              role="menuitem"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Pagination({
  page,
  pageSize,
  totalItems,
  onPrev,
  onNext,
  onPageSizeChange,
  onFirst, // NEW
  onLast,
}) {
  const hasItems = totalItems > 0;
  const start = hasItems ? (page - 1) * pageSize + 1 : 0;
  const end = hasItems ? Math.min(totalItems, page * pageSize) : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-3">
      <div className="flex items-center gap-4 text-sm">
        <span className="text-slate-500">
          Showing <span className="font-medium text-slate-700">{start}</span>–
          <span className="font-medium text-slate-700">{end}</span> of{" "}
          <span className="font-medium text-slate-700">{totalItems}</span>
        </span>

        <label className="flex items-center gap-2 text-slate-500">
          Rows:
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700"
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>

        <span className="text-slate-400">
          Page {page} of {totalPages}
        </span>
      </div>

      <div className="flex items-center gap-1">
      {/* FIRST (<<) */}
      <button
        className="rounded-md border border-slate-200 bg-white p-2 text-slate-700 disabled:opacity-40"
        onClick={onFirst}
        disabled={page <= 1}
        title="First page"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4">
          <path
            d="M11 6l-6 6 6 6M19 6l-6 6 6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* PREV (<) */}
      <button
        className="rounded-md border border-slate-200 bg-white p-2 text-slate-700 disabled:opacity-40"
        onClick={onPrev}
        disabled={page <= 1}
        title="Previous page"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4">
          <path
            d="M15 18l-6-6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* NEXT (>) */}
      <button
        className="rounded-md border border-slate-200 bg-white p-2 text-slate-700 disabled:opacity-40"
        onClick={onNext}
        disabled={end >= totalItems}
        title="Next page"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4">
          <path
            d="M9 6l6 6-6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* LAST (>>) */}
      <button
        className="rounded-md border border-slate-200 bg-white p-2 text-slate-700 disabled:opacity-40"
        onClick={onLast}
        disabled={page >= totalPages}
        title="Last page"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4">
          <path
            d="M5 6l6 6-6 6M13 6l6 6-6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
    </div>
  );
}

/* ===== Client Details Card Component ===== */
function ClientDetailsCard({ client, onClose, userInfo, onUpdate }) {
  if (!client) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);

  // Initialize edited data when client changes
  useEffect(() => {
    setEditedData({
      name: client.name || "",
      status: client.status || "",
      file_seen: client.file_seen || false,
      reason: client.reason || ""
    });
  }, [client]);

  const formatField = (value, defaultValue = "—") => {
    return value == null || String(value).trim() === "" ? defaultValue : String(value);
  };

  const copyDetails = async () => {
    const details = makeCopyText(client);
    try {
      await navigator.clipboard.writeText(details);
      alert("Details copied to clipboard!");
    } catch (e) {
      alert("Copy failed. " + (e?.message ?? ""));
    }
  };

  const handleInputChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSeenToggle = () => {
    setEditedData(prev => ({
      ...prev,
      file_seen: prev.file_seen === true || prev.file_seen === "YES" ? false : true
    }));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset to original data
    setEditedData({
      name: client.name || "",
      status: client.status || "",
      file_seen: client.file_seen || false,
      reason: client.reason || ""
    });
  };

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      
      // Prepare updated data
      const updatedData = {
        ...client,
        name: editedData.name,
        status: editedData.status,
        file_seen: editedData.file_seen,
        reason: editedData.reason,
        updated_at: new Date().toISOString()
      };

      // Call the onUpdate callback if provided
      if (onUpdate) {
        const success = await onUpdate(client.id, updatedData);
        if (success) {
          setIsEditing(false);
        }
      } else {
        // Fallback: Show success message and exit edit mode
        alert("Update successful!");
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Update failed: " + (error.message || "Unknown error"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  // Determine if any changes were made
  const hasChanges = 
    editedData.name !== (client.name || "") ||
    editedData.status !== (client.status || "") ||
    editedData.file_seen !== client.file_seen ||
    editedData.reason !== (client.reason || "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header with close button in top right */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {isEditing ? "Edit Client Details" : "Client Details"}
            </h2>
            <p className="text-sm text-slate-500">ID: {client.id}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Close details"
            disabled={isUpdating}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Name</div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.name || ""}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-base text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                      placeholder="Enter name"
                    />
                  ) : (
                    <div className="text-base font-medium text-slate-900">{formatField(client.name)}</div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Group</div>
                    <div className="text-sm text-slate-700">{formatField(client.group)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Status</div>
                    {isEditing ? (
                      <select
                        value={editedData.status || ""}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                      >
                        <option value="">Select status</option>
                        <option value="REJECTED">REJECTED</option>
                        <option value="PAYMENT">PAYMENT</option>
                        <option value="PENDING">PENDING</option>
                        <option value="FOLLOW UP">FOLLOW UP</option>
                        <option value="ENQUIRED">ENQUIRED</option>
                        <option value="TRY IN FUTURE">TRY IN FUTURE</option>
                        <option value="UNKNOWN">UNKNOWN</option>
                      </select>
                    ) : (
                      <div className="text-sm">
                        {client.status ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            client.status.toUpperCase() === "REJECTED" ? "bg-red-100 text-red-800" :
                            client.status.toUpperCase() === "PAYMENT" ? "bg-sky-100 text-sky-800" :
                            client.status.toUpperCase() === "PENDING" ? "bg-amber-100 text-amber-800" :
                            client.status.toUpperCase() === "FOLLOW UP" ? "bg-indigo-100 text-indigo-800" :
                            client.status.toUpperCase() === "ENQUIRED" ? "bg-violet-100 text-violet-800" :
                            "bg-slate-100 text-slate-800"
                          }`}>
                            {client.status}
                          </span>
                        ) : "—"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Proposal Details */}
            <div>
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">Proposal Details</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Proposal Date</div>
                  <div className="text-sm text-slate-700">{fmtDMY(client.proposal_date)}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Year</div>
                    <div className="text-sm text-slate-700">{getYear(client.proposal_date)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Month</div>
                    <div className="text-sm text-slate-700">{getMonth3(client.proposal_date)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">Contact Information</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Location</div>
                  <div className="text-sm text-slate-700">{formatField(client.location)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Contact Number</div>
                  <div className="text-sm text-slate-700">{asInt(client.contact_no)}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Follow</div>
                    <div className="text-sm text-slate-700">{formatField(client.follow)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Proprietor</div>
                    <div className="text-sm text-slate-700">{formatField(client.proprietor)}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Mediator</div>
                  <div className="text-sm text-slate-700">{formatField(client.mediator)}</div>
                </div>
              </div>
            </div>

            {/* Case Details */}
            <div>
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">Case Details</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">File Seen</div>
                  {isEditing ? (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleFileSeenToggle}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          editedData.file_seen === true || editedData.file_seen === "YES" 
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                            : "bg-red-100 text-red-800 border border-red-200"
                        }`}
                      >
                        {editedData.file_seen === true || editedData.file_seen === "YES" ? "YES" : "NO"}
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm">
                      {(() => {
                        const value = yesNoFromSeen(client.file_seen);
                        if (value === "YES") {
                          return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">YES</span>;
                        } else if (value === "NO") {
                          return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">NO</span>;
                        } else {
                          return <span className="text-slate-400">UNKNOWN</span>;
                        }
                      })()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Reason</div>
                  {isEditing ? (
                    <textarea
                      value={editedData.reason || ""}
                      onChange={(e) => handleInputChange('reason', e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                      placeholder="Enter reason"
                      rows={4}
                    />
                  ) : (
                    <div className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-md p-3 border border-slate-200">
                      {formatField(client.reason)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div>
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">Additional Information</h3>
              <div className="text-xs text-slate-500 space-y-1">
                <div>Created: {client.created_at ? formatDateTime(client.created_at) : "—"}</div>
                <div>Updated: {client.updated_at ? formatDateTime(client.updated_at) : "—"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex justify-between items-center">
            <button
              onClick={copyDetails}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Copy details to clipboard"
              disabled={isEditing || isUpdating}
            >
              Copy Details
            </button>
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={!hasChanges || isUpdating}
                    className={`rounded-md px-4 py-2 text-sm font-medium ${
                      hasChanges && !isUpdating
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {isUpdating ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Updating...
                      </span>
                    ) : (
                      "Update"
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </button>
                  {userInfo.isTeamLead && (
                    <button
                      onClick={handleEditClick}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Edit
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== Page ===== */
export default function CasesDashboard() {
  const navigate = useNavigate();
  
  // Get user info from localStorage
  const [userInfo] = useState({
    username: localStorage.getItem("username") || "",
    isTeamLead: localStorage.getItem("is_team_lead") === "true",
    isAuthenticated: true, // ShellLayout already guards this
  });

  // search
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search);

  // filters - ADDED groupFilter
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fileSeenFilter, setFileSeenFilter] = useState("ALL");
  const [followFilter, setFollowFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");
  const [monthFilter, setMonthFilter] = useState("ALL");

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // data
  const [allRows, setAllRows] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  // modals
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDel, setConfirmDel] = useState({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  // selection + copy state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const anySelected = selectedIds.size > 0;
  const [copied, setCopied] = useState(false);

  // Track if any search/filter is active
  const [hasActiveSearchOrFilter, setHasActiveSearchOrFilter] = useState(false);

  // Details card state
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDetailsCard, setShowDetailsCard] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setErr(null);
        const data = await apiGet("/clients/");
        setAllRows(Array.isArray(data) ? data : [data]);
      } catch (e) {
        setErr(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Check if any search or filter is active
  useEffect(() => {
    const hasSearch = debouncedSearch.trim() !== "";
    const hasFilter = 
      statusFilter !== "ALL" || 
      fileSeenFilter !== "ALL" || 
      followFilter !== "ALL" || 
      yearFilter !== "ALL" || 
      monthFilter !== "ALL" ||
      groupFilter !== "ALL";  // Added groupFilter
    
    setHasActiveSearchOrFilter(hasSearch || hasFilter);
  }, [debouncedSearch, statusFilter, fileSeenFilter, followFilter, yearFilter, monthFilter, groupFilter]);

  // Reset page + selection + copied label when filters/search/pageSize change
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
    setCopied(false);
  }, [debouncedSearch, statusFilter, fileSeenFilter, followFilter, yearFilter, monthFilter, groupFilter, pageSize]);

  // Reset copied label whenever selection changes
  useEffect(() => { setCopied(false); }, [selectedIds]);

  // Close details card when clicking outside or pressing Escape
  useEffect(() => {
    if (!showDetailsCard) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setShowDetailsCard(false);
      }
    };

    const handleClickOutside = (e) => {
      if (e.target.closest('.bg-white.rounded-xl') === null) {
        setShowDetailsCard(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDetailsCard]);

  // options
  const statusOptions = ["ALL","REJECTED","PAYMENT","PENDING","FOLLOW UP","ENQUIRED","TRY IN FUTURE","UNKNOWN"];
  const fileSeenOptions = ["ALL", "YES", "NO", "UNKNOWN"];

  // Group options function - ADDED
  const groupOptions = useMemo(() => {
    const set = new Set();
    for (const r of allRows) set.add(upperOrUnknown(r?.group));
    const list = Array.from(set).filter(v => v !== "UNKNOWN").sort((a,b)=>a.localeCompare(b));
    return ["ALL", ...list, "UNKNOWN"];
  }, [allRows]);

  const followOptions = useMemo(() => {
    const set = new Set();
    for (const r of allRows) set.add(upperOrUnknown(r?.follow));
    const list = Array.from(set).filter(v => v !== "UNKNOWN").sort((a,b)=>a.localeCompare(b));
    return ["ALL", ...list, "UNKNOWN"];
  }, [allRows]);

  const yearOptions = useMemo(() => {
    const set = new Set();
    for (const r of allRows) {
      const y = getYear(r?.proposal_date);
      set.add(y);
    }
    const years = Array.from(set).filter(v => v !== "UNKNOWN").sort((a,b)=>Number(b)-Number(a));
    const hasUnknown = Array.from(set).includes("UNKNOWN");
    return ["ALL", ...years, ...(hasUnknown ? ["UNKNOWN"] : [])];
  }, [allRows]);

  const monthOptions = useMemo(() => ["ALL", ...MONTHS3, "UNKNOWN"], []);

  // Filtering - UPDATED with groupFilter
  const filtered = useMemo(() => {
    // If no search or filters are active, return empty array
    if (!hasActiveSearchOrFilter) {
      return [];
    }
    
    const q = debouncedSearch.trim().toLowerCase();
    return allRows.filter((r) => {
      const matchesSearch = !q || [
        r.id, r.group, r.name, r.location, r.follow, r.status, r.reason,
      ].map(x => (x == null ? "" : String(x).toLowerCase())).some(s => s.includes(q));
      if (!matchesSearch) return false;

      const d = r?.proposal_date ? new Date(r.proposal_date) : null;
      const hasDate = d && !isNaN(d);

      // Group filter check - ADDED
      if (groupFilter !== "ALL" && upperOrUnknown(r.group) !== groupFilter) return false;

      if (followFilter !== "ALL" && upperOrUnknown(r.follow) !== followFilter) return false;

      if (yearFilter !== "ALL") {
        const y = hasDate ? String(d.getFullYear()) : "UNKNOWN";
        if (y !== yearFilter) return false;
      }
      if (monthFilter !== "ALL") {
        const m3 = hasDate ? MONTHS3[d.getMonth()] : "UNKNOWN";
        if (m3 !== monthFilter) return false;
      }

      if (statusFilter !== "ALL") {
        const raw = (r.status ?? "").toString().trim();
        const s = raw ? raw.toUpperCase().replace(/\s+/g, " ") : "UNKNOWN";
        if (s !== statusFilter) return false;
      }

      if (fileSeenFilter !== "ALL" && yesNoFromSeen(r.file_seen) !== fileSeenFilter) return false;

      return true;
    });
  }, [allRows, debouncedSearch, groupFilter, followFilter, yearFilter, monthFilter, statusFilter, fileSeenFilter, hasActiveSearchOrFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  // selection helpers
  function toggleOne(id, checked) {
    setSelectedIds(prev => {
      const s = new Set(prev);
      if (checked) s.add(id); else s.delete(id);
      return s;
    });
  }
  
  function toggleAllPage(checked) {
    setSelectedIds(prev => {
      const s = new Set(prev);
      pageRows.forEach(r => { if (checked) s.add(r.id); else s.delete(r.id); });
      return s;
    });
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setFileSeenFilter("ALL");
    setFollowFilter("ALL");
    setYearFilter("ALL");
    setMonthFilter("ALL");
    setGroupFilter("ALL"); // Added
    setSelectedIds(new Set());
    setCopied(false);
    setPage(1);
  }

  // Handle Export to Excel
  const handleExportToExcel = () => {
    if (filtered.length === 0) {
      alert("No data to export!");
      return;
    }

    // Check if SheetJS is loaded
    if (!window.XLSX) {
      alert("Excel export library not loaded. Please refresh the page.");
      return;
    }

    const filterParams = {
      groupFilter,
      followFilter,
      yearFilter,
      monthFilter,
      statusFilter,
      fileSeenFilter,
      search: debouncedSearch
    };

    exportToExcel(filtered, filterParams);
  };

  // Function to handle batch edit navigation
  const handleBatchEdit = () => {
    if (!anySelected) return;
    
    const selected = filtered.filter(r => selectedIds.has(r.id));
    if (selected.length === 0) return;
    
    // Navigate to edit page with selected clients
    navigate('/clients/new', {
      state: {
        editMode: true,
        clients: selected,
        selectedIds: Array.from(selectedIds)
      }
    });
  };

  // Function to handle single row edit
  const handleSingleEdit = (row) => {
    navigate('/clients/new', {
      state: {
        editMode: true,
        clients: [row],
        selectedIds: [row.id]
      }
    });
  };

  // Function to handle delete
  const handleDelete = (id) => {
    setConfirmDel({ open: true, id });
  };

  // Function to handle view details
  const handleViewDetails = (client) => {
    setSelectedClient(client);
    setShowDetailsCard(true);
  };

  // Function to handle row click (for viewing details)
  const handleRowClick = (client, e) => {
    // Don't trigger if clicking on checkbox or actions menu
    if (e.target.type === 'checkbox' || e.target.closest('button')) {
      return;
    }
    handleViewDetails(client);
  };

  // Function to handle client updates
  const handleUpdateClient = async (id, updatedData) => {
    try {
      const updatedClient = await apiUpdate(id, updatedData);
      
      // Update the local state
      setAllRows(prevRows => 
        prevRows.map(row => row.id === id ? updatedClient : row)
      );

      // Update the selected client in the details card
      setSelectedClient(updatedClient);
      
      // Show success message
      alert("Client updated successfully!");
      
      return true;
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update client: " + error.message);
      return false;
    }
  };

  return (
    <div className="font-sans h-screen overflow-hidden bg-slate-50">
      <main className="min-w-0 h-full flex flex-col">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-[20px] py-4">
          <div className="mb-3 text-base font-semibold text-slate-800">Reject Client List</div>
          <div className="flex items-center gap-3">
            {/* Search bar with reduced width */}
            <div className="relative flex-1 min-w-[300px]">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 focus:border-slate-400"
              />
            </div>

            {/* Action buttons moved next to search bar */}
            <div className="flex items-center gap-2">
              {/* Export Button - Only for Team Lead */}
              {userInfo.isTeamLead && (
                <button
                  type="button"
                  onClick={handleExportToExcel}
                  disabled={!hasActiveSearchOrFilter || filtered.length === 0}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1 text-sm font-medium ${hasActiveSearchOrFilter && filtered.length > 0 ? "bg-green-600 text-white hover:bg-green-700" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                  title={hasActiveSearchOrFilter && filtered.length > 0 ? "Export filtered results to Excel" : "Apply filters to export"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Export
                </button>
              )}

              {/* Edit Button - For batch editing */}
              {userInfo.isTeamLead && (
                <button
                  type="button"
                  onClick={handleBatchEdit}
                  disabled={!anySelected}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1 text-sm font-medium ${anySelected ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                  title={anySelected ? "Edit selected rows" : "Select row(s) to edit"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </button>
              )}

              {/* Copy Button */}
              <button
                type="button"
                onClick={async () => {
                  const selected = filtered.filter(r => selectedIds.has(r.id));
                  if (selected.length === 0) return;
                  const payload = selected.map((r) => makeCopyText(r)).join("\n\n");
                  try { await navigator.clipboard.writeText(payload); setCopied(true); }
                  catch (e) { alert("Copy failed. " + (e?.message ?? "")); }
                }}
                disabled={!anySelected}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1 text-sm font-medium ${anySelected ? "bg-black text-white hover:opacity-90" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                title={anySelected ? "Copy selected rows" : "Select row(s) to copy"}
              >
                <svg width="14" height="14" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12z"/>
                  <path fill="currentColor" d="M20 5H8a2 2 0 0 0-2 2v14h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zM8 21V7h12v14z"/>
                </svg>
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </header>

        {/* Filters row - with adjusted width for options */}
        <div className="px-[20px] py-4 bg-white border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            {/* Group filter - ADDED */}
            <label className="flex items-center gap-2 min-w-[160px]">
              <span className="text-sm text-slate-600 whitespace-nowrap">Group</span>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700"
              >
                {groupOptions.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>

            {/* Follow */}
            <label className="flex items-center gap-2 min-w-[160px]">
              <span className="text-sm text-slate-600 whitespace-nowrap">Follow</span>
              <select
                value={followFilter}
                onChange={(e) => setFollowFilter(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700"
              >
                {followOptions.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>

            {/* Year */}
            <label className="flex items-center gap-2 min-w-[140px]">
              <span className="text-sm text-slate-600 whitespace-nowrap">Year</span>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700"
              >
                {yearOptions.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>

            {/* Month */}
            <label className="flex items-center gap-2 min-w-[140px]">
              <span className="text-sm text-slate-600 whitespace-nowrap">Month</span>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700"
              >
                {monthOptions.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>

            {/* File seen */}
            <label className="flex items-center gap-2 min-w-[140px]">
              <span className="text-sm text-slate-600 whitespace-nowrap">File seen</span>
              <select
                value={fileSeenFilter}
                onChange={(e) => setFileSeenFilter(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700"
              >
                {fileSeenOptions.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>

            {/* Status */}
            <label className="flex items-center gap-2 min-w-[140px]">
              <span className="text-sm text-slate-600 whitespace-nowrap">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700"
              >
                {statusOptions.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>

            {/* Clear button - icon only */}
            <button
              type="button"
              onClick={clearFilters}
              title="Reset all filters"
              className="ml-2 inline-flex items-center justify-center rounded-md p-2 text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-200/80"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 3-6.708" />
                <path d="M3 4v6h6" />
              </svg>
            </button>
          </div>
        </div>

        <section className="mx-[20px] my-4 rounded-xl border border-slate-200 bg-white flex-1 min-h-0 flex">
          <div className="flex-1 min-h-0 overflow-hidden rounded-xl">
            <div className="h-full flex flex-col min-h-0">
              <div className="flex-1 overflow-auto nice-scroll">
                {/* Responsive table that adjusts to available width */}
                <div className="relative overflow-x-auto">
                  <table className="w-full min-w-full divide-y divide-slate-200">
                    <thead className="sticky top-0 z-20 bg-slate-50">
                      <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                        <th className="sticky left-0 bg-slate-50 px-3 py-3 whitespace-nowrap z-30">
                          <label className="relative inline-flex h-4 w-5 items-center justify-center">
                            <input
                              type="checkbox"
                              onChange={(e) => toggleAllPage(e.target.checked)}
                              checked={pageRows.length > 0 && pageRows.every(r => selectedIds.has(r.id))}
                              aria-label="Select all on page"
                              className="peer h-4 w-4 appearance-none rounded-md border border-gray-600 bg-white transition-all hover:border-gray-700 focus:outline-none checked:bg-white checked:border-gray-700"
                            />
                            <svg viewBox="0 0 20 20" className="pointer-events-none absolute h-3 w-3 text-gray-700 opacity-0 transition-opacity peer-checked:opacity-100">
                              <path d="M5 10l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </label>
                        </th>
                        <th className="px-3 py-3 whitespace-nowrap w-32">Group</th>
                        <th className="px-3 py-3 whitespace-nowrap min-w-[100px] max-w-[240px]">Name</th>
                        <th className="px-3 py-3 whitespace-nowrap w-28">Date</th>
                        <th className="px-3 py-3 whitespace-nowrap min-w-[90px] max-w-[180px]">Location</th>
                        <th className="px-3 py-3 whitespace-nowrap w-32">Follow</th>
                        <th className="px-3 py-3 whitespace-nowrap w-20">File</th>
                        <th className="px-3 py-3 whitespace-nowrap w-28">Status</th>
                        <th className="px-3 py-3 whitespace-nowrap min-w-[120px]">Reason</th>
                        <th className="px-3 py-3 whitespace-nowrap w-16">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 text-xs">
                      {loading ? (
                        <tr>
                          <td colSpan="10" className="px-3 py-6 text-center text-sm text-slate-500">
                            Loading...
                          </td>
                        </tr>
                      ) : err ? (
                        <tr>
                          <td colSpan="10" className="px-3 py-6 text-center text-sm text-red-500">
                            Error: {err}
                          </td>
                        </tr>
                      ) : !hasActiveSearchOrFilter ? (
                        // Show message when no search/filter is active
                        <tr>
                          <td colSpan="10" className="px-3 py-8 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                              <p className="font-medium text-slate-700">Search or filter to view clients</p>
                              <p className="text-slate-500 mt-1 text-sm">Use the search bar or filters above to find clients</p>
                            </div>
                          </td>
                        </tr>
                      ) : filtered.length === 0 ? (
                        // Show message when search/filter is active but no results
                        <tr>
                          <td colSpan="10" className="px-3 py-8 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="font-medium text-slate-700">No clients found</p>
                              <p className="text-slate-500 mt-1 text-sm">Try adjusting your search or filters</p>
                            </div>
                          </td>
                        </tr>
                      ) : pageRows.length === 0 ? (
                        <tr>
                          <td colSpan="10" className="px-3 py-6 text-center text-sm text-slate-500">
                            No data to display
                          </td>
                        </tr>
                      ) : (
                        pageRows.map((r) => (
                          <tr 
                            key={r.id} 
                            className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                            onClick={(e) => handleRowClick(r, e)}
                          >
                            <td className="sticky left-0 bg-white px-3 py-3 whitespace-nowrap z-20">
                              <label className="relative inline-flex h-5 w-5 items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(r.id)}
                                  onChange={(e) => toggleOne(r.id, e.target.checked)}
                                  aria-label={`Select row ${r.id}`}
                                  className="peer h-4 w-4 appearance-none rounded-md border border-gray-600 bg-white transition-all hover:border-gray-700 focus:outline-none checked:bg-white checked:border-gray-700"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <svg viewBox="0 0 20 20" className="pointer-events-none absolute h-3 w-3 text-gray-700 opacity-0 transition-opacity peer-checked:opacity-100">
                                  <path d="M5 10l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </label>
                            </td>
                            <td className="px-3 py-3 text-sm text-slate-900 truncate max-w-[128px]" title={r.group ?? ""}>
                              <span className="text-[14px] text-slate-900">{r.group ?? "—"}</span>
                            </td>
                            <td className="px-3 py-3 truncate max-w-[240px]" title={r.name ?? ""}>
                              <span className="text-[14px] text-slate-900">
                                {r.name ?? "—"}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-[14px] text-slate-900 whitespace-nowrap">
                              {fmtDMY(r.proposal_date)}
                            </td>
                            <td className="px-3 py-3 text-[14px] text-slate-900 truncate max-w-[180px]" title={r.location ?? ""}>
                              {r.location ?? "—"}
                            </td>
                            <td className="px-3 py-3 text-[14px] text-slate-700 truncate max-w-[128px]" title={r.follow ?? ""}>
                              {r.follow ?? "—"}
                            </td>
                            <td className="px-3 py-3 text-[14px]">
                              {(() => {
                                const value = yesNoFromSeen(r.file_seen);
                                if (value === "YES") {
                                  return <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">YES</span>;
                                } else if (value === "NO") {
                                  return <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800">NO</span>;
                                } else {
                                  return <span className="text-slate-400 text-[11px]">—</span>;
                                }
                              })()}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              {r.status ? (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                  r.status.toUpperCase() === "REJECTED" ? "bg-red-100 text-red-800" :
                                  r.status.toUpperCase() === "PAYMENT" ? "bg-sky-100 text-sky-800" :
                                  r.status.toUpperCase() === "PENDING" ? "bg-amber-100 text-amber-800" :
                                  "bg-slate-100 text-slate-800"
                                }`}>
                                  {r.status}
                                </span>
                              ) : <span className="text-slate-400 text-[11px]">—</span>}
                            </td>
                            <td className="px-3 py-3 text-[14px] text-slate-700">
                              <div className="whitespace-normal break-words line-clamp-2 max-w-[300px]" title={r.reason ?? ""}>
                                {r.reason ?? "—"}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <ActionsCell
                                row={r}
                                onEdit={handleSingleEdit}
                                onDelete={handleDelete}
                                onViewDetails={handleViewDetails}
                                userInfo={userInfo}
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Create / Edit modal */}
                <AddClientModal
                  open={showAdd}
                  initial={editing}
                  onClose={() => { setShowAdd(false); setEditing(null); }}
                  onCreated={(row) => {
                    if (editing) setAllRows((rows) => rows.map((x) => (x.id === row.id ? row : x)));
                    else setAllRows((rows) => [row, ...rows]);
                    setEditing(null);
                  }}
                />

                {/* Delete confirm modal */}
                <ConfirmDeleteModal
                  open={confirmDel.open}
                  title="Delete?"
                  message="Are you sure you want to delete this client?"
                  loading={deleting}
                  onCancel={() => setConfirmDel({ open: false, id: null })}
                  onConfirm={async () => {
                    if (!confirmDel.id) return;
                    try {
                      setDeleting(true);
                      await apiDelete(confirmDel.id);
                      setAllRows(rows => rows.filter(x => x.id !== confirmDel.id));
                    } catch (e) {
                      alert(e.message || "Delete failed");
                    } finally {
                      setDeleting(false);
                      setConfirmDel({ open: false, id: null });
                    }
                  }}
                />
              </div>

              {/* Only show pagination when there are results */}
              {hasActiveSearchOrFilter && filtered.length > 0 && (
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  totalItems={filtered.length}
                  onFirst={() => setPage(1)}
                  onPrev={() => setPage((p) => Math.max(1, p - 1))}
                  onNext={() => setPage((p) => Math.min(Math.max(1, Math.ceil(filtered.length / pageSize)), p + 1))}
                  onLast={() => setPage(Math.max(1, Math.ceil(filtered.length / pageSize)))}
                  onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
                />
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Client Details Card Modal */}
      {showDetailsCard && selectedClient && (
        <ClientDetailsCard
          client={selectedClient}
          onClose={() => setShowDetailsCard(false)}
          userInfo={userInfo}
          onUpdate={handleUpdateClient}
        />
      )}
    </div>
  );
}