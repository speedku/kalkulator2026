-- Phase 6: Dashboard & Analytics — DB Migration
-- Run on production MySQL before testing notifications.
-- packer_live_stats already exists in production — DO NOT recreate it.

CREATE TABLE notifications (
  id INT NOT NULL AUTO_INCREMENT,
  sender_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'system',
  target_type VARCHAR(20) NOT NULL DEFAULT 'all',
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_type (type),
  KEY idx_created (created_at),
  CONSTRAINT fk_notif_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notification_reads (
  id INT NOT NULL AUTO_INCREMENT,
  notification_id INT NOT NULL,
  user_id INT NOT NULL,
  read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_dismissed TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY unique_read (notification_id, user_id),
  KEY idx_user (user_id),
  CONSTRAINT fk_nr_notif FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
  CONSTRAINT fk_nr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notification_recipients (
  id INT NOT NULL AUTO_INCREMENT,
  notification_id INT NOT NULL,
  user_id INT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_notif (notification_id),
  CONSTRAINT fk_nrec_notif FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
  CONSTRAINT fk_nrec_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
