CREATE DATABASE IF NOT EXISTS peoples_bakers;
USE peoples_bakers;

-- 1. Employee Parent Table
CREATE TABLE Employee (
    emp_id INT AUTO_INCREMENT PRIMARY KEY,
    emp_name VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    emp_email VARCHAR(255) NOT NULL UNIQUE,
    base_salary DECIMAL(10, 2) NOT NULL,
    emp_address TEXT,
    emp_phone_no VARCHAR(20),
    employee_role ENUM('salesassistant', 'deliveryemployee', 'inventorymanager', 'employeemanager', 'companymanager', 'financemanager', 'salessupervisor') NOT NULL
);

-- 2. Employee Subclass / Role Tables
CREATE TABLE CompanyManager (
    emp_id INT PRIMARY KEY,
    acc_created_date DATE,
    qualifications TEXT,
    FOREIGN KEY (emp_id) REFERENCES Employee(emp_id) ON DELETE CASCADE
);

CREATE TABLE FinanceManager (
    emp_id INT PRIMARY KEY,
    spending_limit DECIMAL(10, 2),
    accounting_license VARCHAR(255),
    FOREIGN KEY (emp_id) REFERENCES Employee(emp_id) ON DELETE CASCADE
);

CREATE TABLE EmployeeManager (
    emp_id INT PRIMARY KEY,
    hr_certification VARCHAR(255),
    experience VARCHAR(255),
    FOREIGN KEY (emp_id) REFERENCES Employee(emp_id) ON DELETE CASCADE
);

CREATE TABLE InventoryManager (
    emp_id INT PRIMARY KEY,
    experience VARCHAR(255),
    spending_limit DECIMAL(10, 2),
    FOREIGN KEY (emp_id) REFERENCES Employee(emp_id) ON DELETE CASCADE
);

CREATE TABLE SalesSupervisor (
    emp_id INT PRIMARY KEY,
    qualifications TEXT,
    experience VARCHAR(255),
    FOREIGN KEY (emp_id) REFERENCES Employee(emp_id) ON DELETE CASCADE
);

CREATE TABLE SalesAssistant (
    emp_id INT PRIMARY KEY,
    assigned_register VARCHAR(50),
    assigned_shift VARCHAR(50),
    FOREIGN KEY (emp_id) REFERENCES Employee(emp_id) ON DELETE CASCADE
);

CREATE TABLE DeliveryEmployee (
    emp_id INT PRIMARY KEY,
    delivery_zone VARCHAR(100),
    vehicle_no VARCHAR(50),
    FOREIGN KEY (emp_id) REFERENCES Employee(emp_id) ON DELETE CASCADE
);

-- 3. Employee Management & Operations Tables
CREATE TABLE LeaveRequest (
    leave_request_id INT AUTO_INCREMENT PRIMARY KEY,
    emp_id INT NOT NULL,
    leave_type VARCHAR(100),
    purpose TEXT,
    leave_start DATE,
    leave_end DATE,
    leave_duration INT,
    leave_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    FOREIGN KEY (emp_id) REFERENCES Employee(emp_id) ON DELETE CASCADE
);

CREATE TABLE DailyAttendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    emp_id INT NOT NULL,
    check_in_time DATETIME,
    check_out_time DATETIME,
    work_hours DECIMAL(5, 2),
    ot_hours DECIMAL(5, 2),
    FOREIGN KEY (emp_id) REFERENCES Employee(emp_id) ON DELETE CASCADE
);

CREATE TABLE Salary (
    salary_id INT AUTO_INCREMENT PRIMARY KEY,
    emp_id INT NOT NULL,
    created_date DATE,
    base_salary DECIMAL(10, 2),
    bonus DECIMAL(10, 2),
    total DECIMAL(10, 2),
    month VARCHAR(20),
    FOREIGN KEY (emp_id) REFERENCES Employee(emp_id) ON DELETE CASCADE
);

-- 4. Supplier & Product Infrastructure
CREATE TABLE Supplier (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_name VARCHAR(255) NOT NULL
);

CREATE TABLE ProductCategory (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL
);

