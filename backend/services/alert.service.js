const { randomUUID } = require("crypto");
const prisma = require("../prisma/client");

const ALERT_SEVERITY = {
  DAYS_30: "urgent",
  DAYS_60: "expiring_soon",
  DAYS_90: "expiring_soon",
};

const normalizeDateOnly = (value) => {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const getDaysLeft = (expiryDate) => {
  const today = normalizeDateOnly(new Date());
  const normalizedExpiryDate = normalizeDateOnly(expiryDate);
  return Math.floor((normalizedExpiryDate.getTime() - today.getTime()) / 86400000);
};

const getAlertType = (daysLeft) => {
  if (daysLeft < 0) {
    return null;
  }

  if (daysLeft <= 30) {
    return "DAYS_30";
  }

  if (daysLeft <= 60) {
    return "DAYS_60";
  }

  if (daysLeft <= 90) {
    return "DAYS_90";
  }

  return null;
};

const generateAlerts = async () => {
  const qualifications = await prisma.trainee_qualifications.findMany({
    include: {
      trainees: true,
      qualification_types: true,
      qualification_alerts: true,
      qualification_renewals: {
        orderBy: {
          renewedOn: "desc",
        },
      },
    },
  });

  const createdAlerts = [];

  for (const qualification of qualifications) {
    const daysLeft = getDaysLeft(qualification.expiryDate);
    const alertType = getAlertType(daysLeft);
    const latestRenewal = qualification.qualification_renewals[0];
    const cycleStartDate = latestRenewal
      ? latestRenewal.renewedOn
      : qualification.createdAt;

    if (!alertType) {
      continue;
    }

    const alreadyExists = qualification.qualification_alerts.some(
      (alert) =>
        alert.alertType === alertType &&
        new Date(alert.createdAt).getTime() >= new Date(cycleStartDate).getTime()
    );

    if (alreadyExists) {
      continue;
    }

    const alert = await prisma.qualification_alerts.create({
      data: {
        id: randomUUID(),
        traineeQualificationId: qualification.id,
        alertType,
      },
      include: {
        trainee_qualifications: {
          include: {
            trainees: true,
            qualification_types: true,
          },
        },
      },
    });

    createdAlerts.push(alert);
  }

  return createdAlerts;
};

const getAlerts = async () => {
  await generateAlerts();

  const alerts = await prisma.qualification_alerts.findMany({
    include: {
      trainee_qualifications: {
        include: {
          trainees: true,
          qualification_types: true,
          qualification_renewals: {
            orderBy: {
              renewedOn: "desc",
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return alerts
    .filter((alert) => {
      const latestRenewal =
        alert.trainee_qualifications.qualification_renewals?.[0] || null;
      const cycleStartDate = latestRenewal
        ? latestRenewal.renewedOn
        : alert.trainee_qualifications.createdAt;

      return (
        new Date(alert.createdAt).getTime() >= new Date(cycleStartDate).getTime()
      );
    })
    .map((alert) => ({
      id: alert.id,
      alertType: alert.alertType,
      expiry: alert.trainee_qualifications.expiryDate,
      traineeQualificationId: alert.traineeQualificationId,
      trainee: {
        id: alert.trainee_qualifications.trainees?.id || null,
        name: alert.trainee_qualifications.trainees?.name || "-",
        code: alert.trainee_qualifications.trainees?.traineeId || "-",
      },
      qualification: {
        id: alert.trainee_qualifications.qualification_types?.id || null,
        name: alert.trainee_qualifications.qualification_types?.name || "-",
      },
      severity: ALERT_SEVERITY[alert.alertType] || "expiring_soon",
      isSent: alert.isSent,
      sentAt: alert.sentAt,
      createdAt: alert.createdAt,
    }));
};

module.exports = {
  generateAlerts,
  getAlerts,
};
