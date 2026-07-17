<?php
// modules/salary/api.php

class SalaryAPI {
    private $pdo;
    private $handler;

    public function __construct($pdo, $handler) {
        $this->pdo = $pdo;
        $this->handler = $handler;
    }

    public function list() {
        $employee_id = $_GET['employee_id'] ?? $_POST['employee_id'] ?? null;
        if ($employee_id === 'undefined' || $employee_id === 'null' || $employee_id === '') {
            $employee_id = null;
        }
        
        // REMOVED: 'Paid' AS status column
        $sql = "SELECT s.salary_id, s.emp_id AS employee_id, s.base_salary, s.bonus, s.total AS amount, 
                       s.created_date AS payment_date, s.month, e.emp_name as employee_name 
                FROM Salary s
                LEFT JOIN Employee e ON s.emp_id = s.emp_id";

        if ($employee_id) {
            $sql .= " WHERE s.emp_id = ?";
            $stmt = $this->pdo->prepare($sql . " ORDER BY s.created_date DESC");
            $stmt->execute([$employee_id]);
        } else {
            $stmt = $this->pdo->query($sql . " ORDER BY s.created_date DESC");
        }

        $salaries = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $this->handler->sendResponse(true, $salaries);
    }

    public function create() {
        $input = json_decode(file_get_contents('php://input'), true);
        $data = $input ?: $_POST;

        $emp_id = $data['employee_id'] ?? 0;
        $total = $data['amount'] ?? 0;
        $created_date = $data['payment_date'] ?? date('Y-m-d');
        $month = date('F', strtotime($created_date));

        if (!$emp_id || $total <= 0) {
            return $this->handler->sendResponse(false, null, 'Employee and a valid amount are required');
        }

        try {
            $this->pdo->beginTransaction();

            $empStmt = $this->pdo->prepare("SELECT base_salary FROM Employee WHERE emp_id = ?");
            $empStmt->execute([$emp_id]);
            $employee = $empStmt->fetch(PDO::FETCH_ASSOC);
            
            $base_salary = $employee ? (float)$employee['base_salary'] : $total;
            $bonus = $total - $base_salary;

            $stmt = $this->pdo->prepare("INSERT INTO Salary (emp_id, created_date, base_salary, bonus, total, month) VALUES (?, ?, ?, ?, ?, ?)");
            $result = $stmt->execute([$emp_id, $created_date, $base_salary, $bonus, $total, $month]);

            $this->pdo->commit();
            
            if ($result) {
                $id = $this->pdo->lastInsertId();
                $this->handler->sendResponse(true, ['salary_id' => $id], 'Salary saved successfully');
            } else {
                $this->handler->sendResponse(false, null, 'Failed to save salary');
            }
        } catch (Exception $e) {
            $this->pdo->rollBack();
            $this->handler->sendResponse(false, null, 'Failed to save salary: ' . $e->getMessage());
        }
    }

    // REMOVED: Entire updateStatus() method block[cite: 11]

    public function delete() {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? $_POST['id'] ?? ($input['id'] ?? 0);

        if (!$id) {
            return $this->handler->sendResponse(false, null, 'Salary ID required');
        }

        $stmt = $this->pdo->prepare("DELETE FROM Salary WHERE salary_id = ?");
        $result = $stmt->execute([$id]);

        if ($result) {
            $this->handler->sendResponse(true, null, 'Salary record deleted successfully');
        } else {
            $this->handler->sendResponse(false, null, 'Failed to delete salary record');
        }
    }
}
?>