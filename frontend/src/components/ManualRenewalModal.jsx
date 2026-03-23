// ManualRenewalModal.jsx
// Form modal for manually renewing a single qualification.
// Props:
//   qual        — the qualification object to renew
//   qualName    — display name of the qualification type
//   traineeName — display name of the trainee
//   onClose     — fn()
//   onConfirm   — fn(renewalRecord)

import { useState } from "react";
import { verifyRenewalRules, buildRenewalRecord, calculateRenewedExpiry } from "../utils/renewalEngine";
import { QUAL_TYPES } from "../data/mockData";

export default function ManualRenewalModal({ qual, qualName, traineeName, onClose, onConfirm }) {
  const qt = QUAL_TYPES.find(q => q.id === qual?.qualificationTypeId);
  const suggestedExpiry = qual ? calculateRenewedExpiry(qual.expiryDate, qt?.validityDays || 365) : "";

  const [newExpiry, setNewExpiry] = useState(suggestedExpiry);
  const [notes, setNotes]         = useState("");
  const [errors, setErrors]       = useState([]);

  if (!qual) return null;

  function handleSubmit() {
    const errs = verifyRenewalRules(qual, newExpiry, notes);
    if (errs.length > 0) { setErrors(errs); return; }

    const record = buildRenewalRecord(qual.id, newExpiry, notes);
    onConfirm(record, qual.id, newExpiry);
    onClose();
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "10px", padding: "28px", width: "100%", maxWidth: "460px", boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#111827" }}>🔄 Manual Renewal</h2>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6b7280" }}>
              {qualName} — {traineeName}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#9ca3af" }}>✕</button>
        </div>

        {/* Current expiry info */}
        <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: "8px", padding: "12px 14px", marginBottom: "20px" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#854d0e" }}>
            <strong>Current expiry:</strong> {qual.expiryDate}
            &nbsp;—&nbsp;
            {new Date(qual.expiryDate) < new Date()
              ? <span style={{ color: "#dc2626" }}>Already expired</span>
              : <span>Still valid</span>
            }
          </p>
        </div>

        {/* Validation errors */}
        {errors.length > 0 && (
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px" }}>
            {errors.map((e, i) => (
              <p key={i} style={{ margin: i === 0 ? 0 : "4px 0 0", fontSize: "13px", color: "#dc2626" }}>⚠ {e}</p>
            ))}
          </div>
        )}

        {/* New expiry date */}
        <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>
          New Expiry Date *
        </label>
        <input
          type="date"
          value={newExpiry}
          onChange={e => { setNewExpiry(e.target.value); setErrors([]); }}
          style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", outline: "none", marginBottom: "16px", boxSizing: "border-box" }}
        />

        {/* Suggested expiry hint */}
        {suggestedExpiry && (
          <p style={{ margin: "-10px 0 16px", fontSize: "12px", color: "#6b7280" }}>
            💡 Suggested based on {qt?.validityDays}-day validity:&nbsp;
            <button onClick={() => setNewExpiry(suggestedExpiry)} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "12px", fontWeight: "600", padding: 0 }}>
              use {suggestedExpiry}
            </button>
          </p>
        )}

        {/* Notes */}
        <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Reason for renewal, reference number, etc."
          rows={3}
          style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
        />
        <p style={{ margin: "4px 0 20px", fontSize: "11px", color: "#9ca3af" }}>{notes.length}/500</p>

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={ghostBtn}>Cancel</button>
          <button onClick={handleSubmit} style={primaryBtn}>Confirm Renewal</button>
        </div>
      </div>
    </div>
  );
}

const primaryBtn = { padding: "9px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600", fontSize: "14px", cursor: "pointer" };
const ghostBtn   = { padding: "9px 20px", background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: "6px", fontWeight: "600", fontSize: "14px", cursor: "pointer" };