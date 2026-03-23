-- Phase 3: Pricing Engine — Manual DB Migration
-- Run on allbag_kalkulator database when real DB credentials are available.
-- These statements use IF NOT EXISTS / IF EXISTS guards so they are safe to re-run.
-- Source: kalkulator2025/migrate-create-price-system.php (confirmed schema)

-- 1. Create price_lists table
CREATE TABLE IF NOT EXISTS price_lists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Create price_list_margins junction table
CREATE TABLE IF NOT EXISTS price_list_margins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  price_list_id INT NOT NULL,
  product_group_id INT NOT NULL,
  margin_percent DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_margin (price_list_id, product_group_id),
  FOREIGN KEY (price_list_id) REFERENCES price_lists(id) ON DELETE CASCADE,
  FOREIGN KEY (product_group_id) REFERENCES product_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Add price_list_id column to users table (new in kalkulator2026 — not present in kalkulator2025)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS price_list_id INT NULL,
  ADD CONSTRAINT fk_users_price_list FOREIGN KEY (price_list_id) REFERENCES price_lists(id) ON DELETE SET NULL;

-- Verification queries (run after migration):
-- SHOW TABLES LIKE 'price_lists';
-- SHOW TABLES LIKE 'price_list_margins';
-- SHOW COLUMNS FROM users LIKE 'price_list_id';
