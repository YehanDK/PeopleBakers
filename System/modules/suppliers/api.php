<?php
// modules/suppliers/api.php

class SuppliersAPI {
    private $pdo;
    private $handler;

    public function __construct($pdo, $handler) {
        $this->pdo = $pdo;
        $this->handler = $handler;
    }

    public function list() {
        // FIX: Targets singular table 'Supplier' and maps 'supplier_name' to 'name' for the frontend
        $stmt = $this->pdo->query("SELECT supplier_id, supplier_name AS name FROM Supplier ORDER BY supplier_name");
        $this->handler->sendResponse(true, $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function create() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $name = $data['name'] ?? $data['supplier_name'] ?? '';

        if (empty($name)) {
            return $this->handler->sendResponse(false, null, 'Supplier name is required');
        }

        // FIX: Targets new 'Supplier' table structure and its unique columns
        $stmt = $this->pdo->prepare("INSERT INTO Supplier (supplier_name) VALUES (?)");
        $result = $stmt->execute([$name]);

        if ($result) {
            return $this->handler->sendResponse(true, ['supplier_id' => $this->pdo->lastInsertId()], 'Supplier created successfully');
        }

        $this->handler->sendResponse(false, null, 'Failed to create supplier');
    }

    public function update() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $id = $data['supplier_id'] ?? 0;
        $name = $data['name'] ?? $data['supplier_name'] ?? null;

        if (!$id) {
            return $this->handler->sendResponse(false, null, 'Supplier ID required');
        }

        if ($name === null) {
            return $this->handler->sendResponse(false, null, 'No fields to update');
        }

        // FIX: Targets 'Supplier' table and sets 'supplier_name'
        $stmt = $this->pdo->prepare("UPDATE Supplier SET supplier_name = ? WHERE supplier_id = ?");
        $result = $stmt->execute([$name, $id]);

        if ($result) {
            return $this->handler->sendResponse(true, null, 'Supplier updated successfully');
        }

        $this->handler->sendResponse(false, null, 'Failed to update supplier');
    }

    public function delete() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $id = $data['id'] ?? $_GET['id'] ?? $_POST['id'] ?? 0;
        
        if (!$id) {
            return $this->handler->sendResponse(false, null, 'Supplier ID required');
        }

        // FIX: Targets uppercase singular table name
        $stmt = $this->pdo->prepare("DELETE FROM Supplier WHERE supplier_id = ?");
        $result = $stmt->execute([$id]);

        if ($result) {
            return $this->handler->sendResponse(true, null, 'Supplier deleted successfully');
        }

        $this->handler->sendResponse(false, null, 'Failed to delete supplier');
    }
}
?>