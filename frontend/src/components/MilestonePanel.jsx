// MilestonePanel.jsx
// Lets you select a trainee + milestone type, then shows which qualifications
// would be auto-renewed and why (or why not).
// Props:
//   allQuals       — enriched qualification array from App state
//   renewalHistory — array of past renewal records
//   onApply        — fn(traineeId, milestoneType, results) called when user confirms

import { useState } from "react";
import { processMilestone, MILESTONE_LABELS, MILESTONE_RULES } from "../utils/renewalEngine";
import { TRAINEES } from "../data/mockData";

export default function MilestonePanel({ allQuals, renewalHistory, onApply }) {
  const [traineeId,     setTraineeId]     = useState("");
  const [milestoneType, setMilestoneType] = useState("");
  const [preview,       setPreview]       = useState(null);  // array of result objects
  const [applied,       setApplied]       = useState(false);

  function handlePreview() {
    if (!traineeId || !milestoneType) { alert("Please select both a trainee and a milestone."); return; }
    const results = processMilestone(traineeId, milestoneType, allQuals, renewalHistory);
    setPreview(results);
    setApplied(false);
  }

  function handleApply() {
    if (!preview) return;
    onApply(traineeId, milestoneType, preview.filter(r => r.eligible));
    setApplied(true);
  }

  const willRenew = preview?.filter(r => r.eligible) || [];
  const skipped   = preview?.filter(r => !r.eligible) || [];

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#111827" }}>
          ⚡ Milestone Trigger
        </h3>
        <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#6b7280" }}>
          Simulate a training milestone and see which qualifications auto-renew
        </p>
      </div>

      {/* Form */}
      <div style={{ padding: "18px", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>

          {/* Trainee picker */}
          <div>
            <label style={labelStyle}>Select Trainee</label>
            <select value={traineeId} onChange={e => { setTraineeId(e.target.value); setPreview(null); }} style={selectStyle}>
              <option value="">Choose trainee...</option>
              {TRAINEES.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.traineeId})</option>
              ))}
            </select>
          </div>

          {/* Milestone type picker */}
          <div>
            <label style={labelStyle}>Milestone Type</label>
            <select value={milestoneType} onChange={e => { setMilestoneType(e.target.value); setPreview(null); }} style={selectStyle}>
              <option value="">Choose milestone...</option>
              {Object.keys(MILESTONE_LABELS).map(key => (
                <option key={key} value={key}>{MILESTONE_LABELS[key]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* What this milestone affects */}
        {milestoneType && (
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "6px", padding: "10px 14px", marginBottom: "14px" }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#1d4ed8" }}>
              <strong>This milestone can renew:</strong>&nbsp;
              {MILESTONE_RULES[milestoneType]?.join(", ") || "none"}
              &nbsp;(qualification type IDs)
            </p>
          </div>
        )}

        <button onClick={handlePreview} style={primaryBtn}>
          Preview Auto-Renewals
        </button>
      </div>

      {/* Preview results */}
      {preview && (
        <div style={{ padding: "18px" }}>

          {/* Will renew */}
          {willRenew.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <p style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: "700", color: "#16a34a" }}>
                ✅ Will be renewed ({willRenew.length})
              </p>
              {willRenew.map(r => (
                <div key={r.qual.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", marginBottom: "8px" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#111827" }}>{r.qual.qualTypeName}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6b7280" }}>Current expiry: {r.qual.expiryDate}</p>
                  </div>
                  <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: "600" }}>RENEW</span>
                </div>
              ))}
            </div>
          )}

          {/* Skipped */}
          {skipped.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <p style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: "700", color: "#d97706" }}>
                ⏭ Skipped ({skipped.length})
              </p>
              {skipped.map(r => (
                <div key={r.qual.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px", marginBottom: "8px" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#111827" }}>{r.qual.qualTypeName}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#92400e" }}>{r.reason}</p>
                  </div>
                  <span style={{ fontSize: "12px", color: "#d97706", fontWeight: "600" }}>SKIP</span>
                </div>
              ))}
            </div>
          )}

          {/* Nothing found */}
          {preview.length === 0 && (
            <p style={{ textAlign: "center", color: "#9ca3af", fontSize: "14px", padding: "16px 0" }}>
              No qualifications found for this trainee that match this milestone.
            </p>
          )}

          {/* Apply button */}
          {willRenew.length > 0 && !applied && (
            <button onClick={handleApply} style={{ ...primaryBtn, background: "#16a34a", width: "100%" }}>
              Apply {willRenew.length} Renewal{willRenew.length > 1 ? "s" : ""}
            </button>
          )}

          {applied && (
            <div style={{ textAlign: "center", padding: "12px", background: "#f0fdf4", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#16a34a" }}>
                ✅ {willRenew.length} qualification{willRenew.length > 1 ? "s" : ""} renewed successfully!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const labelStyle  = { display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "5px" };
const selectStyle = { width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", outline: "none", boxSizing: "border-box" };
const primaryBtn  = { padding: "9px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600", fontSize: "14px", cursor: "pointer" };