const resourceService = require("../services/resource.service");

const handleError = (res, error) => {
  const statusCode = error.statusCode || 500;
  const message =
    statusCode === 500 ? "Internal server error." : error.message;

  return res.status(statusCode).json({ message });
};

const getResourceDashboard = async (_req, res) => {
  try {
    const resources = await resourceService.getResourceDashboard();
    return res.status(200).json(resources);
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  getResourceDashboard,
};
