const MILESTONE_AUTOMATION_CONFIG = {
  enabled: true,
  source:
    "Derived from existing training data in this repo: trainees.status, sessions.grade, and flight_hours totals.",
  message:
    "Milestone automation renews qualifications only when an existing training record satisfies a configured rule and that source has not already renewed the same qualification.",
  missingRequirements: [],
  allowManualOverrideWithoutEvidence: true,
  rules: [
    {
      type: "TRAINING_COMPLETED",
      label: "Training Completed",
      description:
        "Uses trainees.status = COMPLETED as the milestone source.",
      sourceEntity: "trainees",
      qualificationTypes: ["ATPL Theory", "CRM Certificate"],
      qualificationTypeAliases: ["atpl theory", "crm certificate"],
      allowExpired: true,
      evidence: {
        kind: "trainee_status",
        status: "COMPLETED",
      },
    },
    {
      type: "SESSION_PASSED",
      label: "Session Passed",
      description:
        "Uses a session row with grade >= 80 as the milestone source.",
      sourceEntity: "sessions",
      qualificationTypes: ["IR Rating", "Type Rating A320"],
      qualificationTypeAliases: ["ir rating", "type rating a320"],
      allowExpired: true,
      evidence: {
        kind: "session_grade",
        minGrade: 80,
      },
    },
    {
      type: "FLIGHT_HOURS_TARGET_REACHED",
      label: "Flight Hours Target Reached",
      description:
        "Uses flight_hours.totalHours >= flight_hours.targetHours as the milestone source.",
      sourceEntity: "flight_hours",
      qualificationTypes: ["CPL"],
      qualificationTypeAliases: ["cpl", "commercial pilot license"],
      allowExpired: true,
      evidence: {
        kind: "flight_hours_target",
      },
    },
  ],
};

module.exports = {
  MILESTONE_AUTOMATION_CONFIG,
};
