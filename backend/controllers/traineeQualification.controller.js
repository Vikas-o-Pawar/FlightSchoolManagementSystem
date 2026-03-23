const traineeQualificationService = require("../services/traineeQualification.service");

const handleError = (res, error) => {
  const statusCode = error.statusCode || 500;
  const message =
    statusCode === 500 ? "Internal server error." : error.message;

  return res.status(statusCode).json({ message });
};

const createTraineeQualification = async (req, res) => {
  try {
    const qualification =
      await traineeQualificationService.createTraineeQualification(req.body);

    return res.status(201).json(qualification);
  } catch (error) {
    return handleError(res, error);
  }
};

const getAllTraineeQualifications = async (req, res) => {
  try {
    const qualifications =
      await traineeQualificationService.getAllTraineeQualifications(req.query);

    return res.status(200).json(qualifications);
  } catch (error) {
    return handleError(res, error);
  }
};

const getTraineeQualificationById = async (req, res) => {
  try {
    const qualification =
      await traineeQualificationService.getTraineeQualificationById(
        req.params.id
      );

    return res.status(200).json(qualification);
  } catch (error) {
    return handleError(res, error);
  }
};

const updateTraineeQualification = async (req, res) => {
  try {
    const qualification =
      await traineeQualificationService.updateTraineeQualification(
        req.params.id,
        req.body
      );

    return res.status(200).json(qualification);
  } catch (error) {
    return handleError(res, error);
  }
};

const deleteTraineeQualification = async (req, res) => {
  try {
    await traineeQualificationService.deleteTraineeQualification(req.params.id);
    return res.status(204).send();
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  createTraineeQualification,
  getAllTraineeQualifications,
  getTraineeQualificationById,
  updateTraineeQualification,
  deleteTraineeQualification,
};
