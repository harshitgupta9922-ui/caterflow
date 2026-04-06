-- ============================================================
-- CaterFlow Database Schema
-- Run once: mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS caterflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE caterflow;

-- ── CLIENTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id         VARCHAR(36)   PRIMARY KEY,
  name       VARCHAR(255)  NOT NULL,
  type       VARCHAR(100)  NOT NULL DEFAULT 'Hospital',
  location   VARCHAR(255)  NOT NULL,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         INT           PRIMARY KEY AUTO_INCREMENT,
  name       VARCHAR(255)  NOT NULL,
  username   VARCHAR(100)  NOT NULL UNIQUE,
  password   VARCHAR(255)  NOT NULL,
  role       ENUM('admin','vendor') NOT NULL DEFAULT 'vendor',
  client_id  VARCHAR(36)   NULL,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

-- ── GROCERY ITEMS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grocery_items (
  id         VARCHAR(36)   PRIMARY KEY,
  name       VARCHAR(255)  NOT NULL,
  unit       VARCHAR(50)   NOT NULL DEFAULT 'kg',
  category   VARCHAR(100)  NOT NULL DEFAULT 'Others',
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── PURCHASES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchases (
  id           INT           PRIMARY KEY AUTO_INCREMENT,
  client_id    VARCHAR(36)   NOT NULL,
  date         DATE          NOT NULL,
  people_count INT           NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  added_by     VARCHAR(100)  NOT NULL,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_date     (date),
  INDEX idx_client   (client_id),
  INDEX idx_added_by (added_by)
);

-- ── PURCHASE ITEMS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_items (
  id          INT           PRIMARY KEY AUTO_INCREMENT,
  purchase_id INT           NOT NULL,
  grocery_id  VARCHAR(36)   NOT NULL,
  qty         DECIMAL(10,2) NOT NULL,
  rate        DECIMAL(10,2) NOT NULL,
  total       DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id)     ON DELETE CASCADE,
  FOREIGN KEY (grocery_id)  REFERENCES grocery_items(id) ON DELETE CASCADE
);

-- ── RETURN ENTRIES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS return_entries (
  id           INT           PRIMARY KEY AUTO_INCREMENT,
  client_id    VARCHAR(36)   NOT NULL,
  date         DATE          NOT NULL,
  people_count INT           DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  added_by     VARCHAR(100)  NOT NULL,
  created_at   DATETIME      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_client (client_id)
);

-- ── RETURN ITEMS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS return_items (
  id        INT           PRIMARY KEY AUTO_INCREMENT,
  return_id INT           NOT NULL,
  grocery_id VARCHAR(36)  NOT NULL,
  qty       DECIMAL(10,2) NOT NULL,
  rate      DECIMAL(10,2) NOT NULL,
  total     DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (return_id) REFERENCES return_entries(id) ON DELETE CASCADE
);

-- ── EMPLOYEES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id              INT           PRIMARY KEY AUTO_INCREMENT,
  client_id       VARCHAR(36)   NOT NULL,
  name            VARCHAR(255)  NOT NULL,
  position        VARCHAR(100),
  monthly_salary  DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_client (client_id)
);

-- ── SALES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id          INT           PRIMARY KEY AUTO_INCREMENT,
  client_id   VARCHAR(36)   NOT NULL,
  date        DATE          NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  description VARCHAR(255),
  entry_type  ENUM('lump_sum', 'detailed') NOT NULL DEFAULT 'lump_sum',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_client (client_id),
  INDEX idx_date (date)
);

-- ── SALES ITEMS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales_items (
  id        INT           PRIMARY KEY AUTO_INCREMENT,
  sale_id   INT           NOT NULL,
  item_name VARCHAR(255)  NOT NULL,
  qty       DECIMAL(10,2) NOT NULL,
  rate      DECIMAL(10,2) NOT NULL,
  total     DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT IGNORE INTO clients (id, name, type, location) VALUES
  ('C1', 'City Hospital',       'Hospital',    'Sector 12'),
  ('C2', 'Green Valley Hostel', 'Hostel Mess', 'MG Road'),
  ('C3', 'Metro Hospital',      'Hospital',    'Civil Lines');

INSERT IGNORE INTO grocery_items (id, name, unit, category) VALUES
  ('G1',  'Rice',          'kg',    'Grains'),
  ('G2',  'Wheat Flour',   'kg',    'Grains'),
  ('G3',  'Dal (Lentils)', 'kg',    'Pulses'),
  ('G4',  'Cooking Oil',   'litre', 'Oils'),
  ('G5',  'Salt',          'kg',    'Spices'),
  ('G6',  'Onions',        'kg',    'Vegetables'),
  ('G7',  'Tomatoes',      'kg',    'Vegetables'),
  ('G8',  'Potatoes',      'kg',    'Vegetables'),
  ('G9',  'Sugar',         'kg',    'Others'),
  ('G10', 'Milk',          'litre', 'Dairy');

-- Passwords below are bcrypt hashes of: admin123 (admin) / vendor123 (all vendors)
-- Change them immediately after setup using: PUT /api/users/:id
INSERT IGNORE INTO users (name, username, password, role, client_id) VALUES
  ('Admin Manager', 'admin',   '$2b$10$rIC/c/8OaFq6i7FGzlvwGuzQMKLhhiJHOk1GV6KXF.pifJJm4e5lO', 'admin',  NULL),
  ('Ravi Kumar',    'vendor1', '$2b$10$rIC/c/8OaFq6i7FGzlvwGuzQMKLhhiJHOk1GV6KXF.pifJJm4e5lO', 'vendor', 'C1'),
  ('Suresh Patel',  'vendor2', '$2b$10$rIC/c/8OaFq6i7FGzlvwGuzQMKLhhiJHOk1GV6KXF.pifJJm4e5lO', 'vendor', 'C2'),
  ('Mohan Singh',   'vendor3', '$2b$10$rIC/c/8OaFq6i7FGzlvwGuzQMKLhhiJHOk1GV6KXF.pifJJm4e5lO', 'vendor', 'C1'),
  ('Priya Sharma',  'vendor4', '$2b$10$rIC/c/8OaFq6i7FGzlvwGuzQMKLhhiJHOk1GV6KXF.pifJJm4e5lO', 'vendor', 'C3'),
  ('Deepak Verma',  'vendor5', '$2b$10$rIC/c/8OaFq6i7FGzlvwGuzQMKLhhiJHOk1GV6KXF.pifJJm4e5lO', 'vendor', 'C2'),
  ('Anjali Gupta',  'vendor6', '$2b$10$rIC/c/8OaFq6i7FGzlvwGuzQMKLhhiJHOk1GV6KXF.pifJJm4e5lO', 'vendor', 'C3');
