<?php
class CustomersAPI {
    private $pdo;
    private $handler; // Added property variable

    // Update constructor to receive the global API Handler gateway
    public function __construct($pdo, $handler) {
        $this->pdo = $pdo;
        $this->handler = $handler; // Bind the handler parameter
    }

    public function login() {
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        
        $email = $_POST['email'] ?? $input['email'] ?? '';
        $password = $_POST['password'] ?? $input['password'] ?? '';

        if (empty($email) || empty($password)) {
            $this->handler->sendResponse(false, null, 'Email and password are required.');
            return; // Ensure execution halts
        }

        $stmt = $this->pdo->prepare("SELECT * FROM customers WHERE email = ? AND password = ?");
        $stmt->execute([$email, $password]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            unset($user['password']); 
            $user['role'] = 'customer'; 
            $this->handler->sendResponse(true, $user, 'Login successful.');
        } else {
            $this->handler->sendResponse(false, null, 'Invalid email or password.');
        }
    }

    public function register() {
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        
        $name = $_POST['name'] ?? $input['name'] ?? '';
        $email = $_POST['email'] ?? $input['email'] ?? '';
        $password = $_POST['password'] ?? $input['password'] ?? '';
        $phone = $_POST['phone'] ?? $input['phone'] ?? '';
        $address = $_POST['address'] ?? $input['address'] ?? '';
        
        if (empty($name) || empty($email) || empty($password)) {
            $this->handler->sendResponse(false, null, 'Name, email, and password are required.');
            return;
        }

        $stmt = $this->pdo->prepare("SELECT customer_id FROM customers WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            $this->handler->sendResponse(false, null, 'This email is already registered.');
            return;
        }

        $stmt = $this->pdo->prepare("INSERT INTO customers (name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)");
        $success = $stmt->execute([$name, $email, $password, $phone, $address]);
        
        if ($success) {
            $this->handler->sendResponse(true, ['customer_id' => $this->pdo->lastInsertId()], 'Account created successfully!');
        } else {
            $this->handler->sendResponse(false, null, 'Database error during registration.');
        }
    }

    public function update() {
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        
        $customer_id = $input['customer_id'] ?? '';
        $name = $input['name'] ?? '';
        $email = $input['email'] ?? '';
        $phone = $input['phone'] ?? '';
        $address = $input['address'] ?? '';
        $password = $input['password'] ?? '';

        if (empty($customer_id) || empty($name) || empty($email)) {
            $this->handler->sendResponse(false, null, 'Customer ID, Name, and Email are required.');
            return;
        }

        if (!empty($password)) {
            $stmt = $this->pdo->prepare("UPDATE customers SET name = ?, email = ?, phone = ?, address = ?, password = ? WHERE customer_id = ?");
            $success = $stmt->execute([$name, $email, $phone, $address, $password, $customer_id]);
        } else {
            $stmt = $this->pdo->prepare("UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE customer_id = ?");
            $success = $stmt->execute([$name, $email, $phone, $address, $customer_id]);
        }

        if ($success) {
            $stmt = $this->pdo->prepare("SELECT * FROM customers WHERE customer_id = ?");
            $stmt->execute([$customer_id]);
            $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);
            unset($updatedUser['password']);
            $updatedUser['role'] = 'customer';

            $this->handler->sendResponse(true, $updatedUser, 'Profile updated successfully!');
        } else {
            $this->handler->sendResponse(false, null, 'Database update failed.');
        }
    }
}