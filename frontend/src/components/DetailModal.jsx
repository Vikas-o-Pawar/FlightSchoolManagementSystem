import { getDaysLeft } from "../utils/helpers";
import { getCertificateDownloadUrl } from "../api/qualificationApi";
import StatusBadge from "./StatusBadge";

export default function DetailModal({
  qual,
  onClose,
  onEdit,
  onDelete,
  onGenerateCertificate,
  isGeneratingCertificate = false,
  certificateMessage = "",
}) {
  if (!qual) {
    return null;
  }

  const days = getDaysLeft(qual.expiryDate);
  const downloadUrl = getCertificateDownloadUrl(qual);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "10px",
          padding: "28px",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Qualification Detail
            </p>
            <h2 style={{ margin: "4px 0 0", fontSize: "20px", fontWeight: "700" }}>
              {qual.qualTypeName}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#9ca3af",
            }}
          >
            x
          </button>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            background: "#f9fafb",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <StatusBadge status={qual.status} />
          <span
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: days < 0 ? "#dc2626" : days < 90 ? "#d97706" : "#16a34a",
            }}
          >
            {days < 0 ? `Expired ${Math.abs(days)} days ago` : `${days} days remaining`}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <InfoBox label="Trainee" value={qual.traineeName} />
          <InfoBox label="Trainee ID" value={qual.traineeCode} />
          <InfoBox label="Issued" value={qual.issuedDate} />
          <InfoBox label="Expires" value={qual.expiryDate} />
          <InfoBox
            label="Validity"
            value={qual.validityDays ? `${qual.validityDays} days` : ""}
          />
          <InfoBox label="Verified" value={qual.verified ? "Yes" : "No"} />
          <InfoBox
            label="Certificate"
            value={qual.certificateUrl ? "Available" : "Not Generated"}
          />
        </div>

        {certificateMessage ? (
          <div
            style={{
              marginBottom: "16px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #86efac",
              background: "#f0fdf4",
              color: "#166534",
              fontSize: "13px",
            }}
          >
            {certificateMessage}
          </div>
        ) : null}

        {qual.certificateUrl ? (
          <div
            style={{
              marginBottom: "16px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #bfdbfe",
              background: "#eff6ff",
              color: "#1d4ed8",
              fontSize: "13px",
              wordBreak: "break-all",
            }}
          >
            Stored certificate path: {qual.certificateUrl}
          </div>
        ) : null}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button
            onClick={() => onGenerateCertificate(qual.id)}
            style={{ ...ghostBtn, color: "#2563eb", borderColor: "#2563eb" }}
            disabled={isGeneratingCertificate}
          >
            {isGeneratingCertificate ? "Generating..." : "Generate Certificate"}
          </button>
          {qual.certificateUrl ? (
            <a
              href={downloadUrl}
              style={{ ...ghostBtn, color: "#047857", borderColor: "#047857", textDecoration: "none" }}
            >
              Download
            </a>
          ) : null}
          <button
            onClick={() => onDelete(qual)}
            style={{ ...ghostBtn, color: "#dc2626", borderColor: "#dc2626" }}
            disabled={isGeneratingCertificate}
          >
            Delete
          </button>
          <button onClick={onClose} style={ghostBtn} disabled={isGeneratingCertificate}>
            Close
          </button>
          <button onClick={() => onEdit(qual)} style={primaryBtn} disabled={isGeneratingCertificate}>
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        background: "#f9fafb",
        borderRadius: "6px",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#9ca3af",
          fontWeight: "600",
          textTransform: "uppercase",
          marginBottom: "3px",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>
        {value || "-"}
      </div>
    </div>
  );
}

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

const ghostBtn = {
  padding: "9px 20px",
  background: "#fff",
  color: "#374151",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontWeight: "600",
  fontSize: "14px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};
