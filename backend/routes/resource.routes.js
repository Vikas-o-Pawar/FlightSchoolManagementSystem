const express = require("express");
const resourceController = require("../controllers/resource.controller");

const router = express.Router();

router.get("/dashboard", resourceController.getResourceDashboard);

module.exports = router;
