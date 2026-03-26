import { checkEligibility } from "../utils/renewalEngine";

export default function EligibilityBadge({ qual }) {
  const { eligible, reason } = checkEligibility(qual);

  return (
    <div style={{ position: "relative", display: "inline-block" }} title={reason}>
      <span
        style={{
          fontSize: "11px",
          fontWeight: "600",
          padding: "2px 8px",
          borderRadius: "999px",
          cursor: "default",
          background: eligible ? "#dcfce7" : "#f3f4f6",
          color: eligible ? "#16a34a" : "#6b7280",
          border: `1px solid ${eligible ? "#86efac" : "#e5e7eb"}`,
        }}
      >
        {eligible ? "Renewable" : "Not Eligible"}
      </span>
    </div>
  );
}
