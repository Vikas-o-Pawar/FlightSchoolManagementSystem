// AutomationPage.jsx  —  I-17 Main Page
// Auto-renewal logic engine, expiry tracking, milestone triggers, renewal history
//
// DROP THIS FILE into: src/pages/AutomationPage.jsx
// Then import it in App.jsx

import { useState, useMemo } from "react";

// Data
import { INITIAL_QUALS, TRAINEES, QUAL_TYPES } from "../data/mockData";

// Utils
import { getStatus, getDaysLeft } from "../utils/helpers";
import {
  checkEligibility,
  calculateRenewedExpiry,
  buildRenewalRecord,
} from "../utils/renewalEngine";

// Components
import RenewalHistory     from "../components/RenewalHistory";
import ManualRenewalModal from "../components/ManualRenewalModal";
import MilestonePanel from "../components/MileStonePanel";
import EligibilityBadge from "../components/Eligibilitybadge";


// ─────────────────────────────────────────────────────────────────────────────

export default function AutomationPage() {
  // Shared qual state (in real app this comes from global store / I-16's state)
  const [quals,          setQuals]          = useState(INITIAL_QUALS);
  const [renewalHistory, setRenewalHistory] = useState([]);

  // Modal state
  const [renewTarget, setRenewTarget] = useState(null); // qual selected for manual renewal

  // Which qual's history is expanded
  const [expandedQualId, setExpandedQualId] = useState(null);

  // Tab: "table" | "milestone"
  const [tab, setTab] = useState("table");

  // ── Enrich quals with display fields ──────────────────────────────────────
  const enriched = useMemo(() =>
    quals.map(q => ({
      ...q,
      status:       getStatus(q.expiryDate),
      daysLeft:     getDaysLeft(q.expiryDate),
      traineeName:  TRAINEES.find(t => t.id === q.traineeId)?.name || "—",
      qualTypeName: QUAL_TYPES.find(qt => qt.id === q.qualificationTypeId)?.name || "—",
    })),
  [quals]);

  // Sort: expired first, then expiring, then valid
  const sorted = useMemo(() => [...enriched].sort((a, b) => a.daysLeft - b.daysLeft), [enriched]);

  // Stats
  const stats = useMemo(() => ({
    total:    enriched.length,
    expiring: enriched.filter(q => q.status === "EXPIRING").length,
    expired:  enriched.filter(q => q.status === "EXPIRED").length,
    renewed:  renewalHistory.length,
  }), [enriched, renewalHistory]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  // Called when ManualRenewalModal confirms
  function handleManualRenewal(record, qualId, newExpiry) {
    // Update qual expiry + status in state
    setQuals(qs => qs.map(q =>
      q.id === qualId
        ? { ...q, expiryDate: newExpiry, status: getStatus(newExpiry) }
        : q
    ));
    // Add to history
    setRenewalHistory(h => [{ ...record, trigger: "Manual" }, ...h]);
    setRenewTarget(null);
  }

  // Called when MilestonePanel applies results
  function handleMilestoneApply(traineeId, milestoneType, results) {
    const updates = {};
    const newRecords = [];

    for (const result of results) {
      const qt = QUAL_TYPES.find(q => q.id === result.qual.qualificationTypeId);
      const newExpiry = calculateRenewedExpiry(result.qual.expiryDate, qt?.validityDays || 365);
      updates[result.qual.id] = newExpiry;

      const record = buildRenewalRecord(result.qual.id, newExpiry, `Auto: ${milestoneType}`);
      newRecords.push({ ...record, trigger: milestoneType });
    }

    setQuals(qs => qs.map(q =>
      updates[q.id] ? { ...q, expiryDate: updates[q.id] } : q
    ));
    setRenewalHistory(h => [...newRecords, ...h]);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "system-ui, sans-serif" }}>

      {/* Navbar */}
      <div style={{ background: "#1e3a5f", color: "#fff", padding: "0 32px", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>✈️</span>
          <span style={{ fontWeight: "700", fontSize: "16px" }}>FSMS</span>
          <span style={{ color: "#94a3b8", fontSize: "13px" }}>/ QMS / Automation</span>
        </div>
        <span style={{ fontSize: "12px", color: "#94a3b8" }}>Team T6 · I-17</span>
      </div>

      <div style={{ padding: "28px 32px", maxWidth: "1200px", margin: "0 auto" }}>

        {/* Page title */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: "700", color: "#111827" }}>
            Renewal Automation Engine
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
            Auto-renewal logic, expiry tracking, milestone triggers and renewal history
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "Total Qualifications", value: stats.total,    color: "#2563eb" },
            { label: "Expiring (≤90 days)",  value: stats.expiring, color: "#d97706" },
            { label: "Expired",              value: stats.expired,  color: "#dc2626" },
            { label: "Renewals Applied",     value: stats.renewed,  color: "#16a34a" },
          ].map(c => (
            <div key={c.label} style={{ flex: 1, background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px 20px", borderTop: `4px solid ${c.color}` }}>
              <div style={{ fontSize: "28px", fontWeight: "700", color: c.color }}>{c.value}</div>
              <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "20px", background: "#e5e7eb", borderRadius: "8px", padding: "4px", width: "fit-content" }}>
          {[["table", "📋 Qualification Status"], ["milestone", "⚡ Milestone Trigger"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: "7px 18px", borderRadius: "6px", border: "none", cursor: "pointer",
              fontWeight: "600", fontSize: "13px",
              background: tab === key ? "#fff" : "transparent",
              color:      tab === key ? "#111827" : "#6b7280",
              boxShadow:  tab === key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab: Qualification Status Table ── */}
        {tab === "table" && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Trainee", "Qualification", "Expires", "Days Left", "Status", "Eligible?", "Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", borderBottom: "1px solid #e5e7eb" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(q => {
                  const historyForQ = renewalHistory.filter(r => r.traineeQualificationId === q.id);
                  return (
                    <>
                      <tr key={q.id}
                        style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ padding: "12px 16px", fontSize: "14px", fontWeight: "600" }}>{q.traineeName}</td>
                        <td style={{ padding: "12px 16px", fontSize: "14px" }}>{q.qualTypeName}</td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: q.daysLeft < 0 ? "#dc2626" : q.daysLeft < 90 ? "#d97706" : "#374151", fontWeight: "600" }}>
                          {q.expiryDate}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: "700", color: q.daysLeft < 0 ? "#dc2626" : q.daysLeft < 30 ? "#d97706" : "#16a34a" }}>
                          {q.daysLeft < 0 ? `${q.daysLeft}d` : `+${q.daysLeft}d`}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <StatusChip status={q.status} />
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <EligibilityBadge qual={q} renewalHistory={renewalHistory} />
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={() => setRenewTarget(q)}
                              style={{ padding: "5px 12px", border: "1px solid #2563eb", borderRadius: "5px", background: "transparent", color: "#2563eb", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                            >
                              🔄 Renew
                            </button>
                            {historyForQ.length > 0 && (
                              <button
                                onClick={() => setExpandedQualId(expandedQualId === q.id ? null : q.id)}
                                style={{ padding: "5px 12px", border: "1px solid #e5e7eb", borderRadius: "5px", background: "transparent", color: "#6b7280", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                              >
                                {expandedQualId === q.id ? "Hide" : `History (${historyForQ.length})`}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Inline renewal history */}
                      {expandedQualId === q.id && (
                        <tr key={`${q.id}-history`}>
                          <td colSpan={7} style={{ padding: "0 16px 16px", background: "#f9fafb" }}>
                            <RenewalHistory history={historyForQ} qualName={q.qualTypeName} />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Tab: Milestone Trigger ── */}
        {tab === "milestone" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <MilestonePanel
              allQuals={enriched}
              renewalHistory={renewalHistory}
              onApply={handleMilestoneApply}
            />

            {/* Recent renewal history (all) */}
            <div>
              <RenewalHistory
                history={renewalHistory}
                qualName="All Qualifications"
              />
            </div>
          </div>
        )}
      </div>

      {/* Manual Renewal Modal */}
      <ManualRenewalModal
        qual={renewTarget}
        qualName={renewTarget?.qualTypeName}
        traineeName={renewTarget?.traineeName}
        onClose={() => setRenewTarget(null)}
        onConfirm={handleManualRenewal}
      />
    </div>
  );
}

// Small inline status chip (reused locally)
function StatusChip({ status }) {
  const map = {
    VALID:    { bg: "#dcfce7", color: "#16a34a", border: "#86efac" },
    EXPIRING: { bg: "#fef9c3", color: "#d97706", border: "#fde047" },
    EXPIRED:  { bg: "#fee2e2", color: "#dc2626", border: "#fca5a5" },
  };
  const c = map[status] || map.VALID;
  return (
    <span style={{ fontSize: "12px", fontWeight: "600", padding: "2px 10px", borderRadius: "999px", background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {status}
    </span>
  );
}