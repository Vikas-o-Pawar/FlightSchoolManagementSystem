const prisma = require("../prisma/client");
const { MILESTONE_AUTOMATION_CONFIG } = require("../config/milestoneRenewal.config");
const traineeQualificationService = require("./traineeQualification.service");

const { ServiceError, QUALIFICATION_STATUSES } = traineeQualificationService;

const normalizeDateOnly = (value) => {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const getDaysLeft = (expiryDate) => {
  const today = normalizeDateOnly(new Date());
  const normalizedExpiryDate = normalizeDateOnly(expiryDate);
  return Math.floor((normalizedExpiryDate.getTime() - today.getTime()) / 86400000);
};

const calculateRenewedExpiryDate = (currentExpiry, validityDays) => {
  const today = normalizeDateOnly(new Date());
  const current = normalizeDateOnly(currentExpiry);
  const baseDate = current.getTime() > today.getTime() ? current : today;

  baseDate.setUTCDate(baseDate.getUTCDate() + validityDays);
  return baseDate;
};

const normalizeTypeName = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getMilestoneAutomationConfig = () => ({
  enabled: MILESTONE_AUTOMATION_CONFIG.enabled,
  source: MILESTONE_AUTOMATION_CONFIG.source,
  message: MILESTONE_AUTOMATION_CONFIG.message,
  missingRequirements: [...MILESTONE_AUTOMATION_CONFIG.missingRequirements],
  allowManualOverrideWithoutEvidence:
    MILESTONE_AUTOMATION_CONFIG.allowManualOverrideWithoutEvidence === true,
  rules: MILESTONE_AUTOMATION_CONFIG.rules.map((rule) => ({
    type: rule.type,
    label: rule.label,
    description: rule.description,
    sourceEntity: rule.sourceEntity,
    qualificationTypes: [...rule.qualificationTypes],
    allowExpired: rule.allowExpired,
  })),
});

const assertMilestoneAutomationConfigured = () => {
  if (MILESTONE_AUTOMATION_CONFIG.enabled) {
    return;
  }

  throw new ServiceError(MILESTONE_AUTOMATION_CONFIG.message, 409);
};

const ensureMilestoneRuleExists = (milestoneType) => {
  if (!milestoneType) {
    throw new ServiceError("milestoneType is required.", 400);
  }

  const rule = MILESTONE_AUTOMATION_CONFIG.rules.find(
    (candidate) => candidate.type === milestoneType
  );

  if (!rule) {
    throw new ServiceError("Invalid milestoneType.", 400);
  }

  return rule;
};

const buildMilestoneNote = (rule, evidence) =>
  `Milestone: ${rule.label} [source=${evidence.sourceKey}]`;

const buildManualOverrideEvidence = (qualification, rule) => ({
  sourceKey: `manual-trigger:${rule.type}:${qualification.id}:${normalizeDateOnly(
    qualification.expiryDate
  )
    .toISOString()
    .split("T")[0]}`,
  completedOn: new Date(),
  summary: `Manual milestone selection used for ${rule.label}.`,
});

const getMissingEvidenceReason = (rule) => {
  switch (rule.evidence?.kind) {
    case "flight_hours_target":
      return "No flight hours record has reached the configured target for this trainee.";
    case "session_grade":
      return `No session with grade >= ${rule.evidence.minGrade} was found for this trainee.`;
    case "trainee_status":
      return `Trainee status is not ${rule.evidence.status}.`;
    default:
      return "No qualifying milestone evidence was found for this trainee.";
  }
};

const hasMilestoneRenewalForSource = (qualification, evidence) =>
  (qualification.qualification_renewals || []).some((renewal) =>
    String(renewal.notes || "").includes(`[source=${evidence.sourceKey}]`)
  );

const isQualificationEligibleForRenewal = (qualification, rule, evidence) => {
  if (qualification.status === QUALIFICATION_STATUSES.REVOKED) {
    return {
      eligible: false,
      reason: "Qualification has been revoked.",
    };
  }

  if (
    qualification.status === QUALIFICATION_STATUSES.EXPIRED &&
    rule.allowExpired !== true
  ) {
    return {
      eligible: false,
      reason: "This rule does not allow renewing expired qualifications.",
    };
  }

  if (hasMilestoneRenewalForSource(qualification, evidence)) {
    return {
      eligible: false,
      reason: "This qualification was already renewed by the same milestone source.",
    };
  }

  const daysLeft = getDaysLeft(qualification.expiryDate);

  if (
    qualification.status === QUALIFICATION_STATUSES.VALID &&
    daysLeft > 60
  ) {
    return {
      eligible: false,
      reason: "Qualification is still valid and expires more than 60 days away.",
    };
  }

  return {
    eligible: true,
    reason: `Eligible via ${rule.label}.`,
  };
};

const getMilestoneEvidenceForRule = async (traineeId, rule) => {
  switch (rule.evidence?.kind) {
    case "trainee_status": {
      const trainee = await prisma.trainees.findUnique({
        where: { id: traineeId },
      });

      if (!trainee || trainee.status !== rule.evidence.status) {
        return [];
      }

      return [
        {
          sourceKey: `trainees:${trainee.id}:status:${trainee.status}`,
          completedOn: trainee.updatedAt || trainee.createdAt || new Date(),
          summary: `Trainee status is ${trainee.status}.`,
        },
      ];
    }
    case "session_grade": {
      const sessions = await prisma.sessions.findMany({
        where: {
          traineeId,
          grade: {
            gte: rule.evidence.minGrade,
          },
        },
        orderBy: {
          date: "desc",
        },
      });

      return sessions.map((session) => ({
        sourceKey: `sessions:${session.id}:grade:${rule.evidence.minGrade}`,
        completedOn: session.date,
        summary: `Session grade ${session.grade} on ${normalizeDateOnly(session.date)
          .toISOString()
          .split("T")[0]}.`,
      }));
    }
    case "flight_hours_target": {
      const flightHours = await prisma.flight_hours.findUnique({
        where: { traineeId },
      });

      if (!flightHours || flightHours.totalHours < flightHours.targetHours) {
        return [];
      }

      return [
        {
          sourceKey: `flight_hours:${flightHours.id}:target:${flightHours.targetHours}`,
          completedOn: new Date(),
          summary: `Flight hours target reached (${flightHours.totalHours}/${flightHours.targetHours}).`,
        },
      ];
    }
    default:
      return [];
  }
};

const getMatchingQualifications = async (traineeId, rule) => {
  const aliases = new Set(
    (rule.qualificationTypeAliases || []).map(normalizeTypeName)
  );

  const qualifications = await prisma.trainee_qualifications.findMany({
    where: { traineeId },
    include: {
      trainees: true,
      qualification_types: true,
      qualification_renewals: {
        orderBy: {
          renewedOn: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return qualifications.filter((qualification) =>
    aliases.has(normalizeTypeName(qualification.qualification_types?.name))
  );
};

const pickLatestUnusedEvidence = (qualification, evidences) =>
  evidences.find((evidence) => !hasMilestoneRenewalForSource(qualification, evidence)) ||
  null;

const getMilestonePreview = async ({ traineeId, milestoneType }) => {
  assertMilestoneAutomationConfigured();

  if (!traineeId) {
    throw new ServiceError("traineeId is required.", 400);
  }

  const rule = ensureMilestoneRuleExists(milestoneType);
  const evidences = await getMilestoneEvidenceForRule(traineeId, rule);
  const qualifications = await getMatchingQualifications(traineeId, rule);

  if (qualifications.length === 0) {
    return [];
  }

  if (evidences.length === 0) {
    if (MILESTONE_AUTOMATION_CONFIG.allowManualOverrideWithoutEvidence !== true) {
      return qualifications.map((qualification) => ({
        qualification,
        milestoneType: rule.type,
        milestoneLabel: rule.label,
        evidence: null,
        eligible: false,
        reason: getMissingEvidenceReason(rule),
      }));
    }

    return qualifications.map((qualification) => {
      const evidence = buildManualOverrideEvidence(qualification, rule);
      const eligibility = isQualificationEligibleForRenewal(
        qualification,
        rule,
        evidence
      );

      return {
        qualification,
        milestoneType: rule.type,
        milestoneLabel: rule.label,
        evidence,
        ...eligibility,
        reason:
          eligibility.reason === `Eligible via ${rule.label}.`
            ? `${eligibility.reason} No source record was found, so manual milestone selection is being used as a temporary override.`
            : eligibility.reason,
      };
    });
  }

  return qualifications.map((qualification) => {
    const evidence = pickLatestUnusedEvidence(qualification, evidences) || evidences[0];
    const eligibility = isQualificationEligibleForRenewal(
      qualification,
      rule,
      evidence
    );

    return {
      qualification,
      milestoneType: rule.type,
      milestoneLabel: rule.label,
      evidence: {
        sourceKey: evidence.sourceKey,
        completedOn: evidence.completedOn,
        summary: evidence.summary,
      },
      ...eligibility,
    };
  });
};

const applyMilestoneRenewal = async ({ traineeId, milestoneType }) => {
  assertMilestoneAutomationConfigured();

  const rule = ensureMilestoneRuleExists(milestoneType);
  const preview = await getMilestonePreview({ traineeId, milestoneType });
  const eligibleQualifications = preview.filter((item) => item.eligible);

  const renewals = [];

  for (const item of eligibleQualifications) {
    const validityDays = item.qualification.qualification_types?.validityDays || 0;
    const newExpiryDate = calculateRenewedExpiryDate(
      item.qualification.expiryDate,
      validityDays
    );

    const renewal = await traineeQualificationService.createQualificationRenewal({
      traineeQualificationId: item.qualification.id,
      renewedOn: item.evidence.completedOn || normalizeDateOnly(new Date()),
      newExpiryDate,
      notes: buildMilestoneNote(rule, item.evidence),
    });

    renewals.push(renewal.trainee_qualifications);
  }

  return renewals;
};

module.exports = {
  calculateRenewedExpiryDate,
  getMilestoneAutomationConfig,
  getMilestonePreview,
  applyMilestoneRenewal,
  isQualificationEligibleForRenewal,
};
