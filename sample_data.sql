-- This file contains SQL commands to initialize the sample database
-- It is used for reference and not executed directly by the application

-- Create Products table
CREATE TABLE IF NOT EXISTS product (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price FLOAT NOT NULL,
    cost FLOAT NOT NULL
);

-- Create Customers table
CREATE TABLE IF NOT EXISTS customer (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    location VARCHAR(100) NOT NULL,
    segment VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Sales table
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    product_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    total_amount FLOAT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES product(id),
    FOREIGN KEY (customer_id) REFERENCES customer(id)
);

-- Create QueryHistory table
CREATE TABLE IF NOT EXISTS query_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    voice_query TEXT NOT NULL,
    generated_sql TEXT NOT NULL,
    explanation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sample Products
INSERT INTO product (name, category, price, cost) VALUES
('Laptop Pro', 'Electronics', 1299.99, 899.99),
('Smartphone X', 'Electronics', 799.99, 499.99),
('Wireless Headphones', 'Electronics', 149.99, 79.99),
('Office Chair', 'Furniture', 249.99, 129.99),
('Standing Desk', 'Furniture', 399.99, 199.99),
('Coffee Machine', 'Appliances', 89.99, 49.99),
('Fitness Tracker', 'Wearables', 129.99, 69.99),
('Smart Speaker', 'Electronics', 79.99, 39.99),
('Tablet Mini', 'Electronics', 399.99, 249.99),
('External Hard Drive', 'Electronics', 119.99, 59.99);

-- Sample Customers
INSERT INTO customer (name, email, location, segment) VALUES
('Acme Corp', 'contact@acmecorp.com', 'New York', 'Enterprise'),
('TechStart Inc', 'info@techstart.com', 'San Francisco', 'SMB'),
('Global Solutions', 'sales@globalsolutions.com', 'Chicago', 'Enterprise'),
('Digital Creations', 'hello@digitalcreations.com', 'Los Angeles', 'SMB'),
('John Smith', 'john.smith@email.com', 'Denver', 'Consumer'),
('Sarah Johnson', 'sarah.j@email.com', 'Miami', 'Consumer'),
('Innovate LLC', 'info@innovatellc.com', 'Boston', 'SMB'),
('Enterprise Systems', 'sales@enterprisesys.com', 'Seattle', 'Enterprise'),
('Local Store', 'contact@localstore.com', 'Portland', 'SMB'),
('Data Experts', 'info@dataexperts.com', 'Austin', 'Enterprise');

-- Sample Sales data would be generated dynamically in a real application
-- as it requires many records over time for meaningful analysis
