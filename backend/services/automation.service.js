const prisma = require("../prisma/client");
const traineeQualificationService = require("./traineeQualification.service");

const { ServiceError, QUALIFICATION_STATUSES } = traineeQualificationService;

const MILESTONE_RULES = {
  FLIGHT_HOURS: ["atpl theory", "ir rating", "type rating a320"],
  COURSE_COMPLETION: ["atpl theory", "crm certificate", "medical class 1"],
  SIMULATOR_SESSION: ["ir rating", "type rating a320"],
  ANNUAL_CHECK: ["medical class 1", "crm certificate"],
};

const MILESTONE_LABELS = {
  FLIGHT_HOURS: "Flight Hours",
  COURSE_COMPLETION: "Course Completion",
  SIMULATOR_SESSION: "Simulator Session",
  ANNUAL_CHECK: "Annual Check",
};

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
  const baseDate =
    normalizeDateOnly(currentExpiry).getTime() > today.getTime()
      ? normalizeDateOnly(currentExpiry)
      : today;

  baseDate.setUTCDate(baseDate.getUTCDate() + validityDays);
  return baseDate;
};

const isQualificationEligibleForRenewal = (qualification) => {
  if (!qualification) {
    throw new ServiceError("Qualification is required.", 400);
  }

  if (qualification.status === QUALIFICATION_STATUSES.REVOKED) {
    return {
      eligible: false,
      reason: "Qualification has been revoked.",
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

  if (
    qualification.status === QUALIFICATION_STATUSES.VALID ||
    qualification.status === QUALIFICATION_STATUSES.EXPIRING ||
    qualification.status === QUALIFICATION_STATUSES.EXPIRED
  ) {
    return {
      eligible: true,
      reason: "Eligible due to milestone trigger.",
      daysLeft,
    };
  }

  return {
    eligible: false,
    reason: "Qualification is not yet eligible for renewal.",
    daysLeft,
  };
};

const getMilestonePreview = async ({ traineeId, milestoneType }) => {
  if (!traineeId || !milestoneType) {
    throw new ServiceError("traineeId and milestoneType are required.", 400);
  }

  const eligibleTypeNames = MILESTONE_RULES[milestoneType];

  if (!eligibleTypeNames) {
    throw new ServiceError("Invalid milestoneType.", 400);
  }

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

  return qualifications
    .filter((qualification) =>
      eligibleTypeNames.includes(
        String(qualification.qualification_types?.name || "").trim().toLowerCase()
      )
    )
    .map((qualification) => {
      const eligibility = isQualificationEligibleForRenewal(qualification);

      return {
        qualification,
        ...eligibility,
      };
    });
};

const applyMilestoneRenewal = async ({ traineeId, milestoneType }) => {
  const preview = await getMilestonePreview({ traineeId, milestoneType });
  const eligibleQualifications = preview.filter((item) => item.eligible);

  const renewals = [];

  for (const item of eligibleQualifications) {
    const validityDays = item.qualification.qualification_types?.validityDays || 0;
    const newExpiryDate = calculateRenewedExpiryDate(
      item.qualification.expiryDate,
      validityDays
    );

    const renewal =
      await traineeQualificationService.createQualificationRenewal({
        traineeQualificationId: item.qualification.id,
        renewedOn: normalizeDateOnly(new Date()),
        newExpiryDate,
        notes: `Auto: ${MILESTONE_LABELS[milestoneType] || milestoneType}`,
      });

    renewals.push(renewal.trainee_qualifications);
  }

  return renewals;
};

module.exports = {
  MILESTONE_LABELS,
  MILESTONE_RULES,
  calculateRenewedExpiryDate,
  getMilestonePreview,
  applyMilestoneRenewal,
  isQualificationEligibleForRenewal,
};
