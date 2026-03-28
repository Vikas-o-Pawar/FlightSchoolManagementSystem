const assert = require("node:assert/strict");
const path = require("node:path");

function clearModule(modulePath) {
  delete require.cache[modulePath];
}

function loadTraineeQualificationService(mockPrisma) {
  const prismaModulePath = path.resolve(__dirname, "../prisma/client.js");
  const serviceModulePath = path.resolve(
    __dirname,
    "../services/traineeQualification.service.js"
  );

  clearModule(prismaModulePath);
  clearModule(serviceModulePath);

  require.cache[prismaModulePath] = {
    id: prismaModulePath,
    filename: prismaModulePath,
    loaded: true,
    exports: mockPrisma,
  };

  return require(serviceModulePath);
}

function loadAutomationService(mockPrisma, mockTraineeQualificationService) {
  const prismaModulePath = path.resolve(__dirname, "../prisma/client.js");
  const traineeQualificationServicePath = path.resolve(
    __dirname,
    "../services/traineeQualification.service.js"
  );
  const serviceModulePath = path.resolve(
    __dirname,
    "../services/automation.service.js"
  );

  clearModule(prismaModulePath);
  clearModule(traineeQualificationServicePath);
  clearModule(serviceModulePath);

  require.cache[prismaModulePath] = {
    id: prismaModulePath,
    filename: prismaModulePath,
    loaded: true,
    exports: mockPrisma,
  };

  require.cache[traineeQualificationServicePath] = {
    id: traineeQualificationServicePath,
    filename: traineeQualificationServicePath,
    loaded: true,
    exports: mockTraineeQualificationService,
  };

  return require(serviceModulePath);
}

function createAutomationDependencies({
  trainee,
  sessions = [],
  flightHours = null,
  qualifications = [],
  createRenewalImpl,
}) {
  return {
    prisma: {
      trainees: {
        findUnique: async () => trainee,
      },
      sessions: {
        findMany: async () => sessions,
      },
      flight_hours: {
        findUnique: async () => flightHours,
      },
      trainee_qualifications: {
        findMany: async () => qualifications,
      },
    },
    traineeQualificationService: {
      ServiceError: class ServiceError extends Error {
        constructor(message, statusCode) {
          super(message);
          this.statusCode = statusCode;
        }
      },
      QUALIFICATION_STATUSES: {
        VALID: "VALID",
        EXPIRING: "EXPIRING",
        EXPIRED: "EXPIRED",
        REVOKED: "REVOKED",
      },
      createQualificationRenewal: createRenewalImpl,
    },
  };
}

function createQualification({
  id,
  traineeId = "trainee-1",
  name,
  validityDays = 365,
  expiryDate,
  status,
  renewals = [],
}) {
  return {
    id,
    traineeId,
    qualificationTypeId: `type-${id}`,
    expiryDate: new Date(expiryDate),
    status,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    qualification_types: {
      id: `type-${id}`,
      name,
      validityDays,
    },
    qualification_renewals: renewals,
  };
}

async function testMilestoneConfigIsEnabled() {
  const { prisma, traineeQualificationService } = createAutomationDependencies({
    createRenewalImpl: async () => {
      throw new Error("not used");
    },
  });

  const automationService = loadAutomationService(
    prisma,
    traineeQualificationService
  );
  const config = automationService.getMilestoneAutomationConfig();

  assert.equal(config.enabled, true);
  assert.ok(config.rules.length >= 3);
  assert.equal(config.rules.some((rule) => rule.type === "TRAINING_COMPLETED"), true);
  assert.equal(config.rules.some((rule) => rule.type === "SESSION_PASSED"), true);
  assert.equal(
    config.rules.some((rule) => rule.type === "FLIGHT_HOURS_TARGET_REACHED"),
    true
  );
}

async function testMilestoneMatchesOneQualification() {
  const qualification = createQualification({
    id: "qual-ir",
    name: "IR Rating",
    expiryDate: "2026-04-10T00:00:00.000Z",
    status: "EXPIRING",
  });

  const { prisma, traineeQualificationService } = createAutomationDependencies({
    sessions: [
      {
        id: "session-1",
        traineeId: "trainee-1",
        date: new Date("2026-03-20T00:00:00.000Z"),
        grade: 88,
      },
    ],
    qualifications: [qualification],
    createRenewalImpl: async ({ traineeQualificationId, notes, newExpiryDate }) => ({
      trainee_qualifications: {
        id: traineeQualificationId,
        expiryDate: newExpiryDate,
        status: "VALID",
      },
      notes,
    }),
  });

  const automationService = loadAutomationService(
    prisma,
    traineeQualificationService
  );

  const preview = await automationService.getMilestonePreview({
    traineeId: "trainee-1",
    milestoneType: "SESSION_PASSED",
  });

  assert.equal(preview.length, 1);
  assert.equal(preview[0].eligible, true);
  assert.equal(preview[0].qualification.id, "qual-ir");
  assert.match(preview[0].evidence.sourceKey, /session-1/);
}