CREATE TABLE Product (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    product_name VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 0,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (category_id) REFERENCES ProductCategory(category_id) ON DELETE SET NULL
);

CREATE TABLE StockAlert (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    alert_status ENUM('unread', 'read') DEFAULT 'unread',
    message TEXT,
    FOREIGN KEY (product_id) REFERENCES Product(product_id) ON DELETE CASCADE
);

CREATE TABLE StockRecord (
    stock_record_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    supplier_id INT NOT NULL,
    unit_price DECIMAL(10, 2),
    quantity INT,
    total DECIMAL(10, 2),
    FOREIGN KEY (product_id) REFERENCES Product(product_id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES Supplier(supplier_id) ON DELETE CASCADE
);

-- 5. Financials & Logistics
CREATE TABLE ExpenseRecord (
    expense_record_id INT AUTO_INCREMENT PRIMARY KEY,
    ammount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    bill_number VARCHAR(100),
    date DATE
);

CREATE TABLE DeliveryFee (
    fee_id INT AUTO_INCREMENT PRIMARY KEY,
    delivery_tier VARCHAR(50),
    delivery_fee DECIMAL(10, 2)
);

CREATE TABLE SalesReport (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    report_type VARCHAR(50),
    created_date DATE,
    in_store_orders INT DEFAULT 0,
    online_orders INT DEFAULT 0,
    cake_orders INT DEFAULT 0,
    total_revenue DECIMAL(12, 2) DEFAULT 0.00
);

-- 6. Core Order Architecture
CREATE TABLE Payment (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    payment_method VARCHAR(50),
    ammount DECIMAL(10, 2) NOT NULL,
    date DATETIME
);

CREATE TABLE `Order` (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id INT,
    order_date DATETIME,
    status ENUM('Pending', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered', 'Completed', 'Cancelled', 'Approved', 'Rejected') DEFAULT 'Pending',
    total DECIMAL(10, 2),
    FOREIGN KEY (payment_id) REFERENCES Payment(payment_id) ON DELETE SET NULL
);

CREATE TABLE OrderItem (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    order_id INT NOT NULL,
    quantity INT NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES Product(product_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES `Order`(order_id) ON DELETE CASCADE
);

CREATE TABLE InStoreOrder (
    order_id INT PRIMARY KEY,
    order_type VARCHAR(50),
    customer_name VARCHAR(255),
    FOREIGN KEY (order_id) REFERENCES `Order`(order_id) ON DELETE CASCADE
);

-- 7. Customer & E-Commerce Module
CREATE TABLE Customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    cust_phone_no VARCHAR(20),
    customer_address TEXT
);

CREATE TABLE CakeOrder (
    order_id INT PRIMARY KEY,
    customer_id INT,
    custome_name VARCHAR(255),
    phone_no VARCHAR(20),
    design_details TEXT,
    description TEXT,
    requested_date DATE,
    FOREIGN KEY (order_id) REFERENCES `Order`(order_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE SET NULL
);

CREATE TABLE OnlineOrder (
    order_id INT PRIMARY KEY,
    customer_id INT,
    delivery_fee_id INT,
    delivery_fee DECIMAL(10, 2),
    FOREIGN KEY (order_id) REFERENCES `Order`(order_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE SET NULL,
    FOREIGN KEY (delivery_fee_id) REFERENCES DeliveryFee(fee_id) ON DELETE SET NULL
);

CREATE TABLE Cart (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    total DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE CASCADE
);

CREATE TABLE CartItem (
    cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (cart_id) REFERENCES Cart(cart_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Product(product_id) ON DELETE CASCADE
);




-- insertions
-- Product Categories
INSERT INTO ProductCategory (category_name) VALUES 
('Pastry'), 
('Bread'), 
('Cake'), 
('Cupcake');

-- Products (Prices scaled to typical LKR values)
INSERT INTO Product (category_id, product_name, quantity, description, price) VALUES 
(1, 'Croissant', 24, 'Flaky and buttery classic French pastry', 450.00),
(2, 'Baguette', 18, 'Traditional crispy crust French baguette', 380.00),
(3, 'Chocolate Cake', 6, 'Rich double chocolate layer gateau cake', 4800.00),
(4, 'Vanilla Cupcake', 45, 'Fluffy vanilla cupcake with buttercream frosting', 320.00),
(2, 'Sourdough', 12, 'Artisanal naturally leavened sourdough bread', 850.00),
(1, 'Danish Pastry', 30, 'Sweet fruit-filled flaky danish pastry', 420.00);

-- Employees (Salaries adjusted to monthly LKR baselines)
INSERT INTO Employee (emp_name, username, password, emp_email, base_salary, emp_address, emp_phone_no, employee_role) VALUES 
('Maria Santos', 'assistant', '1234', 'maria.s@peoplesbakers.com', 45000.00, '12/A, Galle Road, Colombo 03', '0771234567', 'SalesAssistant'),
('James Chen', 'delivery', '1234', 'james.c@peoplesbakers.com', 50000.00, '45, Kandy Road, Kiribathgoda', '0719876543', 'DeliveryEmployee'),
('Lisa Park', 'inventoryManager', '1234', 'lisa.p@peoplesbakers.com', 85000.00, '88, Negombo Road, Wattala', '0765432109', 'InventoryManager'),
('Robert Kim', 'employeeManager', '1234', 'robert.k@peoplesbakers.com', 95000.00, '102/3, High Level Road, Maharagama', '0751112223', 'EmployeeManager'),
('Alex Rivera', 'companyManager', '1234', 'alex.r@peoplesbakers.com', 18000.00, '15, Alfred House Gardens, Colombo 03', '0777777777', 'CompanyManager'),
('Sarah Chen', 'financeManager', '1234', 'sarah.c@peoplesbakers.com', 140000.00, '67/2, Havelock Road, Colombo 05', '0723334445', 'FinanceManager'),
('David Park', 'supervisor', '1234', 'david.p@peoplesbakers.com', 75000.00, '23, Parliament Road, Kotte', '0778889990', 'SalesSupervisor');

-- SalesAssistant (emp_id = 1)
INSERT INTO SalesAssistant (emp_id, assigned_register, assigned_shift) VALUES 
(1, 'Register 01', 'Morning Shift');

-- DeliveryEmployee (emp_id = 2)
INSERT INTO DeliveryEmployee (emp_id, delivery_zone, vehicle_no) VALUES 
(2, 'Colombo 03 & 04', 'WP BIZ-4567');

-- InventoryManager (emp_id = 3)
INSERT INTO InventoryManager (emp_id, experience, spending_limit) VALUES 
(3, '4 Years in Logistics', 250000.00);

-- EmployeeManager (emp_id = 4)
INSERT INTO EmployeeManager (emp_id, hr_certification, experience) VALUES 
(4, 'SHRM Certified Professional', '6 Years HR Experience');

-- CompanyManager (emp_id = 5)
INSERT INTO CompanyManager (emp_id, acc_created_date, qualifications) VALUES 
(5, '2026-01-15', 'MBA - University of Colombo');

-- FinanceManager (emp_id = 6)
INSERT INTO FinanceManager (emp_id, spending_limit, accounting_license) VALUES 
(6, 1000000.00, 'ACA / CIMA Passed Finalist');

-- SalesSupervisor (emp_id = 7)
INSERT INTO SalesSupervisor (emp_id, qualifications, experience) VALUES 
(7, 'B.Com in Marketing', '3 Years Retail Management');


-- Suppliers (Matches structural mapping for table: Supplier)
INSERT INTO Supplier (supplier_name) VALUES 
('Bakery Supply Co.'),
('Dairy Distributors'),
('Grain & Mill'),
('Sweet Ingredients');


-- Delivery Fees (Tier pricing in LKR)
INSERT INTO DeliveryFee (delivery_tier, delivery_fee) VALUES 
('Standard', 150.00);

-- Customers
INSERT INTO Customer (customer_name, customer_email, password, cust_phone_no, customer_address) VALUES 
('The Customer', 'customer@gmail.com', '1234', '0773456789', '45/1, De Kretser Place, Colombo 04'),
('Thidas Sandaruwan', 'thidas@gmail.com', '1234', '0714567890', '112, Kynsey Road, Colombo 08');