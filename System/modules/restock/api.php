<?php
// modules/restock/api.php

class RestockAPI {
    private $pdo;
    private $handler;
    
    public function __construct($pdo, $handler) {
        $this->pdo = $pdo;
        $this->handler = $handler;
    }
    
    public function list() {
        $stmt = $this->pdo->query("SELECT r.*, p.name as product_name, s.name as supplier_name 
                                   FROM restock_records r 
                                   LEFT JOIN products p ON r.product_id = p.product_id 
                                   LEFT JOIN suppliers s ON r.supplier_id = s.supplier_id 
                                   ORDER BY r.restock_date DESC");
        $records = $stmt->fetchAll();
        $this->handler->sendResponse(true, $records);
    }
    
    public function create() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        
        $product_id = $data['product_id'] ?? 0;
        $supplier_id = $data['supplier_id'] ?? 0;
        $quantity = $data['quantity'] ?? 0;
        $unit_cost = $data['unit_cost'] ?? 0;
        $restock_date = $data['restock_date'] ?? date('Y-m-d');
        $notes = $data['notes'] ?? '';
        
        if (!$product_id || !$supplier_id || $quantity <= 0 || $unit_cost <= 0) {
            return $this->handler->sendResponse(false, null, 'Missing required fields');
        }
        
        try {
            $this->pdo->beginTransaction();
            
            $stmt = $this->pdo->prepare("INSERT INTO restock_records (product_id, supplier_id, quantity, unit_cost, restock_date, notes) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$product_id, $supplier_id, $quantity, $unit_cost, $restock_date, $notes]);
            
            // Update product stock
            $stmt = $this->pdo->prepare("UPDATE products SET stock_qty = stock_qty + ? WHERE product_id = ?");
            $stmt->execute([$quantity, $product_id]);
            
            $this->pdo->commit();
            $this->handler->sendResponse(true, null, 'Restock recorded successfully');
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            $this->handler->sendResponse(false, null, 'Failed to record restock: ' . $e->getMessage());
        }
    }
    
    public function update() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $id = $data['restock_id'] ?? $_GET['id'] ?? 0;
        
        if (!$id) {
            return $this->handler->sendResponse(false, null, 'Restock ID required');
        }
        
        $fields = [];
        $params = [];
        
        $allowed = ['supplier_id', 'quantity', 'unit_cost', 'restock_date', 'notes'];
        foreach ($allowed as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($fields)) {
            return $this->handler->sendResponse(false, null, 'No fields to update');
        }
        
        $params[] = $id;
        $sql = "UPDATE restock_records SET " . implode(', ', $fields) . " WHERE restock_id = ?";
        $stmt = $this->pdo->prepare($sql);
        $result = $stmt->execute($params);
        
        if ($result) {
            $this->handler->sendResponse(true, null, 'Restock updated successfully');
        } else {
            $this->handler->sendResponse(false, null, 'Failed to update restock');
        }
    }
    
    public function delete() {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? $_POST['id'] ?? ($input['id'] ?? 0);
        
        if (!$id) {
            return $this->handler->sendResponse(false, null, 'Restock ID required');
        }
        
        $stmt = $this->pdo->prepare("DELETE FROM restock_records WHERE restock_id = ?");
        $result = $stmt->execute([$id]);
        
        if ($result) {
            $this->handler->sendResponse(true, null, 'Restock deleted successfully');
        } else {
            $this->handler->sendResponse(false, null, 'Failed to delete restock');
        }
    }
    
    public function suppliers() {
        $stmt = $this->pdo->query("SELECT * FROM suppliers ORDER BY name");
        $suppliers = $stmt->fetchAll();
        $this->handler->sendResponse(true, $suppliers);
    }
}
?>