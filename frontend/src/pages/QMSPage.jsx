// QMSPage.jsx  —  I-16 page
// Moved into src/pages/ so App.jsx can switch between I-16 and I-17

import { useState, useMemo } from "react";

import { INITIAL_QUALS, TRAINEES, QUAL_TYPES } from "../data/mockData";
import { getStatus, getDaysLeft, today }       from "../utils/helpers";

import StatsRow      from "../components/StatsRow";
import FilterBar     from "../components/FilterBar";
import QualTable     from "../components/QualTable";
import QualModal     from "../components/QualModal";
import DetailModal   from "../components/DetailModal";
import DeleteConfirm from "../components/DeleteConfirm";

export default function QMSPage() {
  const [quals, setQuals] = useState(INITIAL_QUALS);

  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showForm,   setShowForm]   = useState(false);
  const [editData,   setEditData]   = useState(null);
  const [viewItem,   setViewItem]   = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const enriched = useMemo(() =>
    quals.map(q => ({
      ...q,
      status:       getStatus(q.expiryDate),
      daysLeft:     getDaysLeft(q.expiryDate),
      traineeName:  TRAINEES.find(t => t.id === q.traineeId)?.name || "—",
      traineeCode:  TRAINEES.find(t => t.id === q.traineeId)?.traineeId || "—",
      qualTypeName: QUAL_TYPES.find(qt => qt.id === q.qualificationTypeId)?.name || "—",
    })),
  [quals]);

  const filtered = useMemo(() =>
    enriched
      .filter(q => statusFilter === "ALL" || q.status === statusFilter)
      .filter(q => {
        const s = search.toLowerCase();
        return !s || q.traineeName.toLowerCase().includes(s) || q.qualTypeName.toLowerCase().includes(s) || q.traineeCode.toLowerCase().includes(s);
      })
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)),
  [enriched, statusFilter, search]);

  function handleSave(formData) {
    if (editData) {
      setQuals(qs => qs.map(q => q.id === editData.id ? { ...q, ...formData } : q));
    } else {
      setQuals(qs => [...qs, { id: `q${Date.now()}`, ...formData }]);
    }
    setShowForm(false);
    setEditData(null);
  }

  function handleDelete(id) {
    setQuals(qs => qs.filter(q => q.id !== id));
    setDeleteItem(null);
    setViewItem(null);
  }

  function openEdit(qual) { setEditData(qual); setViewItem(null); setShowForm(true); }
  function openDelete(qual) { setDeleteItem(qual); setViewItem(null); }

  return (
    <div style={{ padding: "28px 32px", maxWidth: "1200px", margin: "0 auto" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: "#111827" }}>
            Qualifications & Certifications
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#6b7280" }}>
            Track trainee certifications and expiry dates
          </p>
        </div>
        <button onClick={() => { setEditData(null); setShowForm(true); }} style={{ padding: "9px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "7px", fontWeight: "600", fontSize: "14px", cursor: "pointer" }}>
          + New Qualification
        </button>
      </div>

      <StatsRow quals={enriched} />
      <FilterBar search={search} onSearch={setSearch} statusFilter={statusFilter} onStatusFilter={setStatusFilter} />
      <QualTable quals={filtered} onView={q => setViewItem(q)} onEdit={openEdit} onDelete={openDelete} />
      <p style={{ margin: "10px 0 0", fontSize: "13px", color: "#9ca3af" }}>Showing {filtered.length} of {enriched.length} records</p>

      <QualModal     isOpen={showForm}    onClose={() => { setShowForm(false); setEditData(null); }} onSave={handleSave} initialData={editData} />
      <DetailModal   qual={viewItem}      onClose={() => setViewItem(null)}    onEdit={openEdit}   onDelete={openDelete} />
      <DeleteConfirm qual={deleteItem}    onConfirm={handleDelete}             onCancel={() => setDeleteItem(null)} />
    </div>
  );
}