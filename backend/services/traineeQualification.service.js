const { randomUUID } = require("crypto");
const prisma = require("../prisma/client");

const QUALIFICATION_STATUSES = {
  VALID: "VALID",
  EXPIRING: "EXPIRING",
  EXPIRED: "EXPIRED",
  REVOKED: "REVOKED",
};

class ServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "ServiceError";
    this.statusCode = statusCode;
  }
}

const qualificationInclude = {
  trainees: true,
  qualification_types: true,
  qualification_renewals: {
    orderBy: {
      renewedOn: "desc",
    },
  },
};

const qualificationDetailInclude = qualificationInclude;

const isValidDate = (value) => !Number.isNaN(new Date(value).getTime());

const parseIssuedDate = (issuedDate) => {
  if (!issuedDate || !isValidDate(issuedDate)) {
    throw new ServiceError("A valid issuedDate is required.", 400);
  }

  return new Date(issuedDate);
};

const normalizeBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
};

const calculateExpiryDate = (issuedDate, validityDays) => {
  const expiryDate = new Date(issuedDate);
  expiryDate.setUTCDate(expiryDate.getUTCDate() + validityDays);
  return expiryDate;
};

const normalizeDateOnly = (value) => {
  const parsedDate = new Date(value);
  parsedDate.setUTCHours(0, 0, 0, 0);
  return parsedDate;
};

const getDaysLeft = (expiryDate) => {
  const today = normalizeDateOnly(new Date());
  const normalizedExpiryDate = normalizeDateOnly(expiryDate);
  return Math.floor((normalizedExpiryDate.getTime() - today.getTime()) / 86400000);
};

