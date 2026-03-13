CREATE TABLE `Trainees` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255),
  `phone` varchar(255),
  `role` varchar(255)
);

CREATE TABLE `qualification_types` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255),
  `description` text
);

CREATE TABLE `trainee_qualifications` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `trainees_id` int,
  `qualification_type_id` int,
  `issue_date` date,
  `expiry_date` date
);

CREATE TABLE `resources` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255),
  `type` ENUM ('aircraft', 'simulator'),
  `status` ENUM ('available', 'booked', 'maintenance')
);

CREATE TABLE `alerts` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `qualification_id` int,
  `message` varchar(255),
  `alert_date` date,
  `is_sent` boolean DEFAULT false
);

ALTER TABLE `trainee_qualifications` ADD FOREIGN KEY (`trainees_id`) REFERENCES `Trainees` (`id`);

ALTER TABLE `trainee_qualifications` ADD FOREIGN KEY (`qualification_type_id`) REFERENCES `qualification_types` (`id`);

ALTER TABLE `alerts` ADD FOREIGN KEY (`qualification_id`) REFERENCES `trainee_qualifications` (`id`);
