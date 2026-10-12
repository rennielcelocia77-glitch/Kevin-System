USE KevsBroom;

-- Development-only accounts. Password for both: broom-dev-2026
INSERT INTO users (name, username, password_hash, role) VALUES
('Development Owner', 'owner', '$2b$10$twjEDjsfD7WUQP3BpuDAaOphtyKHyiRKjNItvwW.DVpeAiHhqsmSu', 'OWNER'),
('Development Employee', 'employee', '$2b$10$twjEDjsfD7WUQP3BpuDAaOphtyKHyiRKjNItvwW.DVpeAiHhqsmSu', 'EMPLOYEE');

INSERT INTO suppliers (supplier_name, contact_person, status) VALUES
('Sample Pinanitan Supplier', 'Development Contact', 'ACTIVE'),
('Sample Hardware Supplier', 'Development Contact', 'ACTIVE');

INSERT INTO inventory_items (item_name, item_type, unit, reorder_level, cost_per_unit, selling_price) VALUES
('Raw Pinanitan', 'RAW_MATERIAL', 'BANGAN', 20, 0, NULL),
('Bamboo Handle', 'RAW_MATERIAL', 'PIECE', 50, 0, NULL),
('Poly Cord', 'RAW_MATERIAL', 'ROLL', 5, 0, NULL),
('Washed Pinanitan', 'PROCESSED_MATERIAL', 'BANGAN', 20, 0, NULL),
('Finished Broom', 'FINISHED_PRODUCT', 'PIECE', 25, 0, 0);

INSERT INTO employees (name, contact_information, notes) VALUES
('Juan Development Worker', 'Local contact', 'Development-only laborer'),
('Pedro Development Worker', 'Local contact', 'Development-only laborer');

INSERT INTO customers (name, contact, address, notes) VALUES
('Development Customer', 'Local contact', 'Local address', 'Development-only customer');
