-- Phase 4: Quotations & Invoicing migration
-- quotations + quotation_items tables already exist in allbag_kalkulator production DB
-- Only create the new invoices tables

CREATE TABLE IF NOT EXISTS `invoices` (
  `id`               INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `invoice_number`   VARCHAR(20) NOT NULL UNIQUE,
  `customer_name`    VARCHAR(255) NOT NULL,
  `customer_address` TEXT,
  `customer_nip`     VARCHAR(20),
  `status`           VARCHAR(20) NOT NULL DEFAULT 'draft',
  `total_net`        DECIMAL(10,2) NOT NULL DEFAULT 0,
  `total_vat`        DECIMAL(10,2) NOT NULL DEFAULT 0,
  `total_gross`      DECIMAL(10,2) NOT NULL DEFAULT 0,
  `vat_rate`         INT NOT NULL DEFAULT 23,
  `notes`            TEXT,
  `issued_at`        DATETIME,
  `due_at`           DATETIME,
  `created_by`       INT NOT NULL,
  `created_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_invoices_user` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `invoice_items` (
  `id`           INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `invoice_id`   INT NOT NULL,
  `product_id`   INT,
  `product_name` VARCHAR(255) NOT NULL,
  `sku`          VARCHAR(100),
  `quantity`     INT NOT NULL,
  `unit_net`     DECIMAL(10,2) NOT NULL,
  `total_net`    DECIMAL(10,2) NOT NULL,
  CONSTRAINT `fk_invoice_items_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
