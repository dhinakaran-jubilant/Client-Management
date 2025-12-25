import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const API_BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/$/, "");

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// API POST for creating new clients
async function apiPost(body) {
  try{
    const csrfToken = getCookie('csrftoken');
      console.log("CSRF Token from cookie:", csrfToken);
      
      if (!csrfToken) {
        throw new Error("CSRF token not found. Please refresh the page.");
      }
      const r = await fetch(`${API_BASE}/clients/`, {
      method: "POST",
      credentials: 'include',
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify(body),
    });
    console.log(r)
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      throw new Error(t || `HTTP ${r.status}`);
    }
  }catch (err) {
      console.error("Add Clients error:", err);
      setError(err.message || "Add Clients error");
    }
  try {
    return await r.json();
  } catch {
    return body;
  }
}

// API PUT for updating existing clients
async function apiPut(id, body) {
  try{
    const csrfToken = getCookie('csrftoken');
      console.log("CSRF Token from cookie:", csrfToken);
      
      if (!csrfToken) {
        throw new Error("CSRF token not found. Please refresh the page.");
      }
      const r = await fetch(`${API_BASE}/clients/${id}/`, {
        method: "PUT",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const t = await r.text().catch(() => "");
        throw new Error(t || `HTTP ${r.status}`);
      }
  }catch (err) {
      console.error("Update Clients error:", err);
      setError(err.message || "Update Clients error");
    }
  try {
    return await r.json();
  } catch {
    return body;
  }
}

// Group options from your data
const GROUP_OPTIONS = [
  "ACPL CLIENT",
  "JC CHENNAI",
  "ICS REST OF TN",
  "SSS GRP",
  "EVERGREENGROUP",
  "OFFICE",
  "JC REST OF TN",
  "INSPECTION GRP",
  "JC SALES",
  "KERALA NEW",
  "MEDIATOR GRP",
  "JC BANGALORE",
  "ICS CH NEW INS",
  "REJECT",
  "Rest of TN+JC NEW ENQ",
  "ICS KERALA CLIENTS",
  "INDIVIDUAL",
  "DIRECT",
  "JC CREDIT",
].sort((a, b) => a.localeCompare(b));

// Follow options from your data
const FOLLOW_OPTIONS = [
  "SUDHAKAR",
  "ANAND",
  "KOUSHIK",
  "VIMALRAJ",
  "GANESH",
  "RISHI",
  "MANIKANDAN",
  "JAYASEELAN",
  "GAUTHAM",
  "KAVITHAACPL",
  "MUTHAIAH",
  "DEEPIKA ACPL",
  "VEERAPPAN",
  "PANDIAN",
  "Null",
  "RAJ",
  "SAJI",
  "MOORTHY",
  "JEGAN",
  "SANTHANAM",
  "SHINU",
  "SRIRAM",
  "JOTHIPRAKASH",
  "OFFICE",
  "SANTHOSH",
  "RAMALINGAM",
  "MATHESWARAN",
  "SARAVANAN",
  "NANDHINI",
  "BABURAJ",
  "RAMANI",
  "ARUNKUMAR",
  "SURENDAR",
  "BALAMURUGAN",
  "RAMKI",
  "CREDIT",
  "KUMAR",
  "PRAKESH",
  "PUTHIYARAJ ACPL",
  "EVERGREENGROUP",
  "STEPHEN",
  "RAM",
  "BOOPATHY",
  "SANTHOSHCOLLECTION",
  "COLLECT",
  "VENKATESH",
  "VENKATESHACPL",
  "SANTHOSH ACPL",
  "GOPIMADHAN",
  "SIVAKUMAR",
  "CHANDRU",
  "SILAMBARASAN ACPL",
  "AJITHKUMAR",
  "RAJPRAKASH",
  "YAJNESH",
  "VIMALKUMAR",
  "SRITHAR",
  "MOHANRAJ ACPL",
  "MUTHUKUMAR ACPL",
  "SARAVANAKUMAR ACPL",
  "BALAKUMAR",
  "VISHNU",
  "BHUVANSHANKAR ACPL",
  "EARIAH ACPL",
  "MATHAN ACPL",
  "DEVADATHAN",
  "LAKSHMANAN ACPL",
  "SUDHAKAR COLLECTION",
  "MUTHUMANI ACPL",
  "RITHISH",
].sort((a, b) => a.localeCompare(b));

const STATUS_OPTS = [
  "REJECTED",
  "PAYMENT",
  "PENDING",
  "FOLLOW UP",
  "ENQUIRED",
  "TRY IN FUTURE",
  "UNKNOWN",
].sort((a, b) => a.localeCompare(b));

const EMPTY = {
  group: "",
  name: "",
  proposal_date: "",
  location: "",
  follow: "",
  proprietor: "",
  mediator: "",
  contact_no: "",
  file_seen: false,
  status: "REJECTED",
  reason: "",
};

function PillInput(props) {
  const { readOnly, className = "", ...rest } = props;
  
  if (readOnly) {
    return (
      <div
        className={`h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-600 flex items-center ${className}`}
      >
        {props.value || ""}
      </div>
    );
  }
  
  return (
    <input
      {...rest}
      className={`h-8 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] text-slate-800 outline-none focus:border-slate-400 ${className}`}
    />
  );
}

// New component for Group dropdown
function GroupDropdown({ value, onChange, readOnly, className = "" }) {
  if (readOnly) {
    return (
      <div
        className={`h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-600 flex items-center ${className}`}
      >
        {value || ""}
      </div>
    );
  }
  
  return (
    <select
      value={value}
      onChange={onChange}
      className={`h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[13px] text-slate-800 focus:border-slate-400 ${className}`}
    >
      <option value="">Select Group</option>
      {GROUP_OPTIONS.map((group) => (
        <option key={group} value={group}>
          {group}
        </option>
      ))}
    </select>
  );
}

// New component for Follow dropdown
function FollowDropdown({ value, onChange, readOnly, className = "" }) {
  if (readOnly) {
    return (
      <div
        className={`h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-600 flex items-center ${className}`}
      >
        {value || ""}
      </div>
    );
  }
  
  return (
    <select
      value={value}
      onChange={onChange}
      className={`h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[13px] text-slate-800 focus:border-slate-400 ${className}`}
    >
      <option value="">Select Follow</option>
      {FOLLOW_OPTIONS.map((follow) => (
        <option key={follow} value={follow}>
          {follow}
        </option>
      ))}
    </select>
  );
}

/** --- CSV helpers -------------------------------------------------------- **/

// tiny CSV splitter that handles commas inside "quotes"
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        q = !q;
      }
    } else if (c === "," && !q) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseCsv(text) {
  // Split by newlines and filter out completely empty lines
  const lines = text
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  
  if (lines.length === 0) return { headers: [], rows: [] };
  
  // Use the first non-empty line as headers
  let headers = splitCsvLine(lines[0]).map((h) => h.trim());
  
  // Check if headers are empty (just commas) - if so, this might be an empty row
  const isEmptyHeader = headers.every(h => h === "");
  
  // Start from line 1 if headers are valid, otherwise check if line 1 has headers
  let startRow = 1;
  if (isEmptyHeader && lines.length > 1) {
    // Try using line 1 as headers
    const possibleHeaders = splitCsvLine(lines[1]).map((h) => h.trim());
    if (!possibleHeaders.every(h => h === "")) {
      headers = possibleHeaders;
      startRow = 2;
    }
  }
  
  // Process rows starting from the determined start row
  const rows = [];
  for (let i = startRow; i < lines.length; i++) {
    const row = splitCsvLine(lines[i]);
    // Only add non-empty rows
    if (!row.every(cell => cell === "")) {
      rows.push(row);
    }
  }
  
  return { headers, rows };
}

