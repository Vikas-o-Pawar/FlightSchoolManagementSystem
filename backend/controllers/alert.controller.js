const alertService = require("../services/alert.service");

const handleError = (res, error) => {
  const statusCode = error.statusCode || 500;
  const message =
    statusCode === 500 ? "Internal server error." : error.message;

  return res.status(statusCode).json({ message });
};

const getAlerts = async (_req, res) => {
  try {
    const alerts = await alertService.getAlerts();
    return res.status(200).json(alerts);
  } catch (error) {
    return handleError(res, error);
  }
};

const runAlerts = async (_req, res) => {
  try {
    const createdAlerts = await alertService.generateAlerts();
    return res.status(200).json(createdAlerts);
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  getAlerts,
  runAlerts,
};