async function testMilestoneMatchesMultipleQualifications() {
  const qualifications = [
    createQualification({
      id: "qual-ir",
      name: "IR Rating",
      expiryDate: "2026-04-10T00:00:00.000Z",
      status: "EXPIRING",
    }),
    createQualification({
      id: "qual-a320",
      name: "Type Rating A320",
      expiryDate: "2026-04-05T00:00:00.000Z",
      status: "EXPIRING",
    }),
  ];

  const renewalCalls = [];

  const { prisma, traineeQualificationService } = createAutomationDependencies({
    sessions: [
      {
        id: "session-9",
        traineeId: "trainee-1",
        date: new Date("2026-03-21T00:00:00.000Z"),
        grade: 91,
      },
    ],
    qualifications,
    createRenewalImpl: async (payload) => {
      renewalCalls.push(payload);
      return {
        trainee_qualifications: {
          id: payload.traineeQualificationId,
          expiryDate: payload.newExpiryDate,
          status: "VALID",
        },
      };
    },
  });

  const automationService = loadAutomationService(
    prisma,
    traineeQualificationService
  );

  const renewed = await automationService.applyMilestoneRenewal({
    traineeId: "trainee-1",
    milestoneType: "SESSION_PASSED",
  });

  assert.equal(renewed.length, 2);
  assert.equal(renewalCalls.length, 2);
  assert.equal(
    renewalCalls.every((call) => call.notes.startsWith("Milestone: Session Passed")),
    true
  );
}

async function testMilestoneNoMatchesReturnsEmptyPreview() {
  const { prisma, traineeQualificationService } = createAutomationDependencies({
    trainee: {
      id: "trainee-1",
      status: "ACTIVE",
      updatedAt: new Date("2026-03-28T00:00:00.000Z"),
    },
    qualifications: [
      createQualification({
        id: "qual-night",
        name: "Night Rating",
        expiryDate: "2026-05-10T00:00:00.000Z",
        status: "EXPIRING",
      }),
    ],
    createRenewalImpl: async () => {
      throw new Error("not used");
    },
  });

  const automationService = loadAutomationService(
    prisma,
    traineeQualificationService
  );

  const preview = await automationService.getMilestonePreview({
    traineeId: "trainee-1",
    milestoneType: "TRAINING_COMPLETED",
  });

  assert.equal(preview.length, 0);
}

async function testMatchingQualificationWithoutMilestoneEvidenceUsesManualOverride() {
  const { prisma, traineeQualificationService } = createAutomationDependencies({
    qualifications: [
      createQualification({
        id: "qual-cpl",
        name: "CPL",
        expiryDate: "2026-04-27T00:00:00.000Z",
        status: "EXPIRING",
      }),
    ],
    flightHours: null,
    createRenewalImpl: async () => {
      throw new Error("not used");
    },
  });

  const automationService = loadAutomationService(
    prisma,
    traineeQualificationService
  );

  const preview = await automationService.getMilestonePreview({
    traineeId: "trainee-1",
    milestoneType: "FLIGHT_HOURS_TARGET_REACHED",
  });

  assert.equal(preview.length, 1);
  assert.equal(preview[0].qualification.qualification_types.name, "CPL");
  assert.equal(preview[0].eligible, true);
  assert.match(preview[0].reason, /manual milestone selection is being used as a temporary override/i);
  assert.match(preview[0].evidence.sourceKey, /manual-trigger:FLIGHT_HOURS_TARGET_REACHED/);
}

