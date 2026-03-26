import { Fragment, useEffect, useMemo, useState } from "react";
import {
  applyMilestoneRenewal,
  createRenewal,
  getAllQualifications,
  previewMilestoneRenewal,
} from "../api/qualificationApi";
import { getDaysLeft } from "../utils/helpers";
import RenewalHistory from "../components/RenewalHistory";
import ManualRenewalModal from "../components/ManualRenewalModal";
import MilestonePanel from "../components/MilestonePanel";
import EligibilityBadge from "../components/EligibilityBadge";

function enrichQualification(qualification) {
  return {
    ...qualification,
    daysLeft: getDaysLeft(qualification.expiryDate),
    traineeName: qualification.trainees?.name || "-",
    traineeCode: qualification.trainees?.traineeId || "-",
    qualTypeName: qualification.qualification_types?.name || "-",
    validityDays: qualification.qualification_types?.validityDays || 0,
  };
}

function flattenRenewalHistory(qualifications) {
  return qualifications
    .flatMap((qualification) =>
      (qualification.qualification_renewals || []).map((renewal) => ({
        ...renewal,
        trigger: renewal.notes?.startsWith("Auto:")
          ? renewal.notes.replace("Auto:", "").trim()
          : "Manual",
        qualName: qualification.qualification_types?.name || "-",
        traineeQualificationId: qualification.id,
      }))
    )
    .sort(
      (left, right) =>
        new Date(right.renewedOn).getTime() - new Date(left.renewedOn).getTime()
    );
}

