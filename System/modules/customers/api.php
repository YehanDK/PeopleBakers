<?php
// modules/customers/api.php

class CustomersAPI {
    private $pdo;
    private $handler;
    
    public function __construct($pdo, $handler) {
        $this->pdo = $pdo;
        $this->handler = $handler;
    }

    /**
     * Authenticates an online store customer using email and password
     */
    public function login() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';

        if (empty($email) || empty($password)) {
            return $this->handler->sendResponse(false, null, 'Email and password are required');
        }

        try {
            // Target the singular 'Customer' table using the updated column layout
            $stmt = $this->pdo->prepare("SELECT customer_id, customer_name, customer_email, password, cust_phone_no, customer_address 
                                         FROM Customer 
                                         WHERE customer_email = ?");
            $stmt->execute([$email]);
            $customer = $stmt->fetch(PDO::FETCH_ASSOC);

            // Directly evaluate plain-text password to match schema insertions
            if ($customer && $password === $customer['password']) {
                unset($customer['password']); // Protect credentials before return
                
                // Explicitly inject the customer role identity string for app.js parsing rules
                $customer['role'] = 'customer'; 

                return $this->handler->sendResponse(true, $customer, 'Login successful');
            }

            return $this->handler->sendResponse(false, null, 'Invalid email or password');

        } catch (Exception $e) {
            return $this->handler->sendResponse(false, null, 'Authentication database error: ' . $e->getMessage());
        }
    }
    
    /**
     * Lists all registered bakery customers
     */
    public function list() {
        try {
            $sql = "SELECT customer_id, customer_name, customer_email, cust_phone_no, customer_address 
                    FROM Customer 
                    ORDER BY customer_name ASC";
            
            $stmt = $this->pdo->query($sql);
            $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $this->handler->sendResponse(true, $customers);
        } catch (Exception $e) {
            $this->handler->sendResponse(false, null, 'Failed to fetch customer data: ' . $e->getMessage());
        }
    }
    
    /**
     * Retrieves a single customer profile profile by customer_id
     */
    public function get() {
        $id = $_GET['id'] ?? $_POST['id'] ?? 0;
        if (!$id) {
            return $this->handler->sendResponse(false, null, 'Customer ID is required');
        }
        
        try {
            $stmt = $this->pdo->prepare("SELECT customer_id, customer_name, customer_email, cust_phone_no, customer_address 
                                         FROM Customer 
                                         WHERE customer_id = ?");
            $stmt->execute([$id]);
            $customer = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$customer) {
                return $this->handler->sendResponse(false, null, 'Customer not found');
            }
            
            $this->handler->sendResponse(true, $customer);
        } catch (Exception $e) {
            $this->handler->sendResponse(false, null, 'Database search error: ' . $e->getMessage());
        }
    }
    
    /**
     * Registers a new customer (Sign Up / Account Creation)
     */
    public function create() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        
        $customer_name = $data['customer_name'] ?? '';
        $customer_email = $data['customer_email'] ?? '';
        $password = $data['password'] ?? '';
        $cust_phone_no = $data['cust_phone_no'] ?? null;
        $customer_address = $data['customer_address'] ?? null;

        if (empty($customer_name) || empty($customer_email) || empty($password)) {
            return $this->handler->sendResponse(false, null, 'Required configuration fields missing');
        }
        
        try {
            // Write core profile metrics straight into the singular Customer entity configuration
            $stmt = $this->pdo->prepare("INSERT INTO Customer (customer_name, customer_email, password, cust_phone_no, customer_address) 
                                         VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$customer_name, $customer_email, $password, $cust_phone_no, $customer_address]);
            $customer_id = $this->pdo->lastInsertId();
            
            // Automatically initialize a blank Cart for this new customer to support online store operations
            $stmtCart = $this->pdo->prepare("INSERT INTO Cart (customer_id, total) VALUES (?, 0.00)");
            $stmtCart->execute([$customer_id]);
            
            $this->handler->sendResponse(true, ['customer_id' => $customer_id], 'Customer account registered successfully');
        } catch (Exception $e) {
            $this->handler->sendResponse(false, null, 'Registration error occurred: ' . $e->getMessage());
        }
    }
        
    /**
     * Updates an active customer's address, phone, name, or email details
     */
    public function update() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $customer_id = $data['customer_id'] ?? $_GET['id'] ?? 0;
        
        if (!$customer_id) {
            return $this->handler->sendResponse(false, null, 'Customer ID parameter required');
        }

        $fields = [];
        $params = [];

        if (isset($data['customer_name'])) { $fields[] = 'customer_name = ?'; $params[] = $data['customer_name']; }
        if (isset($data['customer_email'])) { $fields[] = 'customer_email = ?'; $params[] = $data['customer_email']; }
        if (isset($data['cust_phone_no'])) { $fields[] = 'cust_phone_no = ?'; $params[] = $data['cust_phone_no']; }
        if (isset($data['customer_address'])) { $fields[] = 'customer_address = ?'; $params[] = $data['customer_address']; }

        if (empty($fields)) {
            return $this->handler->sendResponse(false, null, 'No field modifications provided');
        }

        try {
            $params[] = $customer_id;
            $stmt = $this->pdo->prepare("UPDATE Customer SET " . implode(', ', $fields) . " WHERE customer_id = ?");
            $stmt->execute($params);
            
            $this->handler->sendResponse(true, null, 'Customer contact records updated successfully');
        } catch (Exception $e) {
            $this->handler->sendResponse(false, null, 'Profile modifications failed to save: ' . $e->getMessage());
        }
    }

    /**
     * Wipes a customer profile entirely out from the operational ecosystem
     */
    public function delete() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $id = $data['id'] ?? $_GET['id'] ?? 0;

        if (!$id) {
            return $this->handler->sendResponse(false, null, 'Customer ID required to complete deletion command');
        }

        try {
            // Relational foreign key constraints handle clearing down linked Cart records automatically via ON DELETE CASCADE
            $stmt = $this->pdo->prepare("DELETE FROM Customer WHERE customer_id = ?");
            $stmt->execute([$id]);

            $this->handler->sendResponse(true, null, 'Customer profile purged successfully');
        } catch (Exception $e) {
            $this->handler->sendResponse(false, null, 'Failed to drop customer record: ' . $e->getMessage());
        }
    }
}
?>