async function testRepeatedMilestoneDoesNotDoubleRenew() {
  const qualification = createQualification({
    id: "qual-ir",
    name: "IR Rating",
    expiryDate: "2026-04-10T00:00:00.000Z",
    status: "EXPIRING",
    renewals: [
      {
        id: "renewal-1",
        notes: "Milestone: Session Passed [source=sessions:session-1:grade:80]",
      },
    ],
  });

  const renewalCalls = [];

  const { prisma, traineeQualificationService } = createAutomationDependencies({
    sessions: [
      {
        id: "session-1",
        traineeId: "trainee-1",
        date: new Date("2026-03-20T00:00:00.000Z"),
        grade: 88,
      },
    ],
    qualifications: [qualification],
    createRenewalImpl: async (payload) => {
      renewalCalls.push(payload);
      return {
        trainee_qualifications: {
          id: payload.traineeQualificationId,
          expiryDate: payload.newExpiryDate,
          status: "VALID",
        },
      };
    },
  });

  const automationService = loadAutomationService(
    prisma,
    traineeQualificationService
  );

  const preview = await automationService.getMilestonePreview({
    traineeId: "trainee-1",
    milestoneType: "SESSION_PASSED",
  });
  const renewed = await automationService.applyMilestoneRenewal({
    traineeId: "trainee-1",
    milestoneType: "SESSION_PASSED",
  });

  assert.equal(preview.length, 1);
  assert.equal(preview[0].eligible, false);
  assert.match(preview[0].reason, /already renewed by the same milestone source/i);
  assert.equal(renewed.length, 0);
  assert.equal(renewalCalls.length, 0);
}

async function testManualRenewalStillWorks() {
  const currentExpiry = new Date("2026-03-20T00:00:00.000Z");
  const newExpiry = new Date("2026-09-20T00:00:00.000Z");

  let renewalCreatePayload = null;
  let qualificationUpdatePayload = null;

  const mockPrisma = {
    trainee_qualifications: {
      findUnique: async () => ({
        id: "qual-1",
        traineeId: "trainee-1",
        qualificationTypeId: "type-1",
        issuedDate: new Date("2025-09-20T00:00:00.000Z"),
        expiryDate: currentExpiry,
        status: "EXPIRING",
        qualification_renewals: [],
      }),
      update: async ({ data }) => {
        qualificationUpdatePayload = data;
        return {
          id: "qual-1",
          expiryDate: data.expiryDate,
          status: data.status,
          qualification_renewals: [],
        };
      },
    },
    $transaction: async (callback) =>
      callback({
        qualification_renewals: {
          create: async ({ data }) => {
            renewalCreatePayload = data;
            return data;
          },
        },
        trainee_qualifications: {
          update: async ({ data }) => {
            qualificationUpdatePayload = data;
            return {
              id: "qual-1",
              expiryDate: data.expiryDate,
              status: data.status,
              qualification_renewals: [],
            };
          },
        },
      }),
  };

  const service = loadTraineeQualificationService(mockPrisma);

  const result = await service.createQualificationRenewal({
    traineeQualificationId: "qual-1",
    renewedOn: "2026-03-28",
    newExpiryDate: "2026-09-20",
    notes: "Manual renewal",
  });

  assert.equal(renewalCreatePayload.traineeQualificationId, "qual-1");
  assert.equal(renewalCreatePayload.notes, "Manual renewal");
  assert.equal(
    renewalCreatePayload.newExpiryDate.toISOString(),
    newExpiry.toISOString()
  );
  assert.equal(
    qualificationUpdatePayload.expiryDate.toISOString(),
    newExpiry.toISOString()
  );
  assert.equal(qualificationUpdatePayload.status, "VALID");
  assert.equal(result.trainee_qualifications.status, "VALID");
}

