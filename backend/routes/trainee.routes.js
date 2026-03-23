const express = require("express");
const traineeController = require("../controllers/trainee.controller");

const router = express.Router();

router.get("/", traineeController.getAllTrainees);

module.exports = router;