const deriveQualificationStatus = (expiryDate, currentStatus) => {
  if (currentStatus === QUALIFICATION_STATUSES.REVOKED) {
    return QUALIFICATION_STATUSES.REVOKED;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const normalizedExpiryDate = new Date(expiryDate);
  normalizedExpiryDate.setHours(0, 0, 0, 0);

  if (normalizedExpiryDate < today) {
    return QUALIFICATION_STATUSES.EXPIRED;
  }

  const expiringThreshold = new Date(today);
  expiringThreshold.setDate(expiringThreshold.getDate() + 60);

  if (normalizedExpiryDate <= expiringThreshold) {
    return QUALIFICATION_STATUSES.EXPIRING;
  }

  return QUALIFICATION_STATUSES.VALID;
};

const syncQualificationStatus = async (qualification) => {
  const nextStatus = deriveQualificationStatus(
    qualification.expiryDate,
    qualification.status
  );

  if (nextStatus === qualification.status) {
    return qualification;
  }

  return prisma.trainee_qualifications.update({
    where: { id: qualification.id },
    data: { status: nextStatus },
    include: qualification.qualification_renewals
      ? qualificationDetailInclude
      : qualificationInclude,
  });
};

const ensureTraineeExists = async (traineeId) => {
  const trainee = await prisma.trainees.findUnique({
    where: { id: traineeId },
  });

  if (!trainee) {
    throw new ServiceError("Trainee not found.", 404);
  }

  return trainee;
};

const ensureQualificationTypeExists = async (qualificationTypeId) => {
  const qualificationType = await prisma.qualification_types.findUnique({
    where: { id: qualificationTypeId },
  });

  if (!qualificationType) {
    throw new ServiceError("Qualification type not found.", 404);
  }

  return qualificationType;
};

const ensureQualificationExists = async (id) => {
  const qualification = await prisma.trainee_qualifications.findUnique({
    where: { id },
    include: qualificationDetailInclude,
  });

  if (!qualification) {
    throw new ServiceError("Trainee qualification not found.", 404);
  }

  return qualification;
};

const createTraineeQualification = async ({
  traineeId,
  qualificationTypeId,
  issuedDate,
  verified,
  certificateUrl,
}) => {
  if (!traineeId || !qualificationTypeId) {
    throw new ServiceError(
      "traineeId, qualificationTypeId, and issuedDate are required.",
      400
    );
  }

  const parsedIssuedDate = parseIssuedDate(issuedDate);

  await ensureTraineeExists(traineeId);
  const qualificationType = await ensureQualificationTypeExists(
    qualificationTypeId
  );

  const expiryDate = calculateExpiryDate(
    parsedIssuedDate,
    qualificationType.validityDays
  );
  const status = deriveQualificationStatus(expiryDate);
  const normalizedVerified = normalizeBoolean(verified);

  try {
    return await prisma.trainee_qualifications.create({
      data: {
        id: randomUUID(),
        traineeId,
        qualificationTypeId,
        issuedDate: parsedIssuedDate,
        expiryDate,
        status,
        verified: normalizedVerified ?? false,
        certificateUrl: certificateUrl ?? null,
      },
      include: qualificationDetailInclude,
    });
  } catch (error) {
    if (error.code === "P2002") {
      throw new ServiceError(
        "This trainee already has a qualification for the selected qualification type.",
        400
      );
    }

    throw error;
  }
};

const getAllTraineeQualifications = async ({ traineeId, status }) => {
  if (status && !Object.values(QUALIFICATION_STATUSES).includes(status)) {
    throw new ServiceError("Invalid status value.", 400);
  }

  const qualifications = await prisma.trainee_qualifications.findMany({
    where: {
      ...(traineeId ? { traineeId } : {}),
    },
    include: qualificationInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  const syncedQualifications = await Promise.all(
    qualifications.map(syncQualificationStatus)
  );

  if (!status) {
    return syncedQualifications;
  }

  return syncedQualifications.filter(
    (qualification) => qualification.status === status
  );
};

const getTraineeQualificationById = async (id) => {
  if (!id) {
    throw new ServiceError("Qualification id is required.", 400);
  }

  const qualification = await ensureQualificationExists(id);
  return syncQualificationStatus(qualification);
};

const updateTraineeQualification = async (
  id,
  {
    traineeId,
    qualificationTypeId,
    issuedDate,
    status,
    certificateUrl,
    verified,
  }
) => {
  if (!id) {
    throw new ServiceError("Qualification id is required.", 400);
  }

  const currentQualification = await ensureQualificationExists(id);

  const updateData = {};
  let shouldRecalculateExpiry = false;
  let nextQualificationTypeId = currentQualification.qualificationTypeId;
  let nextIssuedDate = currentQualification.issuedDate;

  if (traineeId !== undefined) {
    await ensureTraineeExists(traineeId);
    updateData.traineeId = traineeId;
  }

  if (qualificationTypeId !== undefined) {
    await ensureQualificationTypeExists(qualificationTypeId);
    updateData.qualificationTypeId = qualificationTypeId;
    nextQualificationTypeId = qualificationTypeId;
    shouldRecalculateExpiry = true;
  }

  if (issuedDate !== undefined) {
    nextIssuedDate = parseIssuedDate(issuedDate);
    updateData.issuedDate = nextIssuedDate;
    shouldRecalculateExpiry = true;
  }

  if (status !== undefined) {
    if (!Object.values(QUALIFICATION_STATUSES).includes(status)) {
      throw new ServiceError("Invalid status value.", 400);
    }

    if (status !== QUALIFICATION_STATUSES.REVOKED) {
      throw new ServiceError(
        "Status is derived by the backend. Only REVOKED can be set explicitly.",
        400
      );
    }

    updateData.status = status;
  }

  if (certificateUrl !== undefined) {
    if (certificateUrl !== null && typeof certificateUrl !== "string") {
      throw new ServiceError("certificateUrl must be a string or null.", 400);
    }

    updateData.certificateUrl = certificateUrl;
  }

  if (verified !== undefined) {
    const normalizedVerified = normalizeBoolean(verified);

    if (normalizedVerified === undefined) {
      throw new ServiceError("verified must be a boolean.", 400);
    }

    updateData.verified = normalizedVerified;
  }

  if (shouldRecalculateExpiry) {
    const qualificationType = await ensureQualificationTypeExists(
      nextQualificationTypeId
    );

    updateData.expiryDate = calculateExpiryDate(
      nextIssuedDate,
      qualificationType.validityDays
    );

    if (status === undefined || status !== QUALIFICATION_STATUSES.REVOKED) {
      updateData.status = deriveQualificationStatus(updateData.expiryDate, status);
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new ServiceError(
      "At least one field must be provided for update.",
      400
    );
  }

  try {
    return await prisma.trainee_qualifications.update({
      where: { id },
      data: updateData,
      include: qualificationDetailInclude,
    });
  } catch (error) {
    if (error.code === "P2002") {
      throw new ServiceError(
        "This trainee already has a qualification for the selected qualification type.",
        400
      );
    }

    throw error;
  }
};

const createQualificationRenewal = async ({
  traineeQualificationId,
  renewedOn,
  newExpiryDate,
  notes,
}) => {
  if (!traineeQualificationId || !renewedOn || !newExpiryDate) {
    throw new ServiceError(
      "traineeQualificationId, renewedOn, and newExpiryDate are required.",
      400
    );
  }

  const qualification = await ensureQualificationExists(traineeQualificationId);

  if (!isValidDate(renewedOn) || !isValidDate(newExpiryDate)) {
    throw new ServiceError("renewedOn and newExpiryDate must be valid dates.", 400);
  }

  const normalizedRenewedOn = normalizeDateOnly(renewedOn);
  const normalizedNewExpiryDate = normalizeDateOnly(newExpiryDate);
  const daysLeft = getDaysLeft(qualification.expiryDate);

  if (normalizedNewExpiryDate <= normalizeDateOnly(qualification.expiryDate)) {
    throw new ServiceError(
      "newExpiryDate must be later than the current expiry date.",
      400
    );
  }

  if (
    qualification.status === QUALIFICATION_STATUSES.VALID &&
    daysLeft > 60
  ) {
    throw new ServiceError(
      "Renewal is blocked while the qualification is valid and expires more than 60 days away.",
      400
    );
  }

  if (notes !== undefined && notes !== null) {
    if (typeof notes !== "string") {
      throw new ServiceError("notes must be a string.", 400);
    }

    if (notes.length > 500) {
      throw new ServiceError("notes must be 500 characters or fewer.", 400);
    }
  }

  return prisma.$transaction(async (tx) => {
    const renewal = await tx.qualification_renewals.create({
      data: {
        id: randomUUID(),
        traineeQualificationId,
        renewedOn: normalizedRenewedOn,
        newExpiryDate: normalizedNewExpiryDate,
        notes: notes ?? null,
      },
    });

    const updatedQualification = await tx.trainee_qualifications.update({
      where: { id: traineeQualificationId },
      data: {
        expiryDate: normalizedNewExpiryDate,
        status: deriveQualificationStatus(
          normalizedNewExpiryDate,
          qualification.status
        ),
      },
      include: qualificationDetailInclude,
    });

    return {
      ...renewal,
      trainee_qualifications: updatedQualification,
    };
  });
};

const deleteTraineeQualification = async (id) => {
  if (!id) {
    throw new ServiceError("Qualification id is required.", 400);
  }

  await ensureQualificationExists(id);

  await prisma.trainee_qualifications.delete({
    where: { id },
  });
};

module.exports = {
  QUALIFICATION_STATUSES,
  ServiceError,
  deriveQualificationStatus,
  createTraineeQualification,
  createQualificationRenewal,
  getAllTraineeQualifications,
  getTraineeQualificationById,
  updateTraineeQualification,
  deleteTraineeQualification,
};
