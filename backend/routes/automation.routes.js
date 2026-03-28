const express = require("express");
const automationController = require("../controllers/automation.controller");

const router = express.Router();

router.get(
  "/milestone-renewal/config",
  automationController.getMilestoneAutomationConfig
);
router.post(
  "/milestone-renewal/preview",
  automationController.previewMilestoneRenewal
);
router.post(
  "/milestone-renewal",
  automationController.applyMilestoneRenewal
);

module.exports = router;
