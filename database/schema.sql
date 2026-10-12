CREATE DATABASE IF NOT EXISTS KevsBroom CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE KevsBroom;

CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  username VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('OWNER', 'EMPLOYEE') NOT NULL DEFAULT 'EMPLOYEE',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE employees (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  contact_information VARCHAR(255),
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE suppliers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  supplier_name VARCHAR(160) NOT NULL,
  contact_person VARCHAR(120),
  phone VARCHAR(40),
  address VARCHAR(255),
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE supplier_item_categories (
  supplier_id INT UNSIGNED NOT NULL,
  item_category VARCHAR(80) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (supplier_id, item_category),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

CREATE TABLE inventory_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_name VARCHAR(160) NOT NULL UNIQUE,
  item_type ENUM('RAW_MATERIAL', 'PROCESSED_MATERIAL', 'FINISHED_PRODUCT') NOT NULL,
  unit VARCHAR(30) NOT NULL,
  current_quantity DECIMAL(14,3) NOT NULL DEFAULT 0,
  reorder_level DECIMAL(14,3) NOT NULL DEFAULT 0,
  cost_per_unit DECIMAL(14,2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(14,2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_inventory_quantity CHECK (current_quantity >= 0),
  CONSTRAINT chk_inventory_reorder CHECK (reorder_level >= 0)
);

CREATE TABLE inventory_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  inventory_item_id INT UNSIGNED NOT NULL,
  transaction_type ENUM('OPENING_STOCK','PURCHASE','STOCK_IN','STOCK_OUT','WASHING_CONSUMPTION','WASHING_OUTPUT','PRODUCTION_CONSUMPTION','PRODUCTION_OUTPUT','SALE','SALE_RETURN','DAMAGE','LOSS','ADJUSTMENT') NOT NULL,
  quantity DECIMAL(14,3) NOT NULL,
  unit VARCHAR(30) NOT NULL,
  reference_type VARCHAR(50),
  reference_id BIGINT UNSIGNED,
  reason VARCHAR(120),
  notes TEXT,
  created_by INT UNSIGNED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_inventory_transactions_item_date (inventory_item_id, created_at)
);

CREATE TABLE purchases (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT UNSIGNED,
  purchase_date DATE NOT NULL,
  reference_number VARCHAR(80),
  total_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by INT UNSIGNED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE purchase_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  purchase_id BIGINT UNSIGNED NOT NULL,
  inventory_item_id INT UNSIGNED NOT NULL,
  quantity DECIMAL(14,3) NOT NULL,
  unit VARCHAR(30) NOT NULL,
  unit_cost DECIMAL(14,2) NOT NULL,
  total_cost DECIMAL(14,2) NOT NULL,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id)
);

CREATE TABLE washing_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  washing_date DATE NOT NULL,
  raw_item_id INT UNSIGNED NOT NULL,
  washed_item_id INT UNSIGNED NOT NULL,
  raw_quantity DECIMAL(14,3) NOT NULL,
  washed_quantity DECIMAL(14,3) NOT NULL,
  laborer_id INT UNSIGNED,
  labor_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by INT UNSIGNED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (raw_item_id) REFERENCES inventory_items(id),
  FOREIGN KEY (washed_item_id) REFERENCES inventory_items(id),
  FOREIGN KEY (laborer_id) REFERENCES employees(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE production_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  production_date DATE NOT NULL,
  output_item_id INT UNSIGNED NOT NULL,
  output_quantity DECIMAL(14,3) NOT NULL,
  material_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
  labor_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by INT UNSIGNED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (output_item_id) REFERENCES inventory_items(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE labor_records (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  laborer_id INT UNSIGNED NOT NULL,
  work_date DATE NOT NULL,
  work_type VARCHAR(100) NOT NULL,
  description TEXT,
  quantity DECIMAL(14,3),
  unit VARCHAR(30),
  rate DECIMAL(14,2),
  total_amount DECIMAL(14,2) NOT NULL,
  payment_status ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID') NOT NULL DEFAULT 'UNPAID',
  washing_transaction_id BIGINT UNSIGNED,
  production_id BIGINT UNSIGNED,
  notes TEXT,
  created_by INT UNSIGNED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (laborer_id) REFERENCES employees(id),
  FOREIGN KEY (washing_transaction_id) REFERENCES washing_transactions(id) ON DELETE SET NULL,
  FOREIGN KEY (production_id) REFERENCES production_transactions(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE production_materials (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  production_id BIGINT UNSIGNED NOT NULL,
  inventory_item_id INT UNSIGNED NOT NULL,
  quantity DECIMAL(14,3) NOT NULL,
  unit VARCHAR(30) NOT NULL,
  FOREIGN KEY (production_id) REFERENCES production_transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id)
);

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED,
  action VARCHAR(80) NOT NULL,
  entity VARCHAR(80) NOT NULL,
  entity_id BIGINT UNSIGNED,
  metadata JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_logs_created_at (created_at)
);

CREATE TABLE customers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  contact VARCHAR(120),
  address VARCHAR(255),
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE sales (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id INT UNSIGNED,
  sale_date DATE NOT NULL,
  reference_number VARCHAR(80),
  total_amount DECIMAL(14,2) NOT NULL,
  status ENUM('COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'COMPLETED',
  notes TEXT,
  created_by INT UNSIGNED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_sales_customer_date (customer_id, sale_date)
);

CREATE TABLE sale_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sale_id BIGINT UNSIGNED NOT NULL,
  inventory_item_id INT UNSIGNED NOT NULL,
  quantity DECIMAL(14,3) NOT NULL,
  unit VARCHAR(30) NOT NULL,
  unit_price DECIMAL(14,2) NOT NULL,
  subtotal DECIMAL(14,2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id)
);

CREATE TABLE payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sale_id BIGINT UNSIGNED NOT NULL,
  customer_id INT UNSIGNED,
  payment_date DATE NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  reference_number VARCHAR(80),
  notes TEXT,
  created_by INT UNSIGNED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_payment_amount CHECK (amount > 0),
  INDEX idx_payments_customer_date (customer_id, payment_date)
);

CREATE TABLE employee_cash_advances (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id INT UNSIGNED NOT NULL,
  advance_date DATE NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  notes TEXT,
  created_by INT UNSIGNED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_employee_advance_amount CHECK (amount > 0),
  INDEX idx_employee_advances_employee_date (employee_id, advance_date)
);

CREATE TABLE employee_advance_payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  advance_id BIGINT UNSIGNED NOT NULL,
  employee_id INT UNSIGNED NOT NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  notes TEXT,
  created_by INT UNSIGNED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (advance_id) REFERENCES employee_cash_advances(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_employee_advance_payment_amount CHECK (amount > 0),
  INDEX idx_employee_advance_payments_advance_date (advance_id, payment_date)
);

CREATE TABLE deliveries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sale_id BIGINT UNSIGNED NOT NULL,
  customer_id INT UNSIGNED,
  delivery_date DATE NOT NULL,
  delivery_address VARCHAR(255),
  status ENUM('PENDING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  driver_name VARCHAR(120),
  notes TEXT,
  created_by INT UNSIGNED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_deliveries_customer_date (customer_id, delivery_date)
);

CREATE TABLE expenses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  amount DECIMAL(14,2) NOT NULL,
  expense_date DATE NOT NULL,
  delivery_id BIGINT UNSIGNED,
  reference_number VARCHAR(80),
  notes TEXT,
  created_by INT UNSIGNED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_expense_amount CHECK (amount > 0),
  INDEX idx_expenses_date (expense_date),
  INDEX idx_expenses_category (category)
);

CREATE TABLE gasoline_expenses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  expense_id BIGINT UNSIGNED,
  quantity_liters DECIMAL(10,2),
  price_per_liter DECIMAL(14,2),
  total_amount DECIMAL(14,2) NOT NULL,
  expense_date DATE NOT NULL,
  vehicle_description VARCHAR(120),
  delivery_id BIGINT UNSIGNED,
  notes TEXT,
  created_by INT UNSIGNED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
  FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_gasoline_date (expense_date)
);
