USE KevsBroom;

CREATE TABLE IF NOT EXISTS supplier_item_categories (
  supplier_id INT UNSIGNED NOT NULL,
  item_category VARCHAR(80) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (supplier_id, item_category),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);