import { useEffect, useState } from "react";
import { addDaysToDate, today } from "../utils/helpers";

const EMPTY = {
  traineeId: "",
  qualificationTypeId: "",
  issuedDate: today(),
  expiryDate: "",
  verified: false,
};

export default function QualModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  traineeOptions = [],
  qualificationTypeOptions = [],
  isSaving = false,
  error = "",
}) {
  const [form, setForm] = useState(EMPTY);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    setForm(
      initialData
        ? {
            traineeId: initialData.traineeId || "",
            qualificationTypeId: initialData.qualificationTypeId || "",
            issuedDate: initialData.issuedDate || today(),
            expiryDate: initialData.expiryDate || "",
            verified: Boolean(initialData.verified),
          }
        : EMPTY
    );
    setValidationError("");
  }, [initialData, isOpen]);

  const selectedType = qualificationTypeOptions.find(
    (type) => type.id === form.qualificationTypeId
  );

  function handleTypeChange(typeId) {
    const nextType = qualificationTypeOptions.find((type) => type.id === typeId);
    const expiry =
      nextType && form.issuedDate
        ? addDaysToDate(form.issuedDate, nextType.validityDays)
        : "";

    setValidationError("");
    setForm((current) => ({
      ...current,
      qualificationTypeId: typeId,
      expiryDate: expiry,
    }));
  }

  function handleIssuedChange(date) {
    const expiry = selectedType
      ? addDaysToDate(date, selectedType.validityDays)
      : form.expiryDate;

    setValidationError("");
    setForm((current) => ({ ...current, issuedDate: date, expiryDate: expiry }));
  }

  function handleSubmit() {
    if (!form.traineeId || !form.qualificationTypeId || !form.issuedDate) {
      setValidationError("Please fill in all required fields.");
      return;
    }

    setValidationError("");
    onSave({
      traineeId: form.traineeId,
      qualificationTypeId: form.qualificationTypeId,
      issuedDate: form.issuedDate,
      verified: form.verified,
    });
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      onClick={isSaving ? undefined : onClose}
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
        <h2 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: "700" }}>
          {initialData ? "Edit Qualification" : "New Qualification"}
        </h2>

        {error || validationError ? (
          <div
            style={{
              marginBottom: "14px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #fca5a5",
              background: "#fee2e2",
              color: "#b91c1c",
              fontSize: "13px",
            }}
          >
            {error || validationError}
          </div>
        ) : null}

        <Label text="Trainee *">
          <select
            value={form.traineeId}
            onChange={(event) => {
              setValidationError("");
              setForm((current) => ({ ...current, traineeId: event.target.value }));
            }}
            style={inputStyle}
            disabled={isSaving}
          >
            <option value="">Select trainee...</option>
            {traineeOptions.map((trainee) => (
              <option key={trainee.id} value={trainee.id}>
                {trainee.name} ({trainee.traineeId})
              </option>
            ))}
          </select>
        </Label>

        <Label text="Qualification Type *">
          <select
            value={form.qualificationTypeId}
            onChange={(event) => handleTypeChange(event.target.value)}
            style={inputStyle}
            disabled={isSaving}
          >
            <option value="">Select type...</option>
            {qualificationTypeOptions.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} ({type.validityDays} days)
              </option>
            ))}
          </select>
        </Label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Label text="Issued Date *">
            <input
              type="date"
              value={form.issuedDate}
              onChange={(event) => handleIssuedChange(event.target.value)}
              style={inputStyle}
              disabled={isSaving}
            />
          </Label>
          <Label text="Expiry Date">
            <input
              type="date"
              value={form.expiryDate}
              readOnly
              style={{ ...inputStyle, background: "#f9fafb", color: "#6b7280" }}
            />
          </Label>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            margin: "12px 0 20px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={form.verified}
            onChange={(event) => {
              setForm((current) => ({ ...current, verified: event.target.checked }));
            }}
            disabled={isSaving}
          />
          Mark as verified
        </label>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={ghostBtn} disabled={isSaving}>
            Cancel
          </button>
          <button onClick={handleSubmit} style={primaryBtn} disabled={isSaving}>
            {isSaving ? "Saving..." : initialData ? "Save Changes" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({ text, children }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <label
        style={{
          display: "block",
          fontSize: "13px",
          fontWeight: "600",
          color: "#374151",
          marginBottom: "5px",
        }}
      >
        {text}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

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
