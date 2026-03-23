// Shows a colored pill: VALID (green) | EXPIRING (yellow) | EXPIRED (red)

const COLORS = {
  VALID:    { text: "#16a34a", bg: "#dcfce7", border: "#86efac" },
  EXPIRING: { text: "#d97706", bg: "#fef9c3", border: "#fde047" },
  EXPIRED:  { text: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
};

export default function StatusBadge({ status }) {
  const c = COLORS[status] || COLORS.VALID;

  return (
    <span style={{
      padding: "2px 10px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "600",
      color: c.text,
      background: c.bg,
      border: `1px solid ${c.border}`,
    }}>
      {status}
    </span>
  );
}