// EligibilityBadge.jsx
// Shows a small badge indicating whether a qualification is eligible for renewal.
// Used inside the qualifications table (extends I-16's QualTable).
// Props:
//   qual           — qualification object
//   renewalHistory — array of past renewal records

import { checkEligibility } from "../utils/renewalEngine";

export default function EligibilityBadge({ qual, renewalHistory = [] }) {
  const { eligible, reason } = checkEligibility(qual, renewalHistory);

  return (
    <div style={{ position: "relative", display: "inline-block" }}
      title={reason}
    >
      <span style={{
        fontSize: "11px",
        fontWeight: "600",
        padding: "2px 8px",
        borderRadius: "999px",
        cursor: "default",
        background: eligible ? "#dcfce7" : "#f3f4f6",
        color:      eligible ? "#16a34a" : "#6b7280",
        border:     `1px solid ${eligible ? "#86efac" : "#e5e7eb"}`,
      }}>
        {eligible ? "Renewable" : "Not Eligible"}
      </span>
    </div>
  );
}