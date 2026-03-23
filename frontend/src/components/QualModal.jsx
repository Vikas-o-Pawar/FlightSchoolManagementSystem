// Modal form for CREATE and EDIT qualification
// Props: isOpen, onClose, onSave, initialData (null = create mode)

import { useState, useEffect } from "react";
import { TRAINEES, QUAL_TYPES } from "../data/mockData";
import { getStatus, addDaysToDate, today } from "../utils/helpers";

const EMPTY = {
  traineeId: "",
  qualificationTypeId: "",
  issuedDate: today(),
  expiryDate: "",
  verified: false,
};

export default function QualModal({ isOpen, onClose, onSave, initialData }) {
  const [form, setForm] = useState(EMPTY);

  // Load data when editing
  useEffect(() => {
    setForm(initialData ? { ...initialData } : EMPTY);
  }, [initialData, isOpen]);

  // Auto-fill expiry when type or issued date changes
  function handleTypeChange(typeId) {
    const qt = QUAL_TYPES.find(q => q.id === typeId);
    const expiry = qt && form.issuedDate ? addDaysToDate(form.issuedDate, qt.validityDays) : "";
    setForm(f => ({ ...f, qualificationTypeId: typeId, expiryDate: expiry }));
  }

  function handleIssuedChange(date) {
    const qt = QUAL_TYPES.find(q => q.id === form.qualificationTypeId);
    const expiry = qt ? addDaysToDate(date, qt.validityDays) : form.expiryDate;
    setForm(f => ({ ...f, issuedDate: date, expiryDate: expiry }));
  }

  function handleSubmit() {
    if (!form.traineeId || !form.qualificationTypeId || !form.issuedDate || !form.expiryDate) {
      alert("Please fill in all required fields.");
      return;
    }
    onSave({ ...form, status: getStatus(form.expiryDate) });
    onClose();
  }

  if (!isOpen) return null;

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 50,
      }}
    >
      {/* Modal box */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "10px",
          padding: "28px",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
        }}
      >
        <h2 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: "700" }}>
          {initialData ? "Edit Qualification" : "New Qualification"}
        </h2>

        {/* Trainee */}
        <Label text="Trainee *">
          <select value={form.traineeId} onChange={e => setForm(f => ({ ...f, traineeId: e.target.value }))} style={inputStyle}>
            <option value="">Select trainee...</option>
            {TRAINEES.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.traineeId})</option>
            ))}
          </select>
        </Label>

        {/* Qualification Type */}
        <Label text="Qualification Type *">
          <select value={form.qualificationTypeId} onChange={e => handleTypeChange(e.target.value)} style={inputStyle}>
            <option value="">Select type...</option>
            {QUAL_TYPES.map(qt => (
              <option key={qt.id} value={qt.id}>{qt.name} ({qt.validityDays} days)</option>
            ))}
          </select>
        </Label>

        {/* Dates */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Label text="Issued Date *">
            <input type="date" value={form.issuedDate} onChange={e => handleIssuedChange(e.target.value)} style={inputStyle} />
          </Label>
          <Label text="Expiry Date *">
            <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} style={inputStyle} />
          </Label>
        </div>

        {/* Verified checkbox */}
        <label style={{ display: "flex", alignItems: "center", gap: "8px", margin: "12px 0 20px", fontSize: "14px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={form.verified}
            onChange={e => setForm(f => ({ ...f, verified: e.target.checked }))}
          />
          Mark as verified
        </label>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={ghostBtn}>Cancel</button>
          <button onClick={handleSubmit} style={primaryBtn}>
            {initialData ? "Save Changes" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── tiny helpers ──────────────────────────────────────────────────────────────

function Label({ text, children }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>
        {text}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "8px 10px",
  border: "1px solid #d1d5db", borderRadius: "6px",
  fontSize: "14px", outline: "none", boxSizing: "border-box",
};

const primaryBtn = {
  padding: "9px 20px", background: "#2563eb", color: "#fff",
  border: "none", borderRadius: "6px", fontWeight: "600",
  fontSize: "14px", cursor: "pointer",
};

const ghostBtn = {
  padding: "9px 20px", background: "#fff", color: "#374151",
  border: "1px solid #d1d5db", borderRadius: "6px", fontWeight: "600",
  fontSize: "14px", cursor: "pointer",
};