const traineeQualificationService = require("../services/traineeQualification.service");

const handleError = (res, error) => {
  const statusCode = error.statusCode || 500;
  const message =
    statusCode === 500 ? "Internal server error." : error.message;

  return res.status(statusCode).json({ message });
};

const createQualificationRenewal = async (req, res) => {
  try {
    const renewal = await traineeQualificationService.createQualificationRenewal(
      req.body
    );

    return res.status(201).json(renewal);
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  createQualificationRenewal,
};