async function testAlertsOnlyShowCurrentThresholdForCycle() {
  const prismaModulePath = path.resolve(__dirname, "../prisma/client.js");
  const alertServiceModulePath = path.resolve(
    __dirname,
    "../services/alert.service.js"
  );

  clearModule(prismaModulePath);
  clearModule(alertServiceModulePath);

  const qualification = {
    id: "qual-cpl",
    traineeId: "trainee-1",
    qualificationTypeId: "type-cpl",
    expiryDate: new Date("2026-04-27T00:00:00.000Z"),
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    trainees: {
      id: "trainee-1",
      name: "Arjum Mehta",
      traineeId: "TR001",
    },
    qualification_types: {
      id: "type-cpl",
      name: "CPL",
    },
    qualification_renewals: [],
  };

  const mockPrisma = {
    trainee_qualifications: {
      findMany: async () => [
        {
          ...qualification,
          qualification_alerts: [
            {
              id: "a-90",
              alertType: "DAYS_90",
              createdAt: new Date("2026-01-27T00:00:00.000Z"),
            },
            {
              id: "a-60",
              alertType: "DAYS_60",
              createdAt: new Date("2026-02-26T00:00:00.000Z"),
            },
          ],
        },
      ],
    },
    qualification_alerts: {
      create: async ({ data }) => ({
        id: "a-30",
        traineeQualificationId: data.traineeQualificationId,
        alertType: data.alertType,
        isSent: false,
        sentAt: null,
        createdAt: new Date("2026-03-28T00:00:00.000Z"),
        trainee_qualifications: qualification,
      }),
      findMany: async () => [
        {
          id: "a-30",
          traineeQualificationId: "qual-cpl",
          alertType: "DAYS_30",
          isSent: false,
          sentAt: null,
          createdAt: new Date("2026-03-28T00:00:00.000Z"),
          trainee_qualifications: qualification,
        },
        {
          id: "a-60",
          traineeQualificationId: "qual-cpl",
          alertType: "DAYS_60",
          isSent: false,
          sentAt: null,
          createdAt: new Date("2026-02-26T00:00:00.000Z"),
          trainee_qualifications: qualification,
        },
        {
          id: "a-90",
          traineeQualificationId: "qual-cpl",
          alertType: "DAYS_90",
          isSent: false,
          sentAt: null,
          createdAt: new Date("2026-01-27T00:00:00.000Z"),
          trainee_qualifications: qualification,
        },
      ],
    },
  };

  require.cache[prismaModulePath] = {
    id: prismaModulePath,
    filename: prismaModulePath,
    loaded: true,
    exports: mockPrisma,
  };

  const alertService = require(alertServiceModulePath);
  const alerts = await alertService.getAlerts();

  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].trainee.name, "Arjum Mehta");
  assert.equal(alerts[0].qualification.name, "CPL");
  assert.equal(alerts[0].alertType, "DAYS_30");
}

async function testRenewalClearsEarlierSameDayAlerts() {
  const prismaModulePath = path.resolve(__dirname, "../prisma/client.js");
  const alertServiceModulePath = path.resolve(
    __dirname,
    "../services/alert.service.js"
  );

  clearModule(prismaModulePath);
  clearModule(alertServiceModulePath);

  const qualification = {
    id: "qual-cpl",
    traineeId: "trainee-1",
    qualificationTypeId: "type-cpl",
    expiryDate: new Date("2027-03-28T00:00:00.000Z"),
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    trainees: {
      id: "trainee-1",
      name: "Arjun Mehta",
      traineeId: "TR002",
    },
    qualification_types: {
      id: "type-cpl",
      name: "CPL",
    },
    qualification_renewals: [
      {
        id: "renewal-1",
        renewedOn: new Date("2026-03-28T00:00:00.000Z"),
        createdAt: new Date("2026-03-28T18:37:55.781Z"),
      },
    ],
  };

  const mockPrisma = {
    trainee_qualifications: {
      findMany: async () => [],
    },
    qualification_alerts: {
      findMany: async () => [
        {
          id: "a-60",
          traineeQualificationId: "qual-cpl",
          alertType: "DAYS_60",
          isSent: false,
          sentAt: null,
          createdAt: new Date("2026-03-28T18:09:06.341Z"),
          trainee_qualifications: qualification,
        },
        {
          id: "a-90",
          traineeQualificationId: "qual-cpl",
          alertType: "DAYS_90",
          isSent: false,
          sentAt: null,
          createdAt: new Date("2026-03-28T18:08:56.206Z"),
          trainee_qualifications: qualification,
        },
      ],
    },
  };

  require.cache[prismaModulePath] = {
    id: prismaModulePath,
    filename: prismaModulePath,
    loaded: true,
    exports: mockPrisma,
  };

  const alertService = require(alertServiceModulePath);
  const alerts = await alertService.getAlerts();

  assert.equal(alerts.length, 0);
}

async function run() {
  const tests = [
    ["milestone config is enabled", testMilestoneConfigIsEnabled],
    ["milestone matches one qualification", testMilestoneMatchesOneQualification],
    ["milestone matches multiple qualifications", testMilestoneMatchesMultipleQualifications],
    ["milestone no match returns empty preview", testMilestoneNoMatchesReturnsEmptyPreview],
    ["matching qualification without milestone evidence uses manual override", testMatchingQualificationWithoutMilestoneEvidenceUsesManualOverride],
    ["repeated milestone does not double renew", testRepeatedMilestoneDoesNotDoubleRenew],
    ["manual renewal still works", testManualRenewalStillWorks],
    ["alerts show only current threshold per cycle", testAlertsOnlyShowCurrentThresholdForCycle],
    ["renewal clears earlier same-day alerts", testRenewalClearsEarlierSameDayAlerts],
  ];

  for (const [name, fn] of tests) {
    await fn();
    console.log(`PASS ${name}`);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
