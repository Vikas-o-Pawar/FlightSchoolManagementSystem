import StatusBadge from "./StatusBadge";

const TH = ({ children }) => (
  <th
    style={{
      padding: "10px 14px",
      textAlign: "left",
      fontSize: "12px",
      fontWeight: "600",
      color: "#6b7280",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      borderBottom: "1px solid #e5e7eb",
      background: "#f9fafb",
    }}
  >
    {children}
  </th>
);

const TD = ({ children, style }) => (
  <td
    style={{
      padding: "12px 14px",
      fontSize: "14px",
      color: "#111827",
      borderBottom: "1px solid #f3f4f6",
      ...style,
    }}
  >
    {children}
  </td>
);

export default function QualTable({ quals, onEdit, onDelete, onView }) {
  if (quals.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px", color: "#9ca3af" }}>
        No qualifications found.
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <TH>Trainee</TH>
            <TH>Qualification</TH>
            <TH>Issued</TH>
            <TH>Expires</TH>
            <TH>Days Left</TH>
            <TH>Status</TH>
            <TH>Verified</TH>
            <TH>Actions</TH>
          </tr>
        </thead>
        <tbody>
          {quals.map((qualification) => (
            <tr
              key={qualification.id}
              onClick={() => onView(qualification)}
              style={{ cursor: "pointer" }}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = "#f9fafb";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = "transparent";
              }}
            >
              <TD>
                <div style={{ fontWeight: "600" }}>{qualification.traineeName}</div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>{qualification.traineeCode}</div>
              </TD>
              <TD>{qualification.qualTypeName}</TD>
              <TD style={{ color: "#6b7280" }}>{qualification.issuedDate}</TD>
              <TD
                style={{
                  color:
                    qualification.daysLeft < 0
                      ? "#dc2626"
                      : qualification.daysLeft < 90
                        ? "#d97706"
                        : "#374151",
                }}
              >
                {qualification.expiryDate}
              </TD>
              <TD>
                <span
                  style={{
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
                </span>
              </TD>
              <TD>
                <StatusBadge status={qualification.status} />
              </TD>
              <TD>{qualification.verified ? "Yes" : "-"}</TD>
              <TD onClick={(event) => event.stopPropagation()}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => onEdit(qualification)} style={btnStyle("#2563eb")}>
                    Edit
                  </button>
                  <button onClick={() => onDelete(qualification)} style={btnStyle("#dc2626")}>
                    Delete
                  </button>
                </div>
              </TD>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function btnStyle(color) {
  return {
    padding: "5px 12px",
    border: `1px solid ${color}`,
    borderRadius: "5px",
    background: "transparent",
    color,
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  };
}
