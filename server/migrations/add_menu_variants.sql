-- Menu Variants Table
-- Stores variant groups (e.g., "Size", "Topping", "Spice Level")
CREATE TABLE IF NOT EXISTS menu_variant_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_item_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  max_select INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

-- Menu Variant Options Table
-- Stores individual options within a group (e.g., "Small +0", "Large +5000")
CREATE TABLE IF NOT EXISTS menu_variant_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  variant_group_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  extra_price DECIMAL(10, 2) DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (variant_group_id) REFERENCES menu_variant_groups(id) ON DELETE CASCADE
);

-- Order Item Variants Table
-- Stores selected variants for each order item
CREATE TABLE IF NOT EXISTS order_item_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_item_id INT NOT NULL,
  variant_option_id INT NOT NULL,
  variant_name VARCHAR(100) NOT NULL,
  option_name VARCHAR(100) NOT NULL,
  extra_price DECIMAL(10, 2) DEFAULT 0,
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE
);

-- Example data:
-- INSERT INTO menu_variant_groups (menu_item_id, name, is_required, max_select) VALUES (1, 'Size', TRUE, 1);
-- INSERT INTO menu_variant_options (variant_group_id, name, extra_price) VALUES (1, 'Regular', 0);
-- INSERT INTO menu_variant_options (variant_group_id, name, extra_price) VALUES (1, 'Large', 5000);
