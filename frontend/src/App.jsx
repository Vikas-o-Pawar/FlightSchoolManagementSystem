import { useState } from "react";
import QMSPage from "./pages/QMSPage";
import AutomationPage from "./pages/AutomationPage";
import AlertsPage from "./pages/AlertsPage";
import ResourcesPage from "./pages/ResourcesPage";

export default function App() {
  const [page, setPage] = useState("qms");

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <div
        style={{
          background: "#1e3a5f",
          color: "#fff",
          padding: "0 32px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          gap: "32px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontWeight: "700", fontSize: "16px" }}>FSMS</span>
          <span style={{ color: "#94a3b8", fontSize: "13px" }}>
            QMS Module - Team T6
          </span>
        </div>

        <div style={{ display: "flex", gap: "4px" }}>
          {[
            ["qms", "Qualifications"],
            ["automation", "Automation"],
            ["alerts", "Alerts"],
            ["resources", "Resources"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPage(key)}
              style={{
                padding: "6px 16px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px",
                background:
                  page === key ? "rgba(255,255,255,0.15)" : "transparent",
                color: "#fff",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {page === "qms" && <QMSPage />}
      {page === "automation" && <AutomationPage />}
      {page === "alerts" && <AlertsPage />}
      {page === "resources" && <ResourcesPage />}
    </div>
  );
}
