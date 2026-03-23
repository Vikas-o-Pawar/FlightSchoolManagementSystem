// Main table listing all qualifications with Edit / Delete buttons

import StatusBadge from "./StatusBadge";

const TH = ({ children }) => (
  <th style={{
    padding: "10px 14px", textAlign: "left",
    fontSize: "12px", fontWeight: "600", color: "#6b7280",
    textTransform: "uppercase", letterSpacing: "0.05em",
    borderBottom: "1px solid #e5e7eb", background: "#f9fafb",
  }}>
    {children}
  </th>
);

const TD = ({ children, style }) => (
  <td style={{ padding: "12px 14px", fontSize: "14px", color: "#111827", borderBottom: "1px solid #f3f4f6", ...style }}>
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
          {quals.map(q => (
            <tr
              key={q.id}
              onClick={() => onView(q)}
              style={{ cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <TD>
                <div style={{ fontWeight: "600" }}>{q.traineeName}</div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>{q.traineeCode}</div>
              </TD>
              <TD>{q.qualTypeName}</TD>
              <TD style={{ color: "#6b7280" }}>{q.issuedDate}</TD>
              <TD style={{ color: q.daysLeft < 0 ? "#dc2626" : q.daysLeft < 90 ? "#d97706" : "#374151" }}>
                {q.expiryDate}
              </TD>
              <TD>
                <span style={{
                  fontWeight: "700",
                  color: q.daysLeft < 0 ? "#dc2626" : q.daysLeft < 30 ? "#d97706" : "#16a34a",
                }}>
                  {q.daysLeft < 0 ? `${q.daysLeft}d` : `+${q.daysLeft}d`}
                </span>
              </TD>
              <TD><StatusBadge status={q.status} /></TD>
              <TD>{q.verified ? "✅" : "—"}</TD>
              <TD onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => onEdit(q)} style={btnStyle("#2563eb")}>Edit</button>
                  <button onClick={() => onDelete(q)} style={btnStyle("#dc2626")}>Delete</button>
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
    color: color,
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  };
}