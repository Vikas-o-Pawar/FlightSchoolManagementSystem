import { useMemo, useState } from "react";
import { MILESTONE_LABELS, MILESTONE_RULES } from "../utils/renewalEngine";

export default function MilestonePanel({
  allQuals,
  onPreview,
  onApply,
  isApplying = false,
  error = "",
}) {
  const [traineeId, setTraineeId] = useState("");
  const [milestoneType, setMilestoneType] = useState("");
  const [preview, setPreview] = useState(null);
  const [applied, setApplied] = useState(false);

  const trainees = useMemo(() => {
    const seen = new Map();

    allQuals.forEach((qualification) => {
      if (!seen.has(qualification.traineeId)) {
        seen.set(qualification.traineeId, {
          id: qualification.traineeId,
          name: qualification.traineeName,
          traineeId: qualification.traineeCode,
        });
      }
    });

    return Array.from(seen.values()).sort((left, right) =>
      left.name.localeCompare(right.name)
    );
  }, [allQuals]);

  async function handlePreview() {
    if (!traineeId || !milestoneType) {
      return;
    }

    const results = await onPreview({ traineeId, milestoneType });
    setPreview(results);
    setApplied(false);
  }

  async function handleApply() {
    if (!preview) return;
    await onApply(traineeId, milestoneType);
    setApplied(true);
  }

  const willRenew = preview?.filter((result) => result.eligible) || [];
  const skipped = preview?.filter((result) => !result.eligible) || [];

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid #e5e7eb",
          background: "#f9fafb",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#111827" }}>
          Milestone Trigger
        </h3>
        <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#6b7280" }}>
          Preview and apply backend-driven auto-renewals for milestone events
        </p>
      </div>

      <div style={{ padding: "18px", borderBottom: "1px solid #e5e7eb" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "14px",
            marginBottom: "14px",
          }}
        >
          <div>
            <label style={labelStyle}>Select Trainee</label>
            <select
              value={traineeId}
              onChange={(event) => {
                setTraineeId(event.target.value);
                setPreview(null);
              }}
              style={selectStyle}
              disabled={isApplying}
            >
              <option value="">Choose trainee...</option>
              {trainees.map((trainee) => (
                <option key={trainee.id} value={trainee.id}>
                  {trainee.name} ({trainee.traineeId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Milestone Type</label>
            <select
              value={milestoneType}
              onChange={(event) => {
                setMilestoneType(event.target.value);
                setPreview(null);
              }}
              style={selectStyle}
              disabled={isApplying}
            >
              <option value="">Choose milestone...</option>
              {Object.keys(MILESTONE_LABELS).map((key) => (
                <option key={key} value={key}>
                  {MILESTONE_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {milestoneType ? (
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "6px",
              padding: "10px 14px",
              marginBottom: "14px",
            }}
          >
            <p style={{ margin: 0, fontSize: "12px", color: "#1d4ed8" }}>
              <strong>This milestone can renew:</strong>{" "}
              {MILESTONE_RULES[milestoneType]?.join(", ") || "none"}
            </p>
          </div>
        ) : null}

        <button
          onClick={handlePreview}
          style={primaryBtn}
          disabled={isApplying || !traineeId || !milestoneType}
        >
          Preview Auto-Renewals
        </button>
      </div>

      {preview ? (
        <div style={{ padding: "18px" }}>
          {error ? (
            <div
              style={{
                background: "#fee2e2",
                border: "1px solid #fca5a5",
                borderRadius: "6px",
                color: "#b91c1c",
                fontSize: "13px",
                padding: "10px 12px",
                marginBottom: "14px",
              }}
            >
              {error}
            </div>
          ) : null}

          {willRenew.length > 0 ? (
            <div style={{ marginBottom: "16px" }}>
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#16a34a",
                }}
              >
                Will be renewed ({willRenew.length})
              </p>
              {willRenew.map((result) => (
                <PreviewCard
                  key={result.qualification.id}
                  qualification={result.qualification}
                  reason={result.reason}
                  mode="renew"
                />
              ))}
            </div>
          ) : null}

          {skipped.length > 0 ? (
            <div style={{ marginBottom: "16px" }}>
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#d97706",
                }}
              >
                Skipped ({skipped.length})
              </p>
              {skipped.map((result) => (
                <PreviewCard
                  key={result.qualification.id}
                  qualification={result.qualification}
                  reason={result.reason}
                  mode="skip"
                />
              ))}
            </div>
          ) : null}

          {preview.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                color: "#9ca3af",
                fontSize: "14px",
                padding: "16px 0",
              }}
            >
              No qualifications found for this trainee that match this milestone.
            </p>
          ) : null}

          {willRenew.length > 0 && !applied ? (
            <button
              onClick={handleApply}
              style={{ ...primaryBtn, background: "#16a34a", width: "100%" }}
              disabled={isApplying}
            >
              {isApplying
                ? "Applying..."
                : `Apply ${willRenew.length} Renewal${willRenew.length > 1 ? "s" : ""}`}
            </button>
          ) : null}

          {applied ? (
            <div
              style={{
                textAlign: "center",
                padding: "12px",
                background: "#f0fdf4",
                borderRadius: "6px",
                border: "1px solid #bbf7d0",
              }}
            >
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#16a34a" }}>
                {willRenew.length} qualification
                {willRenew.length > 1 ? "s" : ""} renewed successfully.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PreviewCard({ qualification, reason, mode }) {
  const isRenew = mode === "renew";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 14px",
        background: isRenew ? "#f0fdf4" : "#fffbeb",
        border: `1px solid ${isRenew ? "#bbf7d0" : "#fde68a"}`,
        borderRadius: "6px",
        marginBottom: "8px",
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: "600",
            color: "#111827",
          }}
        >
          {qualification.qualification_types?.name || "-"}
        </p>
        <p
          style={{
            margin: "2px 0 0",
            fontSize: "12px",
            color: isRenew ? "#6b7280" : "#92400e",
          }}
        >
          {reason || `Current expiry: ${qualification.expiryDate}`}
        </p>
      </div>
      <span
        style={{
          fontSize: "12px",
          color: isRenew ? "#16a34a" : "#d97706",
          fontWeight: "600",
        }}
      >
        {isRenew ? "RENEW" : "SKIP"}
      </span>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: "600",
  color: "#374151",
  marginBottom: "5px",
};

const selectStyle = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

const primaryBtn = {
  padding: "9px 20px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  fontWeight: "600",
  fontSize: "14px",
  cursor: "pointer",
};
