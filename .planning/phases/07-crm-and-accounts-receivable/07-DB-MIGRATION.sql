-- .planning/phases/07-crm-and-accounts-receivable/07-DB-MIGRATION.sql
-- Apply with: prisma db execute --file ./07-DB-MIGRATION.sql OR manually in phpMyAdmin

CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `symbol` VARCHAR(50) NULL UNIQUE,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(50) NULL,
  `nip` VARCHAR(20) NULL,
  `address` TEXT NULL,
  `price_list_id` INT NULL,
  `account_manager` VARCHAR(255) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_contact_at` DATETIME NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_customers_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `leads` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(50) NULL,
  `company` VARCHAR(255) NULL,
  `source` VARCHAR(100) NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'new',
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_leads_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `deals` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `stage` VARCHAR(50) NOT NULL DEFAULT 'prospecting',
  `value` DECIMAL(12,2) NULL,
  `notes` TEXT NULL,
  `closed_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_deals_stage` (`stage`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `brand_watch_items` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `url` VARCHAR(500) NOT NULL,
  `marketplace` VARCHAR(100) NOT NULL,
  `product_sku` VARCHAR(100) NULL,
  `notes` TEXT NULL,
  `last_checked` DATETIME NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `windykacja_cases` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` INT NOT NULL UNIQUE,
  `customer_id` INT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'open',
  `priority` VARCHAR(20) NOT NULL DEFAULT 'normal',
  `notes` TEXT NULL,
  `assigned_to` INT NULL,
  `resolved_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_windykacja_cases_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reminder_logs` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `case_id` INT NOT NULL,
  `level` TINYINT NOT NULL,
  `recipient_email` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `body_html` LONGTEXT NULL,
  `sent_by` INT NULL,
  `sent_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` VARCHAR(20) NOT NULL DEFAULT 'sent',
  `error_message` TEXT NULL,
  INDEX `idx_reminder_logs_case_id` (`case_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
