const express = require("express");
const traineeQualificationController = require("../controllers/traineeQualification.controller");

const router = express.Router();

router.post(
  "/",
  traineeQualificationController.createTraineeQualification
);
router.get("/", traineeQualificationController.getAllTraineeQualifications);
router.get("/:id", traineeQualificationController.getTraineeQualificationById);
router.patch("/:id", traineeQualificationController.updateTraineeQualification);
router.delete(
  "/:id",
  traineeQualificationController.deleteTraineeQualification
);

module.exports = router;
