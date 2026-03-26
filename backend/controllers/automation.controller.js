const automationService = require("../services/automation.service");

const handleError = (res, error) => {
  const statusCode = error.statusCode || 500;
  const message =
    statusCode === 500 ? "Internal server error." : error.message;

  return res.status(statusCode).json({ message });
};

const previewMilestoneRenewal = async (req, res) => {
  try {
    const preview = await automationService.getMilestonePreview(req.body);
    return res.status(200).json(preview);
  } catch (error) {
    return handleError(res, error);
  }
};

const applyMilestoneRenewal = async (req, res) => {
  try {
    const qualifications = await automationService.applyMilestoneRenewal(req.body);
    return res.status(200).json(qualifications);
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  previewMilestoneRenewal,
  applyMilestoneRenewal,
};
