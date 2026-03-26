const express = require("express");
const alertController = require("../controllers/alert.controller");

const router = express.Router();

router.get("/", alertController.getAlerts);
router.post("/run", alertController.runAlerts);

module.exports = router;
