export const MILESTONE_RULES = {
  FLIGHT_HOURS: ["atpl theory", "ir rating", "type rating a320"],
  COURSE_COMPLETION: ["atpl theory", "crm certificate", "medical class 1"],
  SIMULATOR_SESSION: ["ir rating", "type rating a320"],
  ANNUAL_CHECK: ["medical class 1", "crm certificate"],
};

export const MILESTONE_LABELS = {
  FLIGHT_HOURS: "Flight Hours",
  COURSE_COMPLETION: "Course Completion",
  SIMULATOR_SESSION: "Simulator Session",
  ANNUAL_CHECK: "Annual Check",
};

export function calculateExpiry(issuedDate, validityDays) {
  const date = new Date(issuedDate);
  date.setDate(date.getDate() + validityDays);
  return date.toISOString().split("T")[0];
}

export function calculateRenewedExpiry(currentExpiry, validityDays) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const current = new Date(currentExpiry);
  current.setHours(0, 0, 0, 0);

  const baseDate = current > now ? current : now;
  baseDate.setDate(baseDate.getDate() + validityDays);
  return baseDate.toISOString().split("T")[0];
}

export function checkEligibility(qual) {
  if (qual.status === "REVOKED") {
    return { eligible: false, reason: "Qualification has been revoked." };
  }

  const daysToExpiry = Math.floor(
    (new Date(qual.expiryDate) - new Date()) / 86400000
  );

  if (qual.status === "VALID" && daysToExpiry > 60) {
    return {
      eligible: false,
      reason: "Qualification is still valid and expires more than 60 days away.",
    };
  }

  return {
    eligible: true,
    reason: "Eligible for renewal.",
  };
}

export function verifyRenewalRules(qual, newExpiry, notes) {
  const errors = [];

  if (!newExpiry) {
    errors.push("New expiry date is required.");
  } else if (new Date(newExpiry) <= new Date(qual.expiryDate)) {
    errors.push("New expiry date must be later than the current expiry date.");
  }

  const daysToExpiry = Math.floor(
    (new Date(qual.expiryDate) - new Date()) / 86400000
  );

  if (qual.status === "VALID" && daysToExpiry > 60) {
    errors.push(
      "Renewal is blocked while the qualification is valid and expires more than 60 days away."
    );
  }

  if (notes && notes.length > 500) {
    errors.push("Notes must be under 500 characters.");
  }

  return errors;
}
