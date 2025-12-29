-- Create database
CREATE DATABASE IF NOT EXISTS oramen_db;
USE oramen_db;

-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(500),
  rating DECIMAL(2, 1) DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  table_number VARCHAR(10),
  order_type ENUM('dine-in', 'takeaway') DEFAULT 'dine-in',
  status ENUM('menunggu', 'sedang-dibuat', 'siap', 'selesai', 'dibatalkan') DEFAULT 'menunggu',
  payment_status ENUM('pending', 'success', 'failed', 'cash') DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  menu_item_id INT,
  item_name VARCHAR(255) NOT NULL,
  variant VARCHAR(100),
  quantity INT NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
);

-- Insert sample menu items
INSERT INTO menu_items (name, description, category, price, image_url, rating) VALUES
('Udon Curry Katsu', 'Udon kenyal dengan kuah kari kental gurih-manis, dipadu telur lembut dan sayuran segar', 'Udon', 30000.00, 'https://images.unsplash.com/photo-1618841557871-b4664fbf0cb3?w=400&h=300&fit=crop', 4.7),
('Udon Curry Beef', 'Udon dengan kuah kari dan daging sapi premium', 'Udon', 34000.00, 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&h=300&fit=crop', 4.8),
('Ramen Shoyu', 'Ramen dengan kuah kecap khas Jepang', 'Ramen', 28000.00, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop', 4.6),
('Ramen Miso', 'Ramen dengan kuah miso creamy', 'Ramen', 32000.00, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=300&fit=crop', 4.9),
('Ocha Dingin', 'Teh hijau Jepang segar yang disajikan dingin', 'Drink', 8000.00, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop', 4.5),
('Ocha Hangat', 'Teh hijau Jepang hangat yang menenangkan', 'Drink', 8000.00, 'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=400&h=300&fit=crop', 4.6),
('Lemon Tea', 'Teh lemon segar dengan rasa manis asam yang menyegarkan', 'Drink', 12000.00, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop', 4.4),
('Es Jeruk', 'Jus jeruk segar dengan es batu', 'Drink', 10000.00, 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop', 4.3),
('Calpico Original', 'Minuman yogurt Jepang yang menyegarkan', 'Drink', 15000.00, 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=400&h=300&fit=crop', 4.7),
('Ramune Soda', 'Soda Jepang klasik dengan rasa buah', 'Drink', 18000.00, 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&h=300&fit=crop', 4.8);

-- Insert sample orders
INSERT INTO orders (order_number, customer_name, table_number, order_type, status, payment_status, total_amount) VALUES
('#0001', 'Lionel Agus', '1', 'dine-in', 'sedang-dibuat', 'success', 90000.00),
('#0002', 'Lamien Laman', '2', 'dine-in', 'menunggu', 'pending', 64000.00),
('#0003', 'Kylian Asep', '3', 'dine-in', 'siap', 'success', 102000.00),
('#0004', 'Erling Budi', '4', 'dine-in', 'selesai', 'success', 58000.00);

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  password VARCHAR(255)
);

INSERT INTO admins (username, password)
VALUES ('admin', '$2b$10$3zV4bKMuZL8YRQ4ExLV3qeHoDbWbnput65LdYUIziBj04nXvtms3K');
