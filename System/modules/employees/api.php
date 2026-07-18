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
        $input = json_decode(file_get_contents('php://input'), true);
        $username = $_POST['username'] ?? $input['username'] ?? '';
        $password = $_POST['password'] ?? $input['password'] ?? '';

        if (empty($username) || empty($password)) {
            return $this->handler->sendResponse(false, null, 'Username and password required');
        }

        // Aliasing to maintain frontend compatibility with old 'employee_id', 'name', 'email' keys
        $stmt = $this->pdo->prepare("SELECT emp_id AS employee_id, emp_name AS name, username, password, emp_email AS email, emp_phone_no AS phone, employee_role AS role, emp_address AS address, base_salary AS basic_salary 
                                     FROM Employee WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || $user['password'] !== $password) {
            return $this->handler->sendResponse(false, null, 'Invalid username or password');
        }

        unset($user['password']);
        $this->handler->sendResponse(true, $user, 'Login successful');
    }

public function list() {
    // Uses a subquery to pull only the latest salary row per employee, ensuring exactly 1 row per unique individual
    $stmt = $this->pdo->query("
        SELECT e.emp_id AS employee_id, e.emp_name AS name, e.username, e.emp_email AS email, 
               e.emp_phone_no AS phone, e.employee_role AS role, e.emp_address AS address, 
               e.base_salary AS basic_salary, COALESCE(s.total, 0) as salary, s.created_date as payment_date
        FROM Employee e
        LEFT JOIN (
            SELECT emp_id, total, created_date
            FROM Salary
            WHERE salary_id IN (SELECT MAX(salary_id) FROM Salary GROUP BY emp_id)
        ) s ON e.emp_id = s.emp_id
    ");
    $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $this->handler->sendResponse(true, $employees);
}

    public function get() {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? $_POST['id'] ?? ($input['id'] ?? 0);
        if (!$id) {
            return $this->handler->sendResponse(false, null, 'Employee ID required');
        }

        $stmt = $this->pdo->prepare("SELECT emp_id AS employee_id, emp_name AS name, username, emp_email AS email, emp_phone_no AS phone, employee_role AS role, emp_address AS address, base_salary AS basic_salary FROM Employee WHERE emp_id = ?");
        $stmt->execute([$id]);
        $employee = $stmt->fetch(PDO::FETCH_ASSOC);

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
        $role = $data['role'] ?? ''; // e.g., 'salesassistant'
        $address = $data['address'] ?? '';

        if (empty($name) || empty($username) || empty($password) || empty($email) || empty($role)) {
            return $this->handler->sendResponse(false, null, 'Missing required fields');
        }

        // Format role to match the PascalCase subclass table names (e.g., SalesAssistant)[cite: 2]
        $formattedRole = str_replace(' ', '', ucwords(str_replace('_', ' ', $role)));
        
        $roleSalaries = ['SalesAssistant' => 25000, 'SalesSupervisor' => 40000, 'DeliveryEmployee' => 30000, 'InventoryManager' => 40000, 'FinanceManager' => 50000, 'EmployeeManager' => 50000, 'CompanyManager' => 50000];
        $salary = $roleSalaries[$formattedRole] ?? 45000;

        try {
            $this->pdo->beginTransaction();

            $stmt = $this->pdo->prepare("INSERT INTO Employee (emp_name, username, password, emp_email, emp_phone_no, employee_role, emp_address, base_salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$name, $username, $password, $email, $phone, $formattedRole, $address, $salary]);
            $id = $this->pdo->lastInsertId();

            // Insert into role-specific subclass[cite: 2]
            $stmtSub = $this->pdo->prepare("INSERT INTO $formattedRole (emp_id) VALUES (?)");
            $stmtSub->execute([$id]);

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
    if (!$id) return $this->handler->sendResponse(false, null, 'Employee ID required');
    
    $fields = []; 
    $params = [];
    
    // FIX: Added 'basic_salary' mapping to match the 'base_salary' database column description
    $mapping = [
        'name'         => 'emp_name', 
        'email'        => 'emp_email', 
        'phone'        => 'emp_phone_no', 
        'address'      => 'emp_address',
        'basic_salary' => 'base_salary'
    ];
    
    foreach ($mapping as $frontendKey => $dbCol) {
        if (isset($data[$frontendKey])) {
            $fields[] = "$dbCol = ?";
            $params[] = $data[$frontendKey];
        }
    }
    
    if (isset($data['password']) && !empty($data['password'])) {
        $fields[] = "password = ?";
        $params[] = $data['password'];
    }
    
    if (empty($fields)) return $this->handler->sendResponse(false, null, 'No fields to update');
    
    $params[] = $id;
    $stmt = $this->pdo->prepare("UPDATE Employee SET " . implode(', ', $fields) . " WHERE emp_id = ?");
    $stmt->execute($params);
    $this->handler->sendResponse(true, null, 'Employee updated successfully');
}

    public function delete() {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? $_POST['id'] ?? ($input['id'] ?? 0);

        if (!$id) return $this->handler->sendResponse(false, null, 'Employee ID required');

        try {
            // Cascade handles subclass and HR record cleanup[cite: 2]
            $stmt = $this->pdo->prepare("DELETE FROM Employee WHERE emp_id = ?");
            $stmt->execute([$id]);
            $this->handler->sendResponse(true, null, 'Employee deleted successfully');
        } catch (Exception $e) {
            $this->handler->sendResponse(false, null, 'Failed to delete employee: ' . $e->getMessage());
        }
    }
}
?>