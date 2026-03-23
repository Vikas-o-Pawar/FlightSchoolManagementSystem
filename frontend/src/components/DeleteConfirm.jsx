// Simple "Are you sure?" confirmation modal before deleting
// Props: qual (object to delete), onConfirm, onCancel

export default function DeleteConfirm({ qual, onConfirm, onCancel }) {
  if (!qual) return null;

  return (
    // Backdrop
    <div
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 60,
      }}
    >
      {/* Box */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "10px",
          padding: "32px 28px",
          width: "100%",
          maxWidth: "400px",
          textAlign: "center",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>⚠️</div>

        <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: "700" }}>
          Delete Qualification?
        </h3>

        <p style={{ margin: "0 0 24px", color: "#6b7280", fontSize: "14px" }}>
          You are about to delete <strong>{qual.qualTypeName}</strong> for <strong>{qual.traineeName}</strong>. This cannot be undone.
        </p>

        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button onClick={onCancel} style={ghostBtn}>Cancel</button>
          <button onClick={() => onConfirm(qual.id)} style={dangerBtn}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

const dangerBtn = {
  padding: "9px 20px", background: "#dc2626", color: "#fff",
  border: "none", borderRadius: "6px", fontWeight: "600",
  fontSize: "14px", cursor: "pointer",
};

const ghostBtn = {
  padding: "9px 20px", background: "#fff", color: "#374151",
  border: "1px solid #d1d5db", borderRadius: "6px", fontWeight: "600",
  fontSize: "14px", cursor: "pointer",
};