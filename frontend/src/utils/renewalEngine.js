// Which milestone types can trigger which qualification type renewals
export const MILESTONE_RULES = {
  COURSE_COMPLETE:    ["qt1", "qt2", "qt4", "qt5"], // ATPL, IR, Type Rating, CRM
  ASSESSMENT_PASSED:  ["qt3"],                       // Medical Class 1
  SIMULATOR_SESSION:  ["qt2", "qt4"],                // IR Rating, Type Rating
  ANNUAL_CHECK:       ["qt1", "qt3", "qt5"],         // ATPL, Medical, CRM
};

// Human-readable milestone labels
export const MILESTONE_LABELS = {
  COURSE_COMPLETE:   "Course Completion",
  ASSESSMENT_PASSED: "Assessment Passed",
  SIMULATOR_SESSION: "Simulator Session",
  ANNUAL_CHECK:      "Annual Check",
};

// ── 1. Expiry Calculation ─────────────────────────────────────────────────────

/**
 * Given an issued date and validity in days, returns the expiry date string.
 */
export function calculateExpiry(issuedDate, validityDays) {
  const d = new Date(issuedDate);
  d.setDate(d.getDate() + validityDays);
  return d.toISOString().split("T")[0];
}

/**
 * Given a current expiry date and validity in days, returns the NEW expiry
 * after renewal (extends from today if expired, or from current expiry if still valid).
 */
export function calculateRenewedExpiry(currentExpiry, validityDays) {
  const base = new Date(currentExpiry) > new Date() ? new Date(currentExpiry) : new Date();
  base.setDate(base.getDate() + validityDays);
  return base.toISOString().split("T")[0];
}

// ── 2. Eligibility Check ──────────────────────────────────────────────────────

/**
 * Returns { eligible: bool, reason: string }
 * Rules:
 *  - Must not be REVOKED
 *  - Must not have been renewed in the last 30 days (gap rule)
 *  - Expiry must be within 180 days (future) or already expired
 */
export function checkEligibility(qual, renewalHistory = []) {
  if (qual.status === "REVOKED") {
    return { eligible: false, reason: "Qualification has been revoked." };
  }

  const lastRenewal = renewalHistory
    .filter(r => r.traineeQualificationId === qual.id)
    .sort((a, b) => new Date(b.renewedOn) - new Date(a.renewedOn))[0];

  if (lastRenewal) {
    const daysSinceLast = Math.floor(
      (new Date() - new Date(lastRenewal.renewedOn)) / 86400000
    );
    if (daysSinceLast < 30) {
      return {
        eligible: false,
        reason: `Already renewed ${daysSinceLast} days ago. Must wait ${30 - daysSinceLast} more days.`,
      };
    }
  }

  const daysToExpiry = Math.floor(
    (new Date(qual.expiryDate) - new Date()) / 86400000
  );
  if (daysToExpiry > 180) {
    return {
      eligible: false,
      reason: `Expiry is ${daysToExpiry} days away. Renewal only allowed within 180 days of expiry.`,
    };
  }

  return { eligible: true, reason: "Eligible for renewal." };
}

// ── 3. Milestone Trigger ──────────────────────────────────────────────────────

/**
 * Given a milestone event, returns which qualifications for that trainee
 * should be auto-renewed.
 * Returns array of { qual, reason } objects.
 */
export function processMilestone(traineeId, milestoneType, allQuals, renewalHistory = []) {
  const eligibleTypeIds = MILESTONE_RULES[milestoneType] || [];

  const traineeQuals = allQuals.filter(
    q => q.traineeId === traineeId && eligibleTypeIds.includes(q.qualificationTypeId)
  );

  const results = [];

  for (const qual of traineeQuals) {
    const { eligible, reason } = checkEligibility(qual, renewalHistory);
    results.push({
      qual,
      eligible,
      reason,
      action: eligible ? "WILL_RENEW" : "SKIPPED",
    });
  }

  return results;
}

// ── 4. Apply Renewal ──────────────────────────────────────────────────────────

/**
 * Builds a renewal record object (to be saved / passed to state).
 */
export function buildRenewalRecord(qualId, newExpiry, notes = "") {
  return {
    id: `ren_${Date.now()}`,
    traineeQualificationId: qualId,
    renewedOn: new Date().toISOString().split("T")[0],
    newExpiryDate: newExpiry,
    notes,
  };
}

// ── 5. Verification Rules ─────────────────────────────────────────────────────

/**
 * Validates whether a manual renewal submission satisfies all rules.
 * Returns array of error strings (empty = all good).
 */
export function verifyRenewalRules(qual, newExpiry, notes) {
  const errors = [];

  if (!newExpiry) {
    errors.push("New expiry date is required.");
  } else if (new Date(newExpiry) <= new Date(qual.expiryDate)) {
    errors.push("New expiry date must be later than the current expiry date.");
  } else if (new Date(newExpiry) <= new Date()) {
    errors.push("New expiry date must be in the future.");
  }

  if (notes && notes.length > 500) {
    errors.push("Notes must be under 500 characters.");
  }

  return errors;
}