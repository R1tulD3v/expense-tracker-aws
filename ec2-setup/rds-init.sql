# Install MySQL client on EC2
sudo yum install -y mysql

# Connect to RDS (replace with your RDS endpoint)
mysql -h your-rds-endpoint.amazonaws.com -u admin -p

# Create database and tables
CREATE DATABASE expense_tracker;
USE expense_tracker;

CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (username, email) VALUES ('test-user', 'test@example.com');
INSERT INTO expenses (user_id, amount, category, description, expense_date) VALUES 
('test-user', 250.00, 'food', 'Lunch at cafeteria', '2025-09-02'),
('test-user', 50.00, 'transport', 'Bus fare', '2025-09-01');

-- Verify data
SELECT * FROM expenses;
