const qualificationTypeService = require("../services/qualificationType.service");

const handleError = (res, error) => {
  const statusCode = error.statusCode || 500;
  const message =
    statusCode === 500 ? "Internal server error." : error.message;

  return res.status(statusCode).json({ message });
};

const createQualificationType = async (req, res) => {
  try {
    const qualificationType =
      await qualificationTypeService.createQualificationType(req.body);

    return res.status(201).json(qualificationType);
  } catch (error) {
    return handleError(res, error);
  }
};

const getAllQualificationTypes = async (_req, res) => {
  try {
    const qualificationTypes =
      await qualificationTypeService.getAllQualificationTypes();

    return res.status(200).json(qualificationTypes);
  } catch (error) {
    return handleError(res, error);
  }
};

const getQualificationTypeById = async (req, res) => {
  try {
    const qualificationType =
      await qualificationTypeService.getQualificationTypeById(req.params.id);

    return res.status(200).json(qualificationType);
  } catch (error) {
    return handleError(res, error);
  }
};

const updateQualificationType = async (req, res) => {
  try {
    const qualificationType =
      await qualificationTypeService.updateQualificationType(
        req.params.id,
        req.body
      );

    return res.status(200).json(qualificationType);
  } catch (error) {
    return handleError(res, error);
  }
};

const deleteQualificationType = async (req, res) => {
  try {
    await qualificationTypeService.deleteQualificationType(req.params.id);
    return res.status(204).send();
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  createQualificationType,
  getAllQualificationTypes,
  getQualificationTypeById,
  updateQualificationType,
  deleteQualificationType,
};
