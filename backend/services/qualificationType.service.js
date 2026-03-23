const { randomUUID } = require("crypto");
const prisma = require("../../src/prisma/client");
const { ServiceError } = require("./traineeQualification.service");

const validateQualificationTypePayload = ({
  name,
  description,
  validityDays,
  partial = false,
}) => {
  const data = {};

  if (!partial || name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      throw new ServiceError("name is required.", 400);
    }

    data.name = name.trim();
  }

  if (description !== undefined) {
    if (description !== null && typeof description !== "string") {
      throw new ServiceError("description must be a string or null.", 400);
    }

    data.description = description;
  }

  if (!partial || validityDays !== undefined) {
    const parsedValidityDays = Number(validityDays);

    if (!Number.isInteger(parsedValidityDays) || parsedValidityDays < 0) {
      throw new ServiceError(
        "validityDays must be a non-negative integer.",
        400
      );
    }

    data.validityDays = parsedValidityDays;
  }

  return data;
};

const ensureQualificationTypeExists = async (id) => {
  const qualificationType = await prisma.qualification_types.findUnique({
    where: { id },
  });

  if (!qualificationType) {
    throw new ServiceError("Qualification type not found.", 404);
  }

  return qualificationType;
};

const createQualificationType = async (payload) => {
  const data = validateQualificationTypePayload(payload);

  return prisma.qualification_types.create({
    data: {
      id: randomUUID(),
      ...data,
    },
  });
};

const getAllQualificationTypes = async () => {
  return prisma.qualification_types.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getQualificationTypeById = async (id) => {
  if (!id) {
    throw new ServiceError("Qualification type id is required.", 400);
  }

  return ensureQualificationTypeExists(id);
};

const updateQualificationType = async (id, payload) => {
  if (!id) {
    throw new ServiceError("Qualification type id is required.", 400);
  }

  await ensureQualificationTypeExists(id);

  const data = validateQualificationTypePayload({
    ...payload,
    partial: true,
  });

  if (Object.keys(data).length === 0) {
    throw new ServiceError(
      "At least one field must be provided for update.",
      400
    );
  }

  return prisma.qualification_types.update({
    where: { id },
    data,
  });
};

const deleteQualificationType = async (id) => {
  if (!id) {
    throw new ServiceError("Qualification type id is required.", 400);
  }

  await ensureQualificationTypeExists(id);

  try {
    await prisma.qualification_types.delete({
      where: { id },
    });
  } catch (error) {
    if (error.code === "P2003") {
      throw new ServiceError(
        "Qualification type cannot be deleted because it is currently in use.",
        400
      );
    }

    throw error;
  }
};

module.exports = {
  createQualificationType,
  getAllQualificationTypes,
  getQualificationTypeById,
  updateQualificationType,
  deleteQualificationType,
};
