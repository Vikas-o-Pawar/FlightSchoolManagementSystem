import { useEffect, useMemo, useState } from "react";
import { getAlerts, runAlerts } from "../api/qualificationApi";

const ALERT_LABELS = {
  DAYS_90: "90 Days",
  DAYS_60: "60 Days",
  DAYS_30: "30 Days",
};

const ALERT_COLORS = {
  DAYS_90: { bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8" },
  DAYS_60: { bg: "#fffbeb", border: "#fde68a", color: "#b45309" },
  DAYS_30: { bg: "#fef2f2", border: "#fecaca", color: "#dc2626" },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    setLoading(true);
    setError("");

    try {
      const data = await getAlerts();
      setAlerts(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRunAlerts() {
    setIsRunning(true);
    setError("");

    try {
      await runAlerts();
      await loadAlerts();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsRunning(false);
    }
  }

  const urgentAlerts = useMemo(
    () => alerts.filter((alert) => alert.severity === "urgent"),
    [alerts]
  );
  const expiringSoonAlerts = useMemo(
    () => alerts.filter((alert) => alert.severity === "expiring_soon"),
    [alerts]
  );

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
            Alerts
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#6b7280" }}>
            Backend-generated expiry alerts at 90, 60, and 30 days
          </p>
        </div>
        <button onClick={handleRunAlerts} style={primaryBtn} disabled={isRunning || loading}>
          {isRunning ? "Running..." : "Run Alert Scan"}
        </button>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {loading ? <LoadingState label="Loading alerts..." /> : null}

      {!loading ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <SummaryCard
              title="Urgent Alerts"
              value={urgentAlerts.length}
              subtitle="30-day expiries"
              color="#dc2626"
            />
            <SummaryCard
              title="Expiring Soon"
              value={expiringSoonAlerts.length}
              subtitle="60 and 90 day alerts"
              color="#d97706"
            />
          </div>

          {alerts.length === 0 ? (
            <EmptyState label="No alerts available." />
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {alerts.map((alert) => {
                const colors = ALERT_COLORS[alert.alertType] || ALERT_COLORS.DAYS_90;

                return (
                  <div
                    key={alert.id}
                    style={{
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: "8px",
                      padding: "14px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "16px",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: "700", color: "#111827" }}>
                        {alert.qualification.name}
                      </div>
                      <div style={{ fontSize: "13px", color: "#4b5563", marginTop: "4px" }}>
                        {alert.trainee.name} ({alert.trainee.code})
                      </div>
                      <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                        Expiry Date: {alert.expiry}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: "700",
                        background: "#fff",
                        color: colors.color,
                        border: `1px solid ${colors.border}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ALERT_LABELS[alert.alertType] || alert.alertType}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function SummaryCard({ title, value, subtitle, color }) {
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

function EmptyState({ label }) {
  return (
    <div
      style={{
        padding: "48px",
        textAlign: "center",
        color: "#9ca3af",
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
