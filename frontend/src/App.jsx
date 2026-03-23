// App.jsx — Root with simple tab navigation between I-16 and I-17 pages

import { useState } from "react";
import QMSPage        from "./pages/QMSPage";
import AutomationPage from "./pages/AutomationPage";

export default function App() {
  const [page, setPage] = useState("qms"); // "qms" | "automation"

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>

      {/* Top nav with page switcher */}
      <div style={{ background: "#1e3a5f", color: "#fff", padding: "0 32px", height: "56px", display: "flex", alignItems: "center", gap: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>✈️</span>
          <span style={{ fontWeight: "700", fontSize: "16px" }}>FSMS</span>
          <span style={{ color: "#94a3b8", fontSize: "13px" }}>QMS Module — Team T6</span>
        </div>

        {/* Page tabs */}
        <div style={{ display: "flex", gap: "4px" }}>
          <button onClick={() => setPage("qms")} style={{
            padding: "6px 16px", borderRadius: "6px", border: "none", cursor: "pointer",
            fontWeight: "600", fontSize: "13px",
            background: page === "qms" ? "rgba(255,255,255,0.15)" : "transparent",
            color: "#fff",
          }}>
            📋 Qualifications
          </button>
          <button onClick={() => setPage("automation")} style={{
            padding: "6px 16px", borderRadius: "6px", border: "none", cursor: "pointer",
            fontWeight: "600", fontSize: "13px",
            background: page === "automation" ? "rgba(255,255,255,0.15)" : "transparent",
            color: "#fff",
          }}>
            ⚡ Automation
          </button>
        </div>
      </div>

      {/* Page content */}
      {page === "qms"        && <QMSPage />}
      {page === "automation" && <AutomationPage />}
    </div>
  );
}