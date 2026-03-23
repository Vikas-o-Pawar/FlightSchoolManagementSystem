// Shows 4 summary cards: Total, Valid, Expiring, Expired

export default function StatsRow({ quals }) {
  const total    = quals.length;
  const valid    = quals.filter(q => q.status === "VALID").length;
  const expiring = quals.filter(q => q.status === "EXPIRING").length;
  const expired  = quals.filter(q => q.status === "EXPIRED").length;

  const cards = [
    { label: "Total",    value: total,    color: "#2563eb" },
    { label: "Valid",    value: valid,    color: "#16a34a" },
    { label: "Expiring", value: expiring, color: "#d97706" },
    { label: "Expired",  value: expired,  color: "#dc2626" },
  ];

  return (
    <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
      {cards.map(card => (
        <div key={card.label} style={{
          flex: 1,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "16px 20px",
          borderTop: `4px solid ${card.color}`,
        }}>
          <div style={{ fontSize: "28px", fontWeight: "700", color: card.color }}>
            {card.value}
          </div>
          <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}