const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const traineeQualificationRoutes = require("./routes/traineeQualification.routes");
const qualificationTypeRoutes = require("./routes/qualificationsType.routes");
const qualificationRenewalRoutes = require("./routes/qualificationRenewal.routes");
const traineeRoutes = require("./routes/trainee.routes");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/trainee-qualifications", traineeQualificationRoutes);
app.use("/api/qualification-types", qualificationTypeRoutes);
app.use("/api/qualification-renewals", qualificationRenewalRoutes);
app.use("/api/trainees", traineeRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`Qualification API running on port ${PORT}`);
});
