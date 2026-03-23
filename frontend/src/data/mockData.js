// ─── Qualification Types ───────────────────────────────────────────────────────
export const QUAL_TYPES = [
  { id: "qt1", name: "ATPL Theory",     validityDays: 730  },
  { id: "qt2", name: "IR Rating",        validityDays: 365  },
  { id: "qt3", name: "Medical Class 1",  validityDays: 180  },
  { id: "qt4", name: "Type Rating A320", validityDays: 365  },
  { id: "qt5", name: "CRM Certificate",  validityDays: 1095 },
];

// ─── Trainees ──────────────────────────────────────────────────────────────────
export const TRAINEES = [
  { id: "tr1", traineeId: "TRN-001", name: "Ahmed Al-Rashid" },
  { id: "tr2", traineeId: "TRN-002", name: "Sofia Martinez"  },
  { id: "tr3", traineeId: "TRN-003", name: "James Thornton"  },
  { id: "tr4", traineeId: "TRN-004", name: "Priya Nair"      },
];

// ─── Helper: date string N days from today ─────────────────────────────────────
function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

// ─── Sample Qualifications ─────────────────────────────────────────────────────
export const INITIAL_QUALS = [
  { id: "q1", traineeId: "tr1", qualificationTypeId: "qt1", issuedDate: addDays(-200), expiryDate: addDays(530),  verified: true  },
  { id: "q2", traineeId: "tr1", qualificationTypeId: "qt3", issuedDate: addDays(-160), expiryDate: addDays(20),   verified: true  },
  { id: "q3", traineeId: "tr2", qualificationTypeId: "qt2", issuedDate: addDays(-400), expiryDate: addDays(-35),  verified: false },
  { id: "q4", traineeId: "tr2", qualificationTypeId: "qt4", issuedDate: addDays(-90),  expiryDate: addDays(275),  verified: true  },
  { id: "q5", traineeId: "tr3", qualificationTypeId: "qt5", issuedDate: addDays(-30),  expiryDate: addDays(1065), verified: false },
  { id: "q6", traineeId: "tr4", qualificationTypeId: "qt3", issuedDate: addDays(-50),  expiryDate: addDays(130),  verified: true  },
];