export default function AutomationPage() {
  const [quals, setQuals] = useState([]);
  const [renewalHistory, setRenewalHistory] = useState([]);
  const [renewTarget, setRenewTarget] = useState(null);
  const [expandedQualId, setExpandedQualId] = useState(null);
  const [tab, setTab] = useState("table");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [renewalError, setRenewalError] = useState("");
  const [isSubmittingRenewal, setIsSubmittingRenewal] = useState(false);
  const [isApplyingMilestone, setIsApplyingMilestone] = useState(false);
  const [milestoneError, setMilestoneError] = useState("");

  useEffect(() => {
    loadQualifications();
  }, []);

  async function loadQualifications() {
    setLoading(true);
    setError("");

    try {
      const qualifications = await getAllQualifications();
      setQuals(qualifications);
      setRenewalHistory(flattenRenewalHistory(qualifications));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  const enriched = useMemo(() => quals.map(enrichQualification), [quals]);

  const sorted = useMemo(
    () => [...enriched].sort((left, right) => left.daysLeft - right.daysLeft),
    [enriched]
  );

  const stats = useMemo(
    () => ({
      total: enriched.length,
      expiring: enriched.filter((qualification) => qualification.status === "EXPIRING").length,
      expired: enriched.filter((qualification) => qualification.status === "EXPIRED").length,
      renewed: renewalHistory.length,
    }),
    [enriched, renewalHistory]
  );

  async function handleManualRenewal(payload) {
    setIsSubmittingRenewal(true);
    setRenewalError("");

    try {
      await createRenewal(payload);
      await loadQualifications();
      setRenewTarget(null);
    } catch (requestError) {
      setRenewalError(requestError.message);
    } finally {
      setIsSubmittingRenewal(false);
    }
  }

  async function handleMilestonePreview(payload) {
    setMilestoneError("");

    try {
      return await previewMilestoneRenewal(payload);
    } catch (requestError) {
      setMilestoneError(requestError.message);
      return [];
    }
  }

  async function handleMilestoneApply(traineeId, milestoneType) {
    setIsApplyingMilestone(true);
    setMilestoneError("");

    try {
      await applyMilestoneRenewal({ traineeId, milestoneType });
      await loadQualifications();
    } catch (requestError) {
      setMilestoneError(requestError.message);
    } finally {
      setIsApplyingMilestone(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ padding: "28px 32px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: "700", color: "#111827" }}>
            Renewal Automation Engine
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
            Backend-driven renewals, milestone triggers, and renewal history
          </p>
        </div>

        {error ? <ErrorBanner message={error} /> : null}
        {loading ? (
          <LoadingState label="Loading renewal data..." />
        ) : (
          <>
            <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
              {[
                { label: "Total Qualifications", value: stats.total, color: "#2563eb" },
                { label: "Expiring (<= 60 days)", value: stats.expiring, color: "#d97706" },
                { label: "Expired", value: stats.expired, color: "#dc2626" },
                { label: "Renewals Applied", value: stats.renewed, color: "#16a34a" },
              ].map((card) => (
                <div
                  key={card.label}
                  style={{
                    flex: 1,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "16px 20px",
                    borderTop: `4px solid ${card.color}`,
                  }}
                >
                  <div style={{ fontSize: "28px", fontWeight: "700", color: card.color }}>
                    {card.value}
                  </div>
                  <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
                    {card.label}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                gap: "4px",
                marginBottom: "20px",
                background: "#e5e7eb",
                borderRadius: "8px",
                padding: "4px",
                width: "fit-content",
              }}
            >
              {[
                ["table", "Qualification Status"],
                ["milestone", "Milestone Trigger"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  style={{
                    padding: "7px 18px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "13px",
                    background: tab === key ? "#fff" : "transparent",
                    color: tab === key ? "#111827" : "#6b7280",
                    boxShadow: tab === key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "table" ? (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f9fafb" }}>
                      {["Trainee", "Qualification", "Expires", "Days Left", "Status", "Eligible?", "Actions"].map((heading) => (
                        <th
                          key={heading}
                          style={{
                            padding: "10px 16px",
                            textAlign: "left",
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "#6b7280",
                            textTransform: "uppercase",
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((qualification) => {
                      const historyForQualification = renewalHistory.filter(
                        (record) => record.traineeQualificationId === qualification.id
                      );

                      return (
                        <Fragment key={qualification.id}>
                          <tr
                            style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer" }}
                            onMouseEnter={(event) => {
                              event.currentTarget.style.background = "#f9fafb";
                            }}
                            onMouseLeave={(event) => {
                              event.currentTarget.style.background = "transparent";
                            }}
                          >
                            <td style={{ padding: "12px 16px", fontSize: "14px", fontWeight: "600" }}>
                              {qualification.traineeName}
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: "14px" }}>
                              {qualification.qualTypeName}
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                fontSize: "13px",
                                color:
                                  qualification.daysLeft < 0
                                    ? "#dc2626"
                                    : qualification.daysLeft < 60
                                      ? "#d97706"
                                      : "#374151",
                                fontWeight: "600",
                              }}
                            >
                              {qualification.expiryDate}
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                fontSize: "13px",
                                fontWeight: "700",
                                color:
                                  qualification.daysLeft < 0
                                    ? "#dc2626"
                                    : qualification.daysLeft < 30
                                      ? "#d97706"
                                      : "#16a34a",
                              }}
                            >
                              {qualification.daysLeft < 0
                                ? `${qualification.daysLeft}d`
                                : `+${qualification.daysLeft}d`}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <StatusChip status={qualification.status} />
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <EligibilityBadge qual={qualification} />
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                <button
                                  onClick={() => {
                                    setRenewalError("");
                                    setRenewTarget(qualification);
                                  }}
                                  style={actionBtn("#2563eb")}
                                  disabled={isSubmittingRenewal || isApplyingMilestone}
                                >
                                  Renew
                                </button>
                                {historyForQualification.length > 0 ? (
                                  <button
                                    onClick={() =>
                                      setExpandedQualId(
                                        expandedQualId === qualification.id
                                          ? null
                                          : qualification.id
                                      )
                                    }
                                    style={actionBtn("#6b7280", "#e5e7eb")}
                                  >
                                    {expandedQualId === qualification.id
                                      ? "Hide"
                                      : `History (${historyForQualification.length})`}
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>

                          {expandedQualId === qualification.id ? (
                            <tr>
                              <td colSpan={7} style={{ padding: "0 16px 16px", background: "#f9fafb" }}>
                                <RenewalHistory
                                  history={historyForQualification}
                                  qualName={qualification.qualTypeName}
                                />
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <MilestonePanel
                  allQuals={enriched}
                  onPreview={handleMilestonePreview}
                  onApply={handleMilestoneApply}
                  isApplying={isApplyingMilestone}
                  error={milestoneError}
                />

                <div>
                  <RenewalHistory history={renewalHistory} qualName="All Qualifications" />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ManualRenewalModal
        qual={renewTarget}
        qualName={renewTarget?.qualTypeName}
        traineeName={renewTarget?.traineeName}
        onClose={() => {
          if (isSubmittingRenewal) {
            return;
          }

          setRenewTarget(null);
          setRenewalError("");
        }}
        onConfirm={handleManualRenewal}
        isSubmitting={isSubmittingRenewal}
        error={renewalError}
      />
    </div>
  );
}

function StatusChip({ status }) {
  const map = {
    VALID: { bg: "#dcfce7", color: "#16a34a", border: "#86efac" },
    EXPIRING: { bg: "#fef9c3", color: "#d97706", border: "#fde047" },
    EXPIRED: { bg: "#fee2e2", color: "#dc2626", border: "#fca5a5" },
    REVOKED: { bg: "#e5e7eb", color: "#4b5563", border: "#d1d5db" },
  };

  const colors = map[status] || map.VALID;

  return (
    <span
      style={{
        fontSize: "12px",
        fontWeight: "600",
        padding: "2px 10px",
        borderRadius: "999px",
        background: colors.bg,
        color: colors.color,
        border: `1px solid ${colors.border}`,
      }}
    >
      {status}
    </span>
  );
}

function actionBtn(color, border = color) {
  return {
    padding: "5px 12px",
    border: `1px solid ${border}`,
    borderRadius: "5px",
    background: "transparent",
    color,
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  };
}

function ErrorBanner({ message }) {
  return (
    <div
      style={{
        marginBottom: "16px",
        padding: "10px 12px",
        borderRadius: "8px",
        border: "1px solid #fca5a5",
        background: "#fee2e2",
        color: "#b91c1c",
        fontSize: "13px",
      }}
    >
      {message}
    </div>
  );
}

function LoadingState({ label }) {
  return (
    <div
      style={{
        padding: "48px",
        textAlign: "center",
        color: "#6b7280",
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
      }}
    >
      {label}
    </div>
  );
}
