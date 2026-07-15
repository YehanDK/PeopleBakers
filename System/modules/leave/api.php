<?php
// modules/leave/api.php

class LeaveAPI {
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
        
        $sql = "SELECT l.*, e.name as employee_name FROM leaves l 
                LEFT JOIN employees e ON l.employee_id = e.employee_id";
        
        if ($employee_id) {
            $sql .= " WHERE l.employee_id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$employee_id]);
        } else {
            $stmt = $this->pdo->query($sql);
        }
        
        $leaves = $stmt->fetchAll();
        $this->handler->sendResponse(true, $leaves);
    }
    
    public function create() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        
        $employee_id = $data['employee_id'] ?? 0;
        $type = $data['type'] ?? '';
        $from_date = $data['from_date'] ?? '';
        $to_date = $data['to_date'] ?? '';
        $reason = $data['reason'] ?? '';
        
        if (!$employee_id || empty($type) || empty($from_date) || empty($to_date)) {
            return $this->handler->sendResponse(false, null, 'Missing required fields');
        }
        
        $stmt = $this->pdo->prepare("INSERT INTO leaves (employee_id, type, from_date, to_date, reason, status) VALUES (?, ?, ?, ?, ?, 'Pending')");
        $result = $stmt->execute([$employee_id, $type, $from_date, $to_date, $reason]);
        
        if ($result) {
            $id = $this->pdo->lastInsertId();
            $this->handler->sendResponse(true, ['leave_id' => $id], 'Leave request submitted successfully');
        } else {
            $this->handler->sendResponse(false, null, 'Failed to submit leave request');
        }
    }
    
    public function updateStatus() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $id = $data['leave_id'] ?? $_GET['id'] ?? 0;
        $status = $data['status'] ?? '';
        
        if (!$id || empty($status)) {
            return $this->handler->sendResponse(false, null, 'Leave ID and status are required');
        }
        
        $allowed = ['Pending', 'Approved', 'Rejected'];
        if (!in_array($status, $allowed)) {
            return $this->handler->sendResponse(false, null, 'Invalid status');
        }
        
        $stmt = $this->pdo->prepare("UPDATE leaves SET status = ? WHERE leave_id = ?");
        $result = $stmt->execute([$status, $id]);
        
        if ($result) {
            $this->handler->sendResponse(true, null, 'Leave status updated successfully');
        } else {
            $this->handler->sendResponse(false, null, 'Failed to update leave status');
        }
    }
}
?>