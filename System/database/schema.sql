-- Peoples Bakers Database Schema

CREATE DATABASE IF NOT EXISTS peoples_bakers;
USE peoples_bakers;

-- ============================================================
-- USERS & EMPLOYEES
-- ============================================================

CREATE TABLE IF NOT EXISTS employees (
    employee_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role ENUM('salesassistant', 'deliveryemployee', 'inventorymanager', 'employeemanager', 'companymanager', 'financemanager', 'salessupervisor') NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PRODUCTS & INVENTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS product_categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock_qty INT DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES product_categories(category_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS restock_records (
    restock_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    supplier_id INT,
    quantity INT NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL,
    restock_date DATE NOT NULL,
    notes TEXT,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
);

CREATE TABLE IF NOT EXISTS stock_alerts (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    message TEXT,
    status ENUM('unread', 'read') DEFAULT 'unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- ============================================================
-- ORDERS & PAYMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT, -- Can be NULL for walk-in customers
    customer_name VARCHAR(100), -- For walk-in or quick entry
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered', 'Completed', 'Cancelled', 'Rejected') DEFAULT 'Pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    order_type ENUM('Online', 'InStore', 'Custom') NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE IF NOT EXISTS order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    product_id INT,
    quantity INT NOT NULL,
    price_at_time DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE IF NOT EXISTS online_orders (
    order_id INT PRIMARY KEY,
    delivery_address TEXT NOT NULL,
    tracking_number VARCHAR(50),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS custom_cake_orders (
    order_id INT PRIMARY KEY,
    phone VARCHAR(20),
    design_details TEXT,
    description TEXT,
    pickup_date DATE,
    status ENUM('PendingApproval', 'Approved', 'Rejected') DEFAULT 'PendingApproval',
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    method ENUM('Cash', 'Card', 'Online') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('Pending', 'Completed', 'Failed') DEFAULT 'Pending',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE TABLE IF NOT EXISTS delivery_info (
    delivery_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    delivery_employee_id INT,
    address TEXT,
    status ENUM('Assigned', 'Picked Up', 'Delivered') DEFAULT 'Assigned',
    delivery_date TIMESTAMP NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (delivery_employee_id) REFERENCES employees(employee_id)
);

-- ============================================================
-- HR & FINANCE
-- ============================================================

CREATE TABLE IF NOT EXISTS leaves (
    leave_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT,
    type VARCHAR(50) NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    reason TEXT,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);

CREATE TABLE IF NOT EXISTS salaries (
    salary_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    status ENUM('Pending', 'Paid') DEFAULT 'Pending',
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);

-- ============================================================
-- SEED DATA (Based on prototype mock data)
-- ============================================================

-- Categories
INSERT INTO product_categories (category_name) VALUES ('Pastry'), ('Bread'), ('Cake'), ('Cupcake');

-- Products
INSERT INTO products (name, price, stock_qty, category_id) VALUES 
('Croissant', 4.50, 24, 1),
('Baguette', 5.00, 18, 2),
('Chocolate Cake', 28.00, 6, 3),
('Vanilla Cupcake', 3.50, 45, 4),
('Sourdough', 6.75, 12, 2),
('Danish Pastry', 4.25, 30, 1);

-- Employees
INSERT INTO employees (name, username, password, email, role) VALUES 
('Maria Santos', 'salesassistant', '1234', 'maria.s@peoplesbakers.com', 'salesassistant'),
('James Chen', 'deliveryemployee', '1234', 'james.c@peoplesbakers.com', 'deliveryemployee'),
('Lisa Park', 'inventorymanager', '1234', 'lisa.p@peoplesbakers.com', 'inventorymanager'),
('Robert Kim', 'employeemanager', '1234', 'robert.k@peoplesbakers.com', 'employeemanager'),
('Alex Rivera', 'companymanager', '1234', 'alex.r@peoplesbakers.com', 'companymanager'),
('Sarah Chen', 'financemanager', '1234', 'sarah.c@peoplesbakers.com', 'financemanager'),
('David Park', 'salessupervisor', '1234', 'david.p@peoplesbakers.com', 'salessupervisor');

-- Suppliers
INSERT INTO suppliers (name, contact) VALUES 
('Bakery Supply Co.', '(555) 000-1111'),
('Dairy Distributors', '(555) 000-2222'),
('Grain & Mill', '(555) 000-3333'),
('Sweet Ingredients', '(555) 000-4444');
