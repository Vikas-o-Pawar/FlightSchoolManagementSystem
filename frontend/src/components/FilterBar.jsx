// Search input + status filter buttons (All / Valid / Expiring / Expired)

const STATUS_OPTIONS = ["ALL", "VALID", "EXPIRING", "EXPIRED"];

export default function FilterBar({ search, onSearch, statusFilter, onStatusFilter }) {
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>

      {/* Search box */}
      <input
        type="text"
        placeholder="Search by trainee or qualification..."
        value={search}
        onChange={e => onSearch(e.target.value)}
        style={{
          flex: 1,
          padding: "8px 12px",
          border: "1px solid #d1d5db",
          borderRadius: "6px",
          fontSize: "14px",
          outline: "none",
        }}
      />

      {/* Status filter buttons */}
      <div style={{ display: "flex", gap: "8px" }}>
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            onClick={() => onStatusFilter(s)}
            style={{
              padding: "7px 14px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              background: statusFilter === s ? "#2563eb" : "#fff",
              color: statusFilter === s ? "#fff" : "#374151",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            {s === "ALL" ? "All" : s}
          </button>
        ))}
      </div>

    </div>
  );
}