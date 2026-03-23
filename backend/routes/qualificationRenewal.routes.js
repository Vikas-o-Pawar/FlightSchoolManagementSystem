const express = require("express");
const qualificationRenewalController = require("../controllers/qualificationRenewal.controller");

const router = express.Router();

router.post("/", qualificationRenewalController.createQualificationRenewal);

module.exports = router;
