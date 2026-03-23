CREATE TABLE `trainees` (
  `id` VARCHAR(191) PRIMARY KEY NOT NULL,
  `traineeId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191),
  `dob` DATETIME(3),
  `enrollmentDate` DATETIME(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
  `course` VARCHAR(191) NOT NULL,
  `licenseType` VARCHAR(191),
  `status` ENUM ('ACTIVE', 'ON_HOLD', 'COMPLETED', 'DROPPED') NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
  `updatedAt` DATETIME(3) NOT NULL
);

CREATE TABLE `sessions` (
  `id` VARCHAR(191) PRIMARY KEY NOT NULL,
  `traineeId` VARCHAR(191) NOT NULL,
  `date` DATETIME(3) NOT NULL,
  `instructor` VARCHAR(191) NOT NULL,
  `aircraft` VARCHAR(191),
  `grade` INTEGER NOT NULL,
  `notes` TEXT,
  `createdAt` DATETIME(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3))
);

CREATE TABLE `competencies` (
  `id` VARCHAR(191) PRIMARY KEY NOT NULL,
  `traineeId` VARCHAR(191) NOT NULL,
  `navigation` INTEGER NOT NULL DEFAULT 0,
  `communication` INTEGER NOT NULL DEFAULT 0,
  `procedures` INTEGER NOT NULL DEFAULT 0,
  `airmanship` INTEGER NOT NULL DEFAULT 0,
  `emergencies` INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE `flight_hours` (
  `id` VARCHAR(191) PRIMARY KEY NOT NULL,
  `traineeId` VARCHAR(191) NOT NULL,
  `totalHours` DOUBLE NOT NULL DEFAULT 0,
  `simulatorHours` DOUBLE NOT NULL DEFAULT 0,
  `aircraftHours` DOUBLE NOT NULL DEFAULT 0,
  `targetHours` DOUBLE NOT NULL DEFAULT 200
);

CREATE TABLE `qualification_types` (
  `id` VARCHAR(191) PRIMARY KEY NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT,
  `validityDays` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3))
);

CREATE TABLE `trainee_qualifications` (
  `id` VARCHAR(191) PRIMARY KEY NOT NULL,
  `traineeId` VARCHAR(191) NOT NULL,
  `qualificationTypeId` VARCHAR(191) NOT NULL,
  `issuedDate` DATETIME(3) NOT NULL,
  `expiryDate` DATETIME(3) NOT NULL,
  `status` ENUM ('VALID', 'EXPIRING', 'EXPIRED', 'REVOKED') NOT NULL,
  `certificateUrl` TEXT,
  `verified` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3))
);

CREATE TABLE `qualification_renewals` (
  `id` VARCHAR(191) PRIMARY KEY NOT NULL,
  `traineeQualificationId` VARCHAR(191) NOT NULL,
  `renewedOn` DATETIME(3) NOT NULL,
  `newExpiryDate` DATETIME(3) NOT NULL,
  `notes` TEXT,
  `createdAt` DATETIME(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3))
);

CREATE TABLE `qualification_alerts` (
  `id` VARCHAR(191) PRIMARY KEY NOT NULL,
  `traineeQualificationId` VARCHAR(191) NOT NULL,
  `alertType` ENUM ('30_DAYS', '60_DAYS', '90_DAYS'),
  `isSent` BOOLEAN NOT NULL DEFAULT false,
  `sentAt` DATETIME(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3))
);

CREATE TABLE `resources` (
  `id` VARCHAR(191) PRIMARY KEY NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `type` ENUM ('AIRCRAFT', 'SIMULATOR') NOT NULL,
  `status` VARCHAR(50),
  `createdAt` DATETIME(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3))
);

CREATE TABLE `resource_qualifications` (
  `id` VARCHAR(191) PRIMARY KEY NOT NULL,
  `resourceId` VARCHAR(191) NOT NULL,
  `qualificationTypeId` VARCHAR(191) NOT NULL
);

CREATE UNIQUE INDEX `trainees_traineeId_key` ON `trainees` (`traineeId`);

CREATE UNIQUE INDEX `trainees_email_key` ON `trainees` (`email`);

CREATE UNIQUE INDEX `flight_hours_traineeId_key` ON `flight_hours` (`traineeId`);

CREATE UNIQUE INDEX `uq_trainee_qualification` ON `trainee_qualifications` (`traineeId`, `qualificationTypeId`);

CREATE UNIQUE INDEX `resource_qualifications_unique` ON `resource_qualifications` (`resourceId`, `qualificationTypeId`);

ALTER TABLE `trainee_qualifications` ADD CONSTRAINT `tq_trainee_fkey` FOREIGN KEY (`traineeId`) REFERENCES `trainees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `trainee_qualifications` ADD CONSTRAINT `tq_type_fkey` FOREIGN KEY (`qualificationTypeId`) REFERENCES `qualification_types` (`id`);

ALTER TABLE `qualification_renewals` ADD CONSTRAINT `renewals_tq_fkey` FOREIGN KEY (`traineeQualificationId`) REFERENCES `trainee_qualifications` (`id`) ON DELETE CASCADE;

ALTER TABLE `qualification_alerts` ADD CONSTRAINT `alerts_tq_fkey` FOREIGN KEY (`traineeQualificationId`) REFERENCES `trainee_qualifications` (`id`) ON DELETE CASCADE;

ALTER TABLE `resource_qualifications` ADD CONSTRAINT `rq_resource_fkey` FOREIGN KEY (`resourceId`) REFERENCES `resources` (`id`) ON DELETE CASCADE;

ALTER TABLE `resource_qualifications` ADD CONSTRAINT `rq_type_fkey` FOREIGN KEY (`qualificationTypeId`) REFERENCES `qualification_types` (`id`);

ALTER TABLE `sessions` ADD CONSTRAINT `sessions_traineeId_fkey` FOREIGN KEY (`traineeId`) REFERENCES `trainees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `competencies` ADD CONSTRAINT `competencies_traineeId_fkey` FOREIGN KEY (`traineeId`) REFERENCES `trainees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `flight_hours` ADD CONSTRAINT `flight_hours_traineeId_fkey` FOREIGN KEY (`traineeId`) REFERENCES `trainees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
