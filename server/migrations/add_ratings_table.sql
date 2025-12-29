-- Create menu_ratings table for storing ratings per menu item
CREATE TABLE IF NOT EXISTS menu_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_item_id INT NOT NULL,
  order_id INT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- Add index for faster queries
CREATE INDEX idx_menu_ratings_menu_item ON menu_ratings(menu_item_id);

-- Add rating_avg and rating_count columns to menu_items
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS rating_avg DECIMAL(2, 1) DEFAULT 0;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS rating_count INT DEFAULT 0;
