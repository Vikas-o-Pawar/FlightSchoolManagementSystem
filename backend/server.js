const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const path = require("path");
const traineeQualificationRoutes = require("./routes/traineeQualification.routes");
const qualificationTypeRoutes = require("./routes/qualificationsType.routes");
const qualificationRenewalRoutes = require("./routes/qualificationRenewal.routes");
const traineeRoutes = require("./routes/trainee.routes");
const automationRoutes = require("./routes/automation.routes");
const alertRoutes = require("./routes/alert.routes");
const resourceRoutes = require("./routes/resource.routes");
const certificateRoutes = require("./routes/certificate.routes");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
app.use(
  "/certificates",
  express.static(path.join(__dirname, "generated-certificates"))
);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/trainee-qualifications", traineeQualificationRoutes);
app.use("/api/qualification-types", qualificationTypeRoutes);
app.use("/api/qualification-renewals", qualificationRenewalRoutes);
app.use("/api/trainees", traineeRoutes);
app.use("/api/automation", automationRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/certificates", certificateRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Internal server error." });
});

app.listen(PORT);
