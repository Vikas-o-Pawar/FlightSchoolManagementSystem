const certificateService = require("../services/certificate.service");

const handleError = (res, error) => {
  const statusCode = error.statusCode || 500;
  const message =
    statusCode === 500 ? "Internal server error." : error.message;

  return res.status(statusCode).json({ message });
};

const generateCertificate = async (req, res) => {
  try {
    const qualification = await certificateService.generateCertificate(req.body);
    return res.status(200).json(qualification);
  } catch (error) {
    return handleError(res, error);
  }
};

const downloadCertificate = async (req, res) => {
  try {
    const certificate = await certificateService.getCertificateFile(req.params.id);
    return res.download(certificate.filePath, certificate.filename);
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  generateCertificate,
  downloadCertificate,
};
