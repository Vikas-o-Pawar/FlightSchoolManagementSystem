const express = require("express");
const qualificationTypeController = require("../controllers/qualificationType.controller");

const router = express.Router();

router.get("/", qualificationTypeController.getAllQualificationTypes);
router.get("/:id", qualificationTypeController.getQualificationTypeById);
router.post("/", qualificationTypeController.createQualificationType);
router.patch("/:id", qualificationTypeController.updateQualificationType);
router.delete("/:id", qualificationTypeController.deleteQualificationType);

module.exports = router;
