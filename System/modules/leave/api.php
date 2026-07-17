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
        
        // Updated table names and aliased columns to match frontend expectations[cite: 2, 7]
        $sql = "SELECT l.leave_request_id AS leave_id, l.emp_id AS employee_id, l.leave_type AS type, 
                       l.leave_start AS from_date, l.leave_end AS to_date, l.purpose AS reason, 
                       'Pending' AS status, e.emp_name AS employee_name 
                FROM LeaveRequest l 
                LEFT JOIN Employee e ON l.emp_id = e.emp_id";
        
        if ($employee_id) {
            $sql .= " WHERE l.emp_id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$employee_id]);
        } else {
            $stmt = $this->pdo->query($sql);
        }
        
        $leaves = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $this->handler->sendResponse(true, $leaves);
    }
    
    public function create() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        
        $emp_id = $data['employee_id'] ?? 0;
        $type = $data['type'] ?? '';
        $start = $data['from_date'] ?? '';
        $end = $data['to_date'] ?? '';
        $purpose = $data['reason'] ?? '';
        
        if (!$emp_id || empty($type) || empty($start) || empty($end)) {
            return $this->handler->sendResponse(false, null, 'Missing required fields');
        }
        
        // Insert into updated table name and column names[cite: 2]
        $stmt = $this->pdo->prepare("INSERT INTO LeaveRequest (emp_id, leave_type, leave_start, leave_end, purpose) VALUES (?, ?, ?, ?, ?)");
        $result = $stmt->execute([$emp_id, $type, $start, $end, $purpose]);
        
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
    
    // FIX: Swapped column descriptor from status to leave_status
    $stmt = $this->pdo->prepare("UPDATE LeaveRequest SET leave_status = ? WHERE leave_request_id = ?");
    $result = $stmt->execute([$status, $id]);
    
    if ($result) {
        $this->handler->sendResponse(true, null, 'Leave status updated successfully');
    } else {
        $this->handler->sendResponse(false, null, 'Failed to update leave status');
    }
}
}
?>