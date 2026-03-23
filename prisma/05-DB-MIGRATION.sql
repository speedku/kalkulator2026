-- Run manually: mysql -u root allbag_kalkulator < prisma/05-DB-MIGRATION.sql
-- NEVER run prisma migrate on shared production DB

CREATE TABLE IF NOT EXISTS containers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  container_number VARCHAR(20) UNIQUE NOT NULL,
  carrier VARCHAR(100) NOT NULL,
  port_of_origin VARCHAR(100) NOT NULL,
  port_of_destination VARCHAR(100) NOT NULL,
  shipment_date DATE NOT NULL,
  eta_date DATE NOT NULL,
  actual_arrival_date DATE NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'in_transit',
  total_value DECIMAL(12,2) NULL,
  notes TEXT,
  created_by INT NULL,
  updated_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_eta (eta_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS container_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  container_id INT NOT NULL,
  product_id INT NOT NULL,
  variant_id INT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (container_id) REFERENCES containers(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
  INDEX idx_container (container_id),
  INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS container_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  container_id INT NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT NULL,
  mime_type VARCHAR(100) NULL,
  uploaded_by INT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (container_id) REFERENCES containers(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_container (container_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS container_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  container_id INT NOT NULL,
  notification_type VARCHAR(30) NOT NULL DEFAULT 'eta_7days',
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NULL,
  body TEXT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  error_message TEXT NULL,
  FOREIGN KEY (container_id) REFERENCES containers(id) ON DELETE CASCADE,
  INDEX idx_container (container_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS domestic_deliveries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  supplier VARCHAR(255) NOT NULL,
  eta_date DATE NOT NULL,
  actual_arrival_date DATE NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  notes TEXT NULL,
  created_by INT NULL,
  updated_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_eta (eta_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS domestic_delivery_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  delivery_id INT NOT NULL,
  document_type VARCHAR(50) NOT NULL DEFAULT 'other',
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT NULL,
  mime_type VARCHAR(100) NULL,
  uploaded_by INT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (delivery_id) REFERENCES domestic_deliveries(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_delivery (delivery_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
