// RenewalHistory.jsx
// Shows a list of past renewal records for a given qualification.
// Props:
//   history  — array of renewal record objects
//   qualName — string, name of the qualification (for the heading)

export default function RenewalHistory({ history = [], qualName }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#111827" }}>
            Renewal History
          </h3>
          {qualName && (
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6b7280" }}>{qualName}</p>
          )}
        </div>
        <span style={{ fontSize: "12px", color: "#6b7280", background: "#f3f4f6", padding: "3px 10px", borderRadius: "999px" }}>
          {history.length} record{history.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Empty state */}
      {history.length === 0 && (
        <div style={{ padding: "32px", textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>
          No renewals recorded yet.
        </div>
      )}

      {/* Table */}
      {history.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              {["#", "Renewed On", "New Expiry Date", "Trigger", "Notes"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.map((record, index) => (
              <tr key={record.id} style={{ borderBottom: "1px solid #f3f4f6" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "12px 16px", fontSize: "13px", color: "#9ca3af", fontWeight: "600" }}>
                  {index + 1}
                </td>
                <td style={{ padding: "12px 16px", fontSize: "13px", color: "#374151", fontWeight: "600" }}>
                  {record.renewedOn}
                </td>
                <td style={{ padding: "12px 16px", fontSize: "13px", color: "#16a34a", fontWeight: "700" }}>
                  {record.newExpiryDate}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  {record.trigger ? (
                    <span style={{ fontSize: "12px", fontWeight: "600", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: "999px" }}>
                      {record.trigger}
                    </span>
                  ) : (
                    <span style={{ fontSize: "12px", color: "#9ca3af" }}>Manual</span>
                  )}
                </td>
                <td style={{ padding: "12px 16px", fontSize: "13px", color: "#6b7280" }}>
                  {record.notes || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}