const express = require("express");
const certificateController = require("../controllers/certificate.controller");

const router = express.Router();

router.post("/generate", certificateController.generateCertificate);
router.get("/:id", certificateController.downloadCertificate);

module.exports = router;
