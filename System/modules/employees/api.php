<?php
// modules/employees/api.php

class EmployeesAPI {
    private $pdo;
    private $handler;
    
    public function __construct($pdo, $handler) {
        $this->pdo = $pdo;
        $this->handler = $handler;
    }
    
    public function login() {
        // Get input from either POST or JSON
        $input = json_decode(file_get_contents('php://input'), true);
        $username = $_POST['username'] ?? $input['username'] ?? '';
        $password = $_POST['password'] ?? $input['password'] ?? '';
        
        if (empty($username) || empty($password)) {
            return $this->handler->sendResponse(false, null, 'Username and password required');
        }
        
        $stmt = $this->pdo->prepare("SELECT * FROM employees WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        
        if (!$user) {
            return $this->handler->sendResponse(false, null, 'Invalid username or password');
        }
        
        if ($user['password'] !== $password) {
            return $this->handler->sendResponse(false, null, 'Invalid username or password');
        }
        
        unset($user['password']);
        $this->handler->sendResponse(true, $user, 'Login successful');
    }
    
    public function list() {
        $stmt = $this->pdo->query("SELECT employee_id, name, username, email, phone, role, address, created_at FROM employees");
        $employees = $stmt->fetchAll();
        $this->handler->sendResponse(true, $employees);
    }
    
    public function get() {
        $id = $_GET['id'] ?? $_POST['id'] ?? 0;
        if (!$id) {
            return $this->handler->sendResponse(false, null, 'Employee ID required');
        }
        
        $stmt = $this->pdo->prepare("SELECT employee_id, name, username, email, phone, role, address, created_at FROM employees WHERE employee_id = ?");
        $stmt->execute([$id]);
        $employee = $stmt->fetch();
        
        if (!$employee) {
            return $this->handler->sendResponse(false, null, 'Employee not found');
        }
        
        $this->handler->sendResponse(true, $employee);
    }
    
    public function create() {
        $input = json_decode(file_get_contents('php://input'), true);
        $data = $input ?: $_POST;
        
        $name = $data['name'] ?? '';
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';
        $email = $data['email'] ?? '';
        $phone = $data['phone'] ?? '';
        $role = $data['role'] ?? '';
        $address = $data['address'] ?? '';
        
        if (empty($name) || empty($username) || empty($password) || empty($email) || empty($role)) {
            return $this->handler->sendResponse(false, null, 'Missing required fields');
        }
        
        $stmt = $this->pdo->prepare("INSERT INTO employees (name, username, password, email, phone, role, address) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $result = $stmt->execute([$name, $username, $password, $email, $phone, $role, $address]);
        
        if ($result) {
            $id = $this->pdo->lastInsertId();
            $this->handler->sendResponse(true, ['employee_id' => $id], 'Employee created successfully');
        } else {
            $this->handler->sendResponse(false, null, 'Failed to create employee');
        }
    }
    
    public function update() {
        $input = json_decode(file_get_contents('php://input'), true);
        $data = $input ?: $_POST;
        $id = $data['employee_id'] ?? $_GET['id'] ?? 0;
        
        if (!$id) {
            return $this->handler->sendResponse(false, null, 'Employee ID required');
        }
        
        $fields = [];
        $params = [];
        
        $allowed = ['name', 'username', 'email', 'phone', 'role', 'address'];
        foreach ($allowed as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (isset($data['password']) && !empty($data['password'])) {
            $fields[] = "password = ?";
            $params[] = $data['password'];
        }
        
        if (empty($fields)) {
            return $this->handler->sendResponse(false, null, 'No fields to update');
        }
        
        $params[] = $id;
        $sql = "UPDATE employees SET " . implode(', ', $fields) . " WHERE employee_id = ?";
        $stmt = $this->pdo->prepare($sql);
        $result = $stmt->execute($params);
        
        if ($result) {
            $this->handler->sendResponse(true, null, 'Employee updated successfully');
        } else {
            $this->handler->sendResponse(false, null, 'Failed to update employee');
        }
    }
    
    public function delete() {
        $id = $_GET['id'] ?? $_POST['id'] ?? 0;
        
        if (!$id) {
            return $this->handler->sendResponse(false, null, 'Employee ID required');
        }
        
        $stmt = $this->pdo->prepare("DELETE FROM employees WHERE employee_id = ?");
        $result = $stmt->execute([$id]);
        
        if ($result) {
            $this->handler->sendResponse(true, null, 'Employee deleted successfully');
        } else {
            $this->handler->sendResponse(false, null, 'Failed to delete employee');
        }
    }
}
?>