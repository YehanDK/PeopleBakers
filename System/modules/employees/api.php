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
        $stmt = $this->pdo->query("
            SELECT e.employee_id, e.name, e.username, e.email, e.phone, e.role, e.address, e.created_at, e.basic_salary,
                   COALESCE(s.amount, 0) as salary, s.payment_date, s.status as salary_status
            FROM employees e
            LEFT JOIN salaries s ON e.employee_id = s.employee_id
        ");
        $employees = $stmt->fetchAll();
        $this->handler->sendResponse(true, $employees);
    }
    
    public function get() {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? $_POST['id'] ?? ($input['id'] ?? 0);
        if (!$id) {
            return $this->handler->sendResponse(false, null, 'Employee ID required');
        }
        
        $stmt = $this->pdo->prepare("SELECT employee_id, name, username, email, phone, role, address, basic_salary, created_at FROM employees WHERE employee_id = ?");
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

        // Salary mapping by role
        $roleSalaries = [
            'salesassistant' => 25000,
            'salessupervisor' => 40000,
            'deliveryemployee' => 30000,
            'inventorymanager' => 40000,
            'financemanager' => 50000,
            'employeemanager' => 50000
        ];

        $salary = $roleSalaries[$role] ?? 45000;

        try {
            $this->pdo->beginTransaction();

            $stmt = $this->pdo->prepare("INSERT INTO employees (name, username, password, email, phone, role, address, basic_salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$name, $username, $password, $email, $phone, $role, $address, $salary]);
            $id = $this->pdo->lastInsertId();

            $this->pdo->commit();
            $this->handler->sendResponse(true, ['employee_id' => $id, 'basic_salary' => $salary], 'Employee created successfully');
        } catch (Exception $e) {
            $this->pdo->rollBack();
            $this->handler->sendResponse(false, null, 'Failed to create employee: ' . $e->getMessage());
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

        $roleSalaries = [
            'salesassistant' => 25000,
            'salessupervisor' => 40000,
            'deliveryemployee' => 30000,
            'inventorymanager' => 40000,
            'financemanager' => 50000,
            'employeemanager' => 50000
        ];

        $allowed = ['name', 'username', 'email', 'phone', 'role', 'address'];
        foreach ($allowed as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }

        // If the role changed, keep basic_salary in sync with the role's salary
        if (isset($data['role'])) {
            $fields[] = "basic_salary = ?";
            $params[] = $roleSalaries[$data['role']] ?? 45000;
        }
        
        if (isset($data['password']) && !empty($data['password'])) {
            // If a current_password was supplied (e.g. from the "Change Password" screen), verify it first
            if (isset($data['current_password'])) {
                $check = $this->pdo->prepare("SELECT password FROM employees WHERE employee_id = ?");
                $check->execute([$id]);
                $existing = $check->fetch();
                if (!$existing || $existing['password'] !== $data['current_password']) {
                    return $this->handler->sendResponse(false, null, 'Current password is incorrect');
                }
            }
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
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? $_POST['id'] ?? ($input['id'] ?? 0);

        if (!$id) {
            return $this->handler->sendResponse(false, null, 'Employee ID required');
        }

        try {
            $this->pdo->beginTransaction();

            // Remove related records that reference this employee so the
            // foreign key constraints don't block the delete.
            $this->pdo->prepare("DELETE FROM leaves WHERE employee_id = ?")->execute([$id]);
            $this->pdo->prepare("DELETE FROM salaries WHERE employee_id = ?")->execute([$id]);
            $this->pdo->prepare("DELETE FROM delivery_info WHERE delivery_employee_id = ?")->execute([$id]);

            $stmt = $this->pdo->prepare("DELETE FROM employees WHERE employee_id = ?");
            $stmt->execute([$id]);

            // If the employee had no row (already gone), rowCount is 0 but that's fine.
            $this->pdo->commit();
            $this->handler->sendResponse(true, null, 'Employee deleted successfully');
        } catch (Exception $e) {
            $this->pdo->rollBack();
            $this->handler->sendResponse(false, null, 'Failed to delete employee: ' . $e->getMessage());
        }
    }
}
?>