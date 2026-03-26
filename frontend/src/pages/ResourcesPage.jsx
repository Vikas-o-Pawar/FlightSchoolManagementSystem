import { useEffect, useState } from "react";
import { getResourceDashboard } from "../api/qualificationApi";

const TYPE_COLORS = {
  AIRCRAFT: { bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8" },
  SIMULATOR: { bg: "#f5f3ff", border: "#ddd6fe", color: "#6d28d9" },
};

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadResources();
  }, []);

  async function loadResources() {
    setLoading(true);
    setError("");

    try {
      const data = await getResourceDashboard();
      setResources(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: "#111827" }}>
          Resource Dashboard
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#6b7280" }}>
          Aircraft and simulators with their required qualification types
        </p>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {loading ? (
        <LoadingState label="Loading resources..." />
      ) : resources.length === 0 ? (
        <EmptyState label="No resources available." />
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {resources.map((resource) => {
            const colors = TYPE_COLORS[resource.type] || TYPE_COLORS.AIRCRAFT;

            return (
              <div
                key={resource.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "16px 18px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#111827" }}>
                      {resource.name}
                    </div>
                    <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
                      Status: {resource.status}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: "700",
                      background: colors.bg,
                      color: colors.color,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {resource.type}
                  </span>
                </div>

                <div style={{ marginTop: "14px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {resource.requiredQualifications.length > 0 ? (
                    resource.requiredQualifications.map((qualification) => (
                      <span
                        key={qualification.id}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: "600",
                          background: "#f9fafb",
                          color: "#374151",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        {qualification.name}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: "13px", color: "#9ca3af" }}>
                      No qualification requirements configured.
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
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
