import { useEffect, useMemo, useState } from "react";
import {
  createQualification,
  deleteQualification,
  generateCertificate,
  getAlerts,
  getAllQualifications,
  getQualificationTypes,
  getTrainees,
  updateQualification,
} from "../api/qualificationApi";
import { getDaysLeft } from "../utils/helpers";
import StatsRow from "../components/StatsRow";
import FilterBar from "../components/FilterBar";
import QualTable from "../components/QualTable";
import QualModal from "../components/QualModal";
import DetailModal from "../components/DetailModal";
import DeleteConfirm from "../components/DeleteConfirm";

function enrichQualification(qualification) {
  return {
    ...qualification,
    daysLeft: getDaysLeft(qualification.expiryDate),
    traineeName: qualification.trainees?.name || "-",
    traineeCode: qualification.trainees?.traineeId || "-",
    qualTypeName: qualification.qualification_types?.name || "-",
    validityDays: qualification.qualification_types?.validityDays || 0,
  };
}

export default function QMSPage() {
  const [quals, setQuals] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [qualificationTypes, setQualificationTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);
  const [certificateMessage, setCertificateMessage] = useState("");

  useEffect(() => {
    loadPageData();
  }, []);

  async function loadPageData({ keepViewId } = {}) {
    setLoading(true);
    setError("");

    try {
      const [qualifications, activeAlerts, types, traineeList] = await Promise.all([
        getAllQualifications(),
        getAlerts(),
        getQualificationTypes(),
        getTrainees(),
      ]);

      setQuals(qualifications);
      setAlerts(activeAlerts);
      setQualificationTypes(types);
      setTrainees(traineeList);

      if (keepViewId) {
        const refreshedQualification = qualifications.find(
          (qualification) => qualification.id === keepViewId
        );
        setViewItem(refreshedQualification ? enrichQualification(refreshedQualification) : null);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  const enriched = useMemo(() => quals.map(enrichQualification), [quals]);

  const traineeOptions = useMemo(() => {
    if (trainees.length > 0) {
      return trainees;
    }

    const seen = new Map();

    enriched.forEach((qualification) => {
      if (!seen.has(qualification.traineeId)) {
        seen.set(qualification.traineeId, {
          id: qualification.traineeId,
          name: qualification.traineeName,
          traineeId: qualification.traineeCode,
        });
      }
    });

    if (editData && !seen.has(editData.traineeId)) {
      seen.set(editData.traineeId, {
        id: editData.traineeId,
        name: editData.traineeName,
        traineeId: editData.traineeCode,
      });
    }

    return Array.from(seen.values()).sort((left, right) =>
      left.name.localeCompare(right.name)
    );
  }, [editData, enriched, trainees]);

  const filtered = useMemo(
    () =>
      enriched
        .filter((qualification) => {
          return statusFilter === "ALL" || qualification.status === statusFilter;
        })
        .filter((qualification) => {
          const term = search.trim().toLowerCase();

          return (
            !term ||
            qualification.traineeName.toLowerCase().includes(term) ||
            qualification.qualTypeName.toLowerCase().includes(term) ||
            qualification.traineeCode.toLowerCase().includes(term)
          );
        })
        .sort(
          (left, right) =>
            new Date(left.expiryDate).getTime() - new Date(right.expiryDate).getTime()
        ),
    [enriched, search, statusFilter]
  );

  const urgentAlerts = alerts.filter((alert) => alert.severity === "urgent");
  const expiringSoonAlerts = alerts.filter(
    (alert) => alert.severity === "expiring_soon"
  );

  async function handleSave(formData) {
    setIsSaving(true);
    setFormError("");

    try {
      if (editData) {
        await updateQualification(editData.id, formData);
      } else {
        await createQualification(formData);
      }

      await loadPageData();
      setShowForm(false);
      setEditData(null);
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id) {
    setIsDeleting(true);
    setError("");

    try {
      await deleteQualification(id);
      await loadPageData();
      setDeleteItem(null);
      setViewItem(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsDeleting(false);
    }
  }

  function openEdit(qualification) {
    setFormError("");
    setCertificateMessage("");
    setEditData(qualification);
    setViewItem(null);
    setShowForm(true);
  }

  function openDelete(qualification) {
    setCertificateMessage("");
    setDeleteItem(qualification);
    setViewItem(null);
  }

  async function handleGenerateCertificate(id) {
    setIsGeneratingCertificate(true);
    setError("");
    setCertificateMessage("");

    try {
      await generateCertificate(id);
      await loadPageData({ keepViewId: id });
      setCertificateMessage("Certificate generated successfully.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsGeneratingCertificate(false);
    }
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: "#111827" }}>
            Qualifications & Certifications
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#6b7280" }}>
            Track trainee certifications, expiry dates, alerts, and certificates
          </p>
        </div>
        <button
          onClick={() => {
            setFormError("");
            setEditData(null);
            setShowForm(true);
          }}
          style={primaryBtn}
          disabled={loading || isSaving}
        >
          + New Qualification
        </button>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {loading ? <LoadingState label="Loading qualifications..." /> : null}

      {!loading ? (
        <>
          <AlertPanel urgentAlerts={urgentAlerts} expiringSoonAlerts={expiringSoonAlerts} />
          <StatsRow quals={enriched} />
          <FilterBar
            search={search}
            onSearch={setSearch}
            statusFilter={statusFilter}
            onStatusFilter={setStatusFilter}
          />
          <QualTable
            quals={filtered}
            onView={(qualification) => setViewItem(qualification)}
            onEdit={openEdit}
            onDelete={openDelete}
          />
          <p style={{ margin: "10px 0 0", fontSize: "13px", color: "#9ca3af" }}>
            Showing {filtered.length} of {enriched.length} records
          </p>
        </>
      ) : null}

      <QualModal
        isOpen={showForm}
        onClose={() => {
          if (isSaving) {
            return;
          }

          setShowForm(false);
          setEditData(null);
          setFormError("");
        }}
        onSave={handleSave}
        initialData={editData}
        traineeOptions={traineeOptions}
        qualificationTypeOptions={qualificationTypes}
        isSaving={isSaving}
        error={formError}
      />
      <DetailModal
        qual={viewItem}
        onClose={() => {
          setViewItem(null);
          setCertificateMessage("");
        }}
        onEdit={openEdit}
        onDelete={openDelete}
        onGenerateCertificate={handleGenerateCertificate}
        isGeneratingCertificate={isGeneratingCertificate}
        certificateMessage={certificateMessage}
      />
      <DeleteConfirm
        qual={deleteItem}
        onConfirm={handleDelete}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteItem(null);
          }
        }}
      />
    </div>
  );
}

function AlertPanel({ urgentAlerts, expiringSoonAlerts }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
      <AlertCard
        title="Urgent Alerts"
        value={urgentAlerts.length}
        subtitle="30-day renewals needing attention"
        color="#dc2626"
      />
      <AlertCard
        title="Expiring Soon"
        value={expiringSoonAlerts.length}
        subtitle="60 or 90 day alert windows"
        color="#d97706"
      />
    </div>
  );
}

function AlertCard({ title, value, subtitle, color }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "16px 20px",
        borderTop: `4px solid ${color}`,
      }}
    >
      <div style={{ fontSize: "28px", fontWeight: "700", color }}>{value}</div>
      <div style={{ fontSize: "13px", color: "#111827", fontWeight: "600", marginTop: "4px" }}>
        {title}
      </div>
      <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>{subtitle}</div>
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div
      style={{
        marginBottom: "16px",
        padding: "10px 12px",
        borderRadius: "8px",
        border: "1px solid #fca5a5",
        background: "#fee2e2",
        color: "#b91c1c",
        fontSize: "13px",
      }}
    >
      {message}
    </div>
  );
}

function LoadingState({ label }) {
  return (
    <div
      style={{
        padding: "48px",
        textAlign: "center",
        color: "#6b7280",
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
      }}
    >
      {label}
    </div>
  );
}

const primaryBtn = {
  padding: "9px 20px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "7px",
  fontWeight: "600",
  fontSize: "14px",
  cursor: "pointer",
};
