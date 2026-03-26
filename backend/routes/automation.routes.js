const express = require("express");
const automationController = require("../controllers/automation.controller");

const router = express.Router();

router.post(
  "/milestone-renewal/preview",
  automationController.previewMilestoneRenewal
);
router.post(
  "/milestone-renewal",
  automationController.applyMilestoneRenewal
);

module.exports = router;
