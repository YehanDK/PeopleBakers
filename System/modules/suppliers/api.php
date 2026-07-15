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
        $stmt = $this->pdo->query("SELECT * FROM suppliers ORDER BY name");
        $this->handler->sendResponse(true, $stmt->fetchAll());
    }

    public function create() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $name = $data['name'] ?? '';
        $contact = $data['contact'] ?? '';

        if (empty($name)) {
            return $this->handler->sendResponse(false, null, 'Supplier name is required');
        }

        $stmt = $this->pdo->prepare("INSERT INTO suppliers (name, contact) VALUES (?, ?)");
        $result = $stmt->execute([$name, $contact]);

        if ($result) {
            $this->handler->sendResponse(true, ['supplier_id' => $this->pdo->lastInsertId()], 'Supplier created successfully');
        }

        $this->handler->sendResponse(false, null, 'Failed to create supplier');
    }

    public function update() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $id = $data['supplier_id'] ?? 0;

        if (!$id) {
            return $this->handler->sendResponse(false, null, 'Supplier ID required');
        }

        $fields = [];
        $params = [];
        foreach (['name', 'contact'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }

        if (empty($fields)) {
            return $this->handler->sendResponse(false, null, 'No fields to update');
        }

        $params[] = $id;
        $stmt = $this->pdo->prepare("UPDATE suppliers SET " . implode(', ', $fields) . " WHERE supplier_id = ?");
        $result = $stmt->execute($params);

        if ($result) {
            return $this->handler->sendResponse(true, null, 'Supplier updated successfully');
        }

        $this->handler->sendResponse(false, null, 'Failed to update supplier');
    }

    public function delete() {
        $id = $_GET['id'] ?? $_POST['id'] ?? 0;
        if (!$id) {
            return $this->handler->sendResponse(false, null, 'Supplier ID required');
        }

        $stmt = $this->pdo->prepare("DELETE FROM suppliers WHERE supplier_id = ?");
        $result = $stmt->execute([$id]);

        if ($result) {
            return $this->handler->sendResponse(true, null, 'Supplier deleted successfully');
        }

        $this->handler->sendResponse(false, null, 'Failed to delete supplier');
    }
}
?>