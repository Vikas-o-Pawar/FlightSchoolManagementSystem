import { useEffect, useState } from "react";
import {
  verifyRenewalRules,
  calculateRenewedExpiry,
} from "../utils/renewalEngine";

export default function ManualRenewalModal({
  qual,
  qualName,
  traineeName,
  onClose,
  onConfirm,
  isSubmitting = false,
  error = "",
}) {
  const suggestedExpiry = qual
    ? calculateRenewedExpiry(qual.expiryDate, qual.validityDays || 365)
    : "";

  const [newExpiry, setNewExpiry] = useState(suggestedExpiry);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    setNewExpiry(suggestedExpiry);
    setNotes("");
    setErrors([]);
  }, [suggestedExpiry, qual?.id]);

  if (!qual) return null;

  function handleSubmit() {
    const validationErrors = verifyRenewalRules(qual, newExpiry, notes);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    onConfirm({
      traineeQualificationId: qual.id,
      renewedOn: new Date().toISOString().split("T")[0],
      newExpiryDate: newExpiry,
      notes,
    });
  }

  return (
    <div
      onClick={isSubmitting ? undefined : onClose}
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
          maxWidth: "460px",
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
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#111827" }}>
              Manual Renewal
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6b7280" }}>
              {qualName} - {traineeName}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              color: "#9ca3af",
            }}
          >
            x
          </button>
        </div>

        <div
          style={{
            background: "#fef9c3",
            border: "1px solid #fde047",
            borderRadius: "8px",
            padding: "12px 14px",
            marginBottom: "20px",
          }}
        >
          <p style={{ margin: 0, fontSize: "13px", color: "#854d0e" }}>
            <strong>Current expiry:</strong> {qual.expiryDate}
          </p>
        </div>

        {error ? (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: "8px",
              padding: "12px 14px",
              marginBottom: "16px",
              fontSize: "13px",
              color: "#dc2626",
            }}
          >
            {error}
          </div>
        ) : null}

        {errors.length > 0 && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: "8px",
              padding: "12px 14px",
              marginBottom: "16px",
            }}
          >
            {errors.map((message, index) => (
              <p
                key={index}
                style={{
                  margin: index === 0 ? 0 : "4px 0 0",
                  fontSize: "13px",
                  color: "#dc2626",
                }}
              >
                {message}
              </p>
            ))}
          </div>
        )}

        <label
          style={{
            display: "block",
            fontSize: "13px",
            fontWeight: "600",
            color: "#374151",
            marginBottom: "5px",
          }}
        >
          New Expiry Date *
        </label>
        <input
          type="date"
          value={newExpiry}
          onChange={(event) => {
            setNewExpiry(event.target.value);
            setErrors([]);
          }}
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: "8px 10px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontSize: "14px",
            outline: "none",
            marginBottom: "16px",
            boxSizing: "border-box",
          }}
        />

        {suggestedExpiry ? (
          <p style={{ margin: "-10px 0 16px", fontSize: "12px", color: "#6b7280" }}>
            Suggested based on {qual.validityDays || 365}-day validity:{" "}
            <button
              onClick={() => setNewExpiry(suggestedExpiry)}
              disabled={isSubmitting}
              style={{
                background: "none",
                border: "none",
                color: "#2563eb",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                fontSize: "12px",
                fontWeight: "600",
                padding: 0,
              }}
            >
              use {suggestedExpiry}
            </button>
          </p>
        ) : null}

        <label
          style={{
            display: "block",
            fontSize: "13px",
            fontWeight: "600",
            color: "#374151",
            marginBottom: "5px",
          }}
        >
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Reason for renewal, reference number, etc."
          rows={3}
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: "8px 10px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontSize: "14px",
            outline: "none",
            resize: "vertical",
            boxSizing: "border-box",
            fontFamily: "inherit",
          }}
        />
        <p style={{ margin: "4px 0 20px", fontSize: "11px", color: "#9ca3af" }}>
          {notes.length}/500
        </p>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={ghostBtn} disabled={isSubmitting}>
            Cancel
          </button>
          <button onClick={handleSubmit} style={primaryBtn} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Confirm Renewal"}
          </button>
        </div>
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
};