// header aliases → our field names
const HEADER_MAP = {
  group: "group",
  name: "name",
  "client name": "name",
  "proposal date": "proposal_date",
  date: "proposal_date",
  location: "location",
  city: "location",
  follow: "follow",
  proprietor: "proprietor",
  owner: "proprietor",
  mediator: "mediator",
  "contact no": "contact_no",
  "contact": "contact_no",
  phone: "contact_no",
  file: "file_seen",
  "file seen": "file_seen",
  status: "status",
  reason: "reason",
};

function normalizeDateLike(s) {
  if (!s) return "";
  // try to accept dd-mm-yyyy, dd/mm/yyyy, yyyy-mm-dd
  const t = String(s).trim().replace(/\//g, "-");
  const m1 = t.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`;
  const m2 = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m2) return t;
  const d = new Date(t);
  if (!isNaN(d)) {
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  }
  return "";
}

function toBoolYesNo(v) {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "yes" || s === "y" || s === "true" || s === "1";
}

function mapCsvRow(headers, arr) {
  const obj = { ...EMPTY };
  headers.forEach((hRaw, idx) => {
    const key =
      HEADER_MAP[hRaw.trim().toLowerCase()] ??
      hRaw.trim().toLowerCase().replace(/\s+/g, "_");
    const val = arr[idx] ?? "";
    switch (key) {
      case "proposal_date":
        obj.proposal_date = normalizeDateLike(val);
        break;
      case "file_seen":
        obj.file_seen = toBoolYesNo(val);
        break;
      case "contact_no":
        obj.contact_no = String(val).replace(/\D+/g, "");
        break;
      case "status": {
        const up = String(val || "").toUpperCase().trim();
        obj.status = STATUS_OPTS.includes(up) ? up : EMPTY.status;
        break;
      }
      default:
        if (key in obj) obj[key] = String(val ?? "").trim();
    }
  });
  return obj;
}

// Helper function to check if a row is empty
function isRowEmpty(row) {
  return (
    !row.name?.trim() &&
    !row.group?.trim() &&
    !row.proposal_date?.trim() &&
    !row.location?.trim() &&
    !row.follow?.trim() &&
    !row.proprietor?.trim() &&
    !row.mediator?.trim() &&
    !row.contact_no?.trim() &&
    row.reason?.trim() === "" &&
    row.status === "REJECTED" && // default status
    row.file_seen === false // default file_seen
  );
}

export default function AddClientsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Authentication state - set default values
  const [auth, setAuth] = useState({
    loading: false,
    isAuthenticated: true,
    isTeamLead: true,
    username: ''
  });

  const truncateText = (text, maxLength = 12) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  // Check if we're in edit mode from navigation state
  const editMode = location.state?.editMode || false;
  const clientsToEdit = location.state?.clients || [];
  
  // Initialize rows based on mode
  const [rows, setRows] = useState(() => {
    if (editMode && clientsToEdit.length > 0) {
      // Convert client data to form rows
      return clientsToEdit.map(client => ({
        id: client.id, // Keep the ID for update
        group: client.group || "",
        name: client.name || "",
        proposal_date: client.proposal_date ? 
          client.proposal_date.split('T')[0] : "",
        location: client.location || "",
        follow: client.follow || "",
        proprietor: client.proprietor || "",
        mediator: client.mediator || "",
        contact_no: client.contact_no || "",
        file_seen: client.file_seen === "YES" || client.file_seen === true,
        status: client.status || "REJECTED",
        reason: client.reason || "",
      }));
    }
    return [{ ...EMPTY }];
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [importing, setImporting] = useState(false);

  const addRow = () => {
    // Only Team Lead can add rows
    if (!auth.isTeamLead && !editMode) {
      alert('Only Team Lead can add new clients');
      return;
    }
    setRows((r) => [...r, { ...EMPTY }]);
  };
  
  const removeRow = (i) => {
    // Only Team Lead can remove rows in add mode
    if (!auth.isTeamLead && !editMode) {
      return;
    }
    setRows((r) => (r.length > 1 ? r.filter((_, idx) => idx !== i) : r));
  };
  
  // Update function that respects edit mode restrictions
  const update = (i, k, v) => {
    if (editMode) {
      // In edit mode, allow editing Name, File, Status, Reason
      const editableFields = ["name", "file_seen", "status", "reason"];
      if (!editableFields.includes(k)) {
        return; // Don't update non-editable fields
      }
    } else {
      // In add mode, only Team Lead can edit
      if (!auth.isTeamLead) {
        return;
      }
    }
    
    setRows((r) => {
      const c = [...r];
      c[i] = { ...c[i], [k]: v };
      return c;
    });
  };

  // Accept only digits in UI for contact_no
  const onContactChange = (i, e) => {
    if (!editMode && auth.isTeamLead) {
      update(i, "contact_no", (e.target.value || "").replace(/\D+/g, ""));
    }
  };

  /** Import CSV / Excel (CSV handled in-browser) */
  const fileInputId = "client-import-file";
  async function handleFile(e) {
    // Only Team Lead can import
    if (!auth.isTeamLead) {
      alert('Only Team Lead can import clients');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;
    setMsg("");
    setImporting(true);
    try {
      const ext = file.name.toLowerCase().split(".").pop();
      if (ext !== "csv") {
        setMsg(
          "Only CSV is supported in this build. Please export your Excel sheet as CSV and import again."
        );
        return;
      }
      const text = await file.text();
      const { headers, rows: rawRows } = parseCsv(text);
      if (!headers.length || !rawRows.length) {
        setMsg("CSV appears empty or invalid.");
        return;
      }
      const mapped = rawRows
        .map((arr) => mapCsvRow(headers, arr))
        .filter((r) => r.name?.trim()); // require name
      if (mapped.length === 0) {
        setMsg("No valid rows found in CSV (Name is required).");
        return;
      }
      
      // Filter out empty rows from existing rows before adding imported ones
      const filteredExistingRows = rows.filter(row => !isRowEmpty(row));
      
      // If all existing rows are empty, keep only one empty row
      const existingRows = filteredExistingRows.length > 0 ? filteredExistingRows : [{ ...EMPTY }];
      
      setRows([...existingRows, ...mapped]);
      setMsg(`Imported ${mapped.length} row(s) from CSV. Removed ${rows.length - filteredExistingRows.length} empty row(s).`);
    } catch (err) {
      setMsg(`Import failed: ${err.message || err}`);
    } finally {
      setImporting(false);
      // reset input so same file can be chosen again if needed
      e.target.value = "";
    }
  }

  function downloadTemplate() {
    // Only Team Lead can download template
    if (!auth.isTeamLead) {
      alert('Only Team Lead can download templates');
      return;
    }

    const headers = [
      "Group",
      "Name",
      "Proposal Date",
      "Location",
      "Follow",
      "Proprietor",
      "Mediator",
      "Contact No",
      "File", // YES/NO
      "Status",
      "Reason",
    ];
    const sample = [
      "ACME",
      "John Traders",
      "2025-01-15",
      "Coimbatore",
      "Vimalraj",
      "Owner Name",
      "Mediator Name",
      "9876543210",
      "YES",
      "REJECTED",
      "Already rejected",
    ];
    const csv = [headers.join(","), sample.map((s) => `"${String(s).replace(/"/g, '""')}"`).join(",")].join(
      "\r\n"
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clients_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSave() {
    // Check permissions
    if (editMode) {
      // In edit mode, anyone can save (but only certain fields)
      // No additional check needed
    } else {
      // In add mode, only Team Lead can save
      if (!auth.isTeamLead) {
        alert('Only Team Lead can add new clients');
        return;
      }
    }

    setSaving(true);
    setMsg("");

    // Filter out empty rows before saving
    const rowsToSave = rows.filter(row => !isRowEmpty(row) && row.name?.trim());
    
    if (rowsToSave.length === 0) {
      setSaving(false);
      setMsg("No valid client data to save. Please fill in at least the Name field.");
      return;
    }

    const created = [];
    const updated = [];
    const errs = [];

    for (let i = 0; i < rowsToSave.length; i++) {
      const f = rowsToSave[i];

      if (!f.name?.trim()) {
        errs.push(`Row ${i + 1}: Name is required`);
        continue;
      }

      const body = {
        group: f.group || null,
        name: f.name || null,
        proposal_date: f.proposal_date
          ? new Date(f.proposal_date).toISOString()
          : null,
        location: f.location || null,
        follow: f.follow || null,
        proprietor: f.proprietor || null,
        mediator: f.mediator || null,
        contact_no: f.contact_no ? String(f.contact_no) : null, // send as string of digits
        file_seen: f.file_seen ? "YES" : "NO",
        status: f.status || null,
        reason: f.reason || null,
      };

      try {
        if (editMode && f.id) {
          // Update existing client
          const res = await apiPut(f.id, body);
          updated.push(res);
        } else {
          // Create new client - only if manager
          if (!auth.isTeamLead) {
            errs.push(`Row ${i + 1}: Only Team Lead can create new clients`);
            continue;
          }
          const res = await apiPost(body);
          created.push(res);
        }
      } catch (e) {
        errs.push(`Row ${i + 1}: ${e.message}`);
      }
    }

    setSaving(false);

    if (errs.length === 0) {
      navigate("/clients");
    } else {
      const actionText = editMode ? "updated" : "saved";
      setMsg(
        `${created.length + updated.length} ${actionText}, ${errs.length} failed.\n${errs.join("\n")}`
      );
    }
  }

  // Determine page title and button text based on mode
  const pageTitle = editMode ? `Edit Clients (${rows.length} selected)` : "Add Client";
  const saveButtonText = editMode ? "Update Clients" : "Save Clients";

  // Determine which columns to show based on edit mode
  const showProprietorColumn = !editMode;
  const showMediatorColumn = !editMode;
  const showContactNoColumn = !editMode;

  return (
    <main className="flex-1 min-w-0 bg-white h-screen">
      {/* 80% width, centered */}
      <div className="mx-auto w-full max-w-[1600px] px-6 py-6 ">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-slate-800">{pageTitle}</h1>

          <div className="flex items-center gap-3">
            {/* Only show import and template buttons in add mode for Team Lead */}
            {!editMode && auth.isTeamLead && (
              <>
                {/* Import CSV */}
                <input
                  id={fileInputId}
                  type="file"
                  accept=".csv, text/csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={handleFile}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById(fileInputId).click()}
                  disabled={importing}
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  title="Import clients from CSV"
                >
                  {importing ? "Importing…" : "Import CSV"}
                </button>

                {/* Download template */}
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Template
                </button>
              </>
            )}

            {/* Only show add row button in add mode for Team Lead */}
            {!editMode && auth.isTeamLead && (
              <button
                type="button"
                onClick={addRow}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                + Add New Row
              </button>
            )}
          </div>
        </div>

        {/* Add a note in edit mode */}
        {editMode && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <p className="font-medium">Edit Mode:</p>
            <p>Only Name, File, Status, and Reason fields are editable. Other fields are view-only.</p>
            <p className="mt-1 text-xs">Selected clients: {rows.length}</p>
          </div>
        )}

        {/* Permission warning for non-Team Lead in add mode */}
        {!editMode && !auth.isTeamLead && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <p className="font-medium">Access Restricted:</p>
            <p>Only Team Lead can add new clients. Please contact a manager for assistance.</p>
          </div>
        )}

        {/* Fixed height container with proper scrolling */}
        <div className="rounded-xl border border-slate-200 bg-white flex flex-col" style={{ height: 'calc(100vh - 100px)' }}>
          {/* Scrollable table container */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-auto nice-scroll">
              <div className="min-w-full inline-block align-top">
                <table className={`w-full table-fixed border-collapse ${editMode ? 'min-w-[900px]' : 'min-w-[1100px]'}`}>
                  <colgroup>
                    <col className="w-[140px]" /> {/* Group */}
                    <col className="w-[250px]" /> {/* Name - Adjusted width */}
                    <col className="w-[150px]" /> {/* Proposal Date */}
                    <col className="w-[150px]" /> {/* Location */}
                    <col className="w-[140px]" /> {/* Follow */}
                    {/* Conditional columns for add mode */}
                    {showProprietorColumn && <col className="w-[140px]" />} {/* Proprietor */}
                    {showMediatorColumn && <col className="w-[140px]" />} {/* Mediator */}
                    {showContactNoColumn && <col className="w-[160px]" />} {/* Contact No */}
                    <col className="w-[90px]" /> {/* File */}
                    <col className="w-[140px]" /> {/* Status */}
                    <col className="w-[180px]" /> {/* Reason */}
                    {!editMode && <col className="w-[64px]" />} {/* Remove - only in add mode */}
                  </colgroup>

                  <thead className="bg-slate-50/80 sticky top-0 z-10">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      <th className="px-3 py-2 border-b border-slate-200">Group</th>
                      <th className="px-3 py-2 border-b border-slate-200">Name *</th>
                      <th className="px-3 py-2 border-b border-slate-200">
                        Proposal date
                      </th>
                      <th className="px-3 py-2 border-b border-slate-200">Location</th>
                      <th className="px-3 py-2 border-b border-slate-200">Follow</th>
                      {/* Conditional headers for add mode */}
                      {showProprietorColumn && (
                        <th className="px-3 py-2 border-b border-slate-200">Proprietor</th>
                      )}
                      {showMediatorColumn && (
                        <th className="px-3 py-2 border-b border-slate-200">Mediator</th>
                      )}
                      {showContactNoColumn && (
                        <th className="px-3 py-2 border-b border-slate-200">
                          Contact no
                        </th>
                      )}
                      <th className="px-3 py-2 border-b border-slate-200">File</th>
                      <th className="px-3 py-2 border-b border-slate-200">Status</th>
                      <th className="px-3 py-2 border-b border-slate-200">Reason</th>
                      {/* Only show remove column header in add mode */}
                      {!editMode && (
                        <th className="px-3 py-2 border-b border-slate-200 text-center">
                          &nbsp;
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {rows.map((r, i) => (
                      <tr
                        key={i}
                        className="odd:bg-white even:bg-slate-50 hover:bg-slate-100/60"
                      >
                        {/* Group - dropdown in add mode, readonly in edit mode */}
                        <td className="px-1 py-4">
                          {editMode ? (
                            // In edit mode, show truncated text
                            <div 
                              className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 flex items-center text-[13px] text-slate-600 whitespace-nowrap overflow-hidden"
                              title={r.group} // Show full text on hover
                            >
                              {truncateText(r.group)}
                            </div>
                          ) : !auth.isTeamLead ? (
                            // In add mode, non-Team Lead sees readonly
                            <div 
                              className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 flex items-center text-[13px] text-slate-600 whitespace-nowrap overflow-hidden"
                              title={r.group}
                            >
                              {truncateText(r.group)}
                            </div>
                          ) : (
                            // In add mode, Team Lead uses dropdown
                            <GroupDropdown
                              value={r.group}
                              onChange={(e) => update(i, "group", e.target.value)}
                              readOnly={!auth.isTeamLead}
                              className={!auth.isTeamLead ? "bg-slate-50 cursor-not-allowed" : ""}
                            />
                          )}
                        </td>
                        
                        {/* Name - EDITABLE in edit mode, Team Lead only in add mode */}
                        <td className="px-1 py-4">
                          <PillInput
                            placeholder="Name"
                            value={r.name}
                            onChange={(e) => update(i, "name", e.target.value)}
                            readOnly={!editMode && !auth.isTeamLead}
                            className={(!editMode && !auth.isTeamLead) ? "bg-slate-50 cursor-not-allowed" : ""}
                          />
                        </td>
                        
                        {/* Proposal date - readonly in edit mode or for non-Team Lead */}
                        <td className="px-1 py-4">
                          <PillInput
                            type="date"
                            value={r.proposal_date}
                            onChange={(e) => update(i, "proposal_date", e.target.value)}
                            readOnly={editMode || !auth.isTeamLead}
                            className={(editMode || !auth.isTeamLead) ? "bg-slate-50 cursor-not-allowed [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:invert-70" : "[&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:invert-70"}
                          />
                        </td>
                        
                        {/* Location - readonly in edit mode or for non-Team Lead */}
                        <td className="px-1 py-4">
                          {(editMode || !auth.isTeamLead) ? (
                            <div 
                              className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 flex items-center text-[13px] text-slate-600 whitespace-nowrap overflow-hidden"
                              title={r.location}
                            >
                              {truncateText(r.location)}
                            </div>
                          ) : (
                            <PillInput
                              value={r.location}
                              onChange={(e) => update(i, "location", e.target.value)}
                              readOnly={editMode || !auth.isTeamLead}
                              className={(editMode || !auth.isTeamLead) ? "bg-slate-50 cursor-not-allowed" : ""}
                              title={r.location}
                            />
                          )}
                        </td>
                        
                        {/* Follow - dropdown in add mode, readonly in edit mode */}
                        <td className="px-1 py-4">
                          {editMode ? (
                            // In edit mode, show truncated text
                            <div 
                              className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 flex items-center text-[13px] text-slate-600 whitespace-nowrap overflow-hidden"
                              title={r.follow}
                            >
                              {truncateText(r.follow)}
                            </div>
                          ) : !auth.isTeamLead ? (
                            // In add mode, non-Team Lead sees readonly
                            <div 
                              className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 flex items-center text-[13px] text-slate-600 whitespace-nowrap overflow-hidden"
                              title={r.follow}
                            >
                              {truncateText(r.follow)}
                            </div>
                          ) : (
                            // In add mode, Team Lead uses dropdown
                            <FollowDropdown
                              value={r.follow}
                              onChange={(e) => update(i, "follow", e.target.value)}
                              readOnly={!auth.isTeamLead}
                              className={!auth.isTeamLead ? "bg-slate-50 cursor-not-allowed" : ""}
                            />
                          )}
                        </td>
                        
                        {/* Conditional Proprietor column - only in add mode */}
                        {showProprietorColumn && (
                          <td className="px-1 py-4">
                            {(editMode || !auth.isTeamLead) ? (
                              <div 
                                className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 flex items-center text-[13px] text-slate-600"
                                title={r.proprietor}
                              >
                                {r.proprietor || ""}
                              </div>
                            ) : (
                              <PillInput
                                value={r.proprietor}
                                onChange={(e) => update(i, "proprietor", e.target.value)}
                                readOnly={editMode || !auth.isTeamLead}
                                className={(editMode || !auth.isTeamLead) ? "bg-slate-50 cursor-not-allowed" : ""}
                              />
                            )}
                          </td>
                        )}
                        
                        {/* Conditional Mediator column - only in add mode */}
                        {showMediatorColumn && (
                          <td className="px-1 py-4">
                            {(editMode || !auth.isTeamLead) ? (
                              <div 
                                className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 flex items-center text-[13px] text-slate-600"
                                title={r.mediator}
                              >
                                {r.mediator || ""}
                              </div>
                            ) : (
                              <PillInput
                                value={r.mediator}
                                onChange={(e) => update(i, "mediator", e.target.value)}
                                readOnly={editMode || !auth.isTeamLead}
                                className={(editMode || !auth.isTeamLead) ? "bg-slate-50 cursor-not-allowed" : ""}
                              />
                            )}
                          </td>
                        )}
                        
                        {/* Conditional Contact no column - only in add mode */}
                        {showContactNoColumn && (
                          <td className="px-1 py-4">
                            <PillInput
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={r.contact_no}
                              onChange={(e) => onContactChange(i, e)}
                              readOnly={editMode || !auth.isTeamLead}
                              className={(editMode || !auth.isTeamLead) ? "bg-slate-50 cursor-not-allowed" : ""}
                            />
                          </td>
                        )}

                        {/* File seen - ALWAYS editable in edit mode, Team Lead only in add mode */}
                        <td className="px-1 py-4">
                          <div className="flex items-center h-8">
                            <select
                              value={r.file_seen ? "YES" : "NO"}
                              onChange={(e) =>
                                update(i, "file_seen", e.target.value === "YES")
                              }
                              disabled={!editMode && !auth.isTeamLead}
                              className={`h-8 w-full rounded-md border px-2 text-[13px] focus:border-slate-400 ${
                                (editMode || auth.isTeamLead) 
                                  ? 'border-slate-300 bg-white text-slate-800' 
                                  : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <option value="YES">YES</option>
                              <option value="NO">NO</option>
                            </select>
                          </div>
                        </td>

                        {/* Status - ALWAYS editable in edit mode, Team Lead only in add mode */}
                        <td className="px-1 py-4">
                          <div className="flex items-center h-8">
                            <select
                              value={r.status}
                              onChange={(e) => update(i, "status", e.target.value)}
                              disabled={!editMode && !auth.isTeamLead}
                              className={`h-8 w-full rounded-md border px-2 text-[13px] focus:border-slate-400 ${
                                (editMode || auth.isTeamLead) 
                                  ? 'border-slate-300 bg-white text-slate-800' 
                                  : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              {STATUS_OPTS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>

                        {/* Reason - ALWAYS editable in edit mode, Team Lead only in add mode */}
                        <td className="px-1 py-4">
                          <PillInput
                            value={r.reason}
                            onChange={(e) => update(i, "reason", e.target.value)}
                            readOnly={!editMode && !auth.isTeamLead}
                            className={(!editMode && !auth.isTeamLead) ? "bg-slate-50 cursor-not-allowed" : ""}
                          />
                        </td>

                        {/* Remove button - only show in add mode for Team Lead */}
                        {!editMode && (
                          <td className="px-1 py-4 text-center">
                            {auth.isTeamLead && (
                              <button
                                type="button"
                                onClick={() => removeRow(i)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                                title="Remove row"
                                aria-label={`Remove row ${i + 1}`}
                              >
                                ✕
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Fixed bottom action bar - outside the scroll area */}
          <div className="border-t border-slate-200 px-4 py-3 flex items-center bg-white">
            <div className="whitespace-pre-wrap text-sm text-rose-600">
              {msg}
            </div>
            <div className="ml-auto flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/clients")}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || (!editMode && !auth.isTeamLead)}
                className={`rounded-lg border px-5 py-2 text-sm ${
                  (!editMode && !auth.isTeamLead)
                    ? 'border-slate-300 bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'border-green-700 bg-green-600 text-white hover:bg-green-700 disabled:opacity-60'
                }`}
                title={(!editMode && !auth.isTeamLead) ? "Only Team Lead can add new clients" : ""}
              >
                {saving ? (editMode ? "Updating…" : "Saving…") : saveButtonText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}