<?php
// modules/inventory/api.php

class InventoryAPI {
    private $pdo;
    private $handler;
    
    public function __construct($pdo, $handler) {
        $this->pdo = $pdo;
        $this->handler = $handler;
    }
    
    public function list() {
        $stmt = $this->pdo->query("SELECT p.*, c.category_name FROM products p LEFT JOIN product_categories c ON p.category_id = c.category_id");
        $products = $stmt->fetchAll();
        $this->handler->sendResponse(true, $products);
    }
    
    public function get() {
        $id = $_GET['id'] ?? $_POST['id'] ?? 0;
        if (!$id) {
            return $this->handler->sendResponse(false, null, 'Product ID required');
        }
        
        $stmt = $this->pdo->prepare("SELECT p.*, c.category_name FROM products p LEFT JOIN product_categories c ON p.category_id = c.category_id WHERE p.product_id = ?");
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        
        if (!$product) {
            return $this->handler->sendResponse(false, null, 'Product not found');
        }
        
        $this->handler->sendResponse(true, $product);
    }
    
    public function create() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        
        $name = $data['name'] ?? '';
        $price = $data['price'] ?? 0;
        $stock_qty = $data['stock_qty'] ?? 0;
        $category_id = $data['category_id'] ?? null;
        
        if (empty($name) || empty($price)) {
            return $this->handler->sendResponse(false, null, 'Name and price are required');
        }
        
        $stmt = $this->pdo->prepare("INSERT INTO products (name, price, stock_qty, category_id) VALUES (?, ?, ?, ?)");
        $result = $stmt->execute([$name, $price, $stock_qty, $category_id]);
        
        if ($result) {
            $id = $this->pdo->lastInsertId();
            $this->handler->sendResponse(true, ['product_id' => $id], 'Product created successfully');
        } else {
            $this->handler->sendResponse(false, null, 'Failed to create product');
        }
    }
    
    public function update() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $id = $data['product_id'] ?? $_GET['id'] ?? 0;
        
        if (!$id) {
            return $this->handler->sendResponse(false, null, 'Product ID required');
        }
        
        $fields = [];
        $params = [];
        
        $allowed = ['name', 'price', 'stock_qty', 'category_id'];
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
        $sql = "UPDATE products SET " . implode(', ', $fields) . " WHERE product_id = ?";
        $stmt = $this->pdo->prepare($sql);
        $result = $stmt->execute($params);
        
        if ($result) {
            $this->handler->sendResponse(true, null, 'Product updated successfully');
        } else {
            $this->handler->sendResponse(false, null, 'Failed to update product');
        }
    }
    
    public function delete() {
        $id = $_GET['id'] ?? $_POST['id'] ?? 0;
        
        if (!$id) {
            return $this->handler->sendResponse(false, null, 'Product ID required');
        }
        
        $stmt = $this->pdo->prepare("DELETE FROM products WHERE product_id = ?");
        $result = $stmt->execute([$id]);
        
        if ($result) {
            $this->handler->sendResponse(true, null, 'Product deleted successfully');
        } else {
            $this->handler->sendResponse(false, null, 'Failed to delete product');
        }
    }
    
    public function alerts() {
        $this->syncStockAlerts();
        $stmt = $this->pdo->query("SELECT a.*, p.name AS product_name FROM stock_alerts a LEFT JOIN products p ON a.product_id = p.product_id WHERE a.status = 'unread' ORDER BY a.created_at DESC");
        $alerts = $stmt->fetchAll();
        $this->handler->sendResponse(true, $alerts);
    }

    private function syncStockAlerts() {
        $stmt = $this->pdo->query("SELECT product_id, name, stock_qty FROM products");
        $products = $stmt->fetchAll();

        foreach ($products as $product) {
            $stock = (int) ($product['stock_qty'] ?? 0);
            $isCritical = $stock < 5;
            $isLow = $stock < 15 && $stock >= 5;

            if (!$isCritical && !$isLow) {
                $this->pdo->prepare("UPDATE stock_alerts SET status = 'read' WHERE product_id = ? AND status = 'unread'")->execute([$product['product_id']]);
                continue;
            }

            $message = $isCritical
                ? "Critical stock: {$product['name']} has {$stock} units left"
                : "Low stock: {$product['name']} has {$stock} units left";

            $check = $this->pdo->prepare("SELECT alert_id FROM stock_alerts WHERE product_id = ? AND status = 'unread' ORDER BY created_at DESC LIMIT 1");
            $check->execute([$product['product_id']]);
            $existing = $check->fetch();

            if (!$existing) {
                $insert = $this->pdo->prepare("INSERT INTO stock_alerts (product_id, message, status) VALUES (?, ?, 'unread')");
                $insert->execute([$product['product_id'], $message]);
            }
        }
    }
}
?>