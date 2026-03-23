const traineeService = require("../services/trainee.service");

const getAllTrainees = async (_req, res) => {
  try {
    const trainees = await traineeService.getAllTrainees();
    return res.status(200).json(trainees);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  getAllTrainees,
};
