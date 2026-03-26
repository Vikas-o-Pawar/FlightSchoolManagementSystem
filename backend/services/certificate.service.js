const { promises: fs } = require("fs");
const path = require("path");
const prisma = require("../prisma/client");
const { ServiceError } = require("./traineeQualification.service");

const CERTIFICATE_DIR = path.join(__dirname, "..", "generated-certificates");

const escapePdfText = (value) =>
  String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const buildPdfBuffer = ({ traineeName, qualificationName, issuedDate, expiryDate }) => {
  const lines = [
    { size: 24, text: "Qualification Certificate", x: 72, y: 720 },
    { size: 14, text: `Trainee: ${traineeName}`, x: 72, y: 660 },
    { size: 14, text: `Qualification: ${qualificationName}`, x: 72, y: 630 },
    { size: 14, text: `Issued Date: ${issuedDate}`, x: 72, y: 600 },
    { size: 14, text: `Expiry Date: ${expiryDate}`, x: 72, y: 570 },
  ];

  const streamBody = [
    "BT",
    ...lines.flatMap((line) => [
      `/F1 ${line.size} Tf`,
      `1 0 0 1 ${line.x} ${line.y} Tm`,
      `(${escapePdfText(line.text)}) Tj`,
    ]),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(streamBody, "utf8")} >>\nstream\n${streamBody}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
};

const toDateOnly = (value) => new Date(value).toISOString().split("T")[0];

const generateCertificate = async ({ traineeQualificationId }) => {
  if (!traineeQualificationId) {
    throw new ServiceError("traineeQualificationId is required.", 400);
  }

  const qualification = await prisma.trainee_qualifications.findUnique({
    where: { id: traineeQualificationId },
    include: {
      trainees: true,
      qualification_types: true,
    },
  });

  if (!qualification) {
    throw new ServiceError("Trainee qualification not found.", 404);
  }

  await fs.mkdir(CERTIFICATE_DIR, { recursive: true });

  const filename = `certificate-${qualification.id}.pdf`;
  const filePath = path.join(CERTIFICATE_DIR, filename);
  const pdfBuffer = buildPdfBuffer({
    traineeName: qualification.trainees?.name || "Unknown Trainee",
    qualificationName: qualification.qualification_types?.name || "Qualification",
    issuedDate: toDateOnly(qualification.issuedDate),
    expiryDate: toDateOnly(qualification.expiryDate),
  });

  await fs.writeFile(filePath, pdfBuffer);

  const certificateUrl = `/certificates/${filename}`;

  return prisma.trainee_qualifications.update({
    where: { id: traineeQualificationId },
    data: {
      certificateUrl,
    },
    include: {
      trainees: true,
      qualification_types: true,
      qualification_renewals: {
        orderBy: {
          renewedOn: "desc",
        },
      },
    },
  });
};

const getCertificateFile = async (traineeQualificationId) => {
  if (!traineeQualificationId) {
    throw new ServiceError("Certificate id is required.", 400);
  }

  const qualification = await prisma.trainee_qualifications.findUnique({
    where: { id: traineeQualificationId },
  });

  if (!qualification || !qualification.certificateUrl) {
    throw new ServiceError("Certificate not found.", 404);
  }

  const filename = path.basename(qualification.certificateUrl);
  const filePath = path.join(CERTIFICATE_DIR, filename);

  try {
    await fs.access(filePath);
  } catch (_error) {
    throw new ServiceError("Certificate file not found on disk.", 404);
  }

  return {
    filePath,
    filename,
  };
};

module.exports = {
  generateCertificate,
  getCertificateFile,
};
