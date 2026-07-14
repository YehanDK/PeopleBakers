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

        $sql = "SELECT s.*, e.name as employee_name FROM salaries s
                LEFT JOIN employees e ON s.employee_id = e.employee_id";

        if ($employee_id) {
            $sql .= " WHERE s.employee_id = ?";
            $stmt = $this->pdo->prepare($sql . " ORDER BY s.payment_date DESC");
            $stmt->execute([$employee_id]);
        } else {
            $stmt = $this->pdo->query($sql . " ORDER BY s.payment_date DESC");
        }

        $salaries = $stmt->fetchAll();
        $this->handler->sendResponse(true, $salaries);
    }

    public function create() {
        $input = json_decode(file_get_contents('php://input'), true);
        $data = $input ?: $_POST;

        $employee_id = $data['employee_id'] ?? 0;
        $amount = $data['amount'] ?? 0;
        $payment_date = $data['payment_date'] ?? date('Y-m-d');
        $status = $data['status'] ?? 'Pending';

        if (!$employee_id || $amount <= 0) {
            return $this->handler->sendResponse(false, null, 'Employee and a valid amount are required');
        }

        if (!in_array($status, ['Pending', 'Paid'])) {
            $status = 'Pending';
        }

        $stmt = $this->pdo->prepare("INSERT INTO salaries (employee_id, amount, payment_date, status) VALUES (?, ?, ?, ?)");
        $result = $stmt->execute([$employee_id, $amount, $payment_date, $status]);

        if ($result) {
            $id = $this->pdo->lastInsertId();
            $this->handler->sendResponse(true, ['salary_id' => $id], 'Salary saved successfully');
        } else {
            $this->handler->sendResponse(false, null, 'Failed to save salary');
        }
    }

    public function updateStatus() {
        $input = json_decode(file_get_contents('php://input'), true);
        $data = $input ?: $_POST;
        $id = $data['salary_id'] ?? $_GET['id'] ?? 0;
        $status = $data['status'] ?? '';

        if (!$id || empty($status)) {
            return $this->handler->sendResponse(false, null, 'Salary ID and status are required');
        }

        if (!in_array($status, ['Pending', 'Paid'])) {
            return $this->handler->sendResponse(false, null, 'Invalid status');
        }

        $stmt = $this->pdo->prepare("UPDATE salaries SET status = ? WHERE salary_id = ?");
        $result = $stmt->execute([$status, $id]);

        if ($result) {
            $this->handler->sendResponse(true, null, 'Salary status updated successfully');
        } else {
            $this->handler->sendResponse(false, null, 'Failed to update salary status');
        }
    }

    public function delete() {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? $_POST['id'] ?? ($input['id'] ?? 0);

        if (!$id) {
            return $this->handler->sendResponse(false, null, 'Salary ID required');
        }

        $stmt = $this->pdo->prepare("DELETE FROM salaries WHERE salary_id = ?");
        $result = $stmt->execute([$id]);

        if ($result) {
            $this->handler->sendResponse(true, null, 'Salary record deleted successfully');
        } else {
            $this->handler->sendResponse(false, null, 'Failed to delete salary record');
        }
    }
}
?>
