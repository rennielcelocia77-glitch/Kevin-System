USE KevsBroom;

CREATE TABLE IF NOT EXISTS employee_cash_advances (
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

CREATE TABLE IF NOT EXISTS employee_advance_payments (
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