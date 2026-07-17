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
        $stmt = $this->pdo->query("SELECT p.product_id, p.product_name AS name, p.price, p.quantity AS stock_qty, c.category_name AS category, p.category_id 
                                   FROM Product p 
                                   LEFT JOIN ProductCategory c ON p.category_id = c.category_id");
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $this->handler->sendResponse(true, $products);
    }
    
    public function get() {
        $id = $_GET['id'] ?? $_POST['id'] ?? 0;
        if (!$id) return $this->handler->sendResponse(false, null, 'Product ID required');
        
        $stmt = $this->pdo->prepare("SELECT p.product_id, p.product_name AS name, p.price, p.quantity AS stock_qty, c.category_name AS category 
                                     FROM Product p 
                                     LEFT JOIN ProductCategory c ON p.category_id = c.category_id 
                                     WHERE p.product_id = ?");
        $stmt->execute([$id]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$product) return $this->handler->sendResponse(false, null, 'Product not found');
        
        $this->handler->sendResponse(true, $product);
    }
    
    public function create() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        
        $name = $data['name'] ?? '';
        $price = $data['price'] ?? 0;
        $stock = $data['stock_qty'] ?? 0;
        $cat_id = $data['category_id'] ?? null;
        
        if (empty($name) || empty($price)) return $this->handler->sendResponse(false, null, 'Name and price are required');
        
        $stmt = $this->pdo->prepare("INSERT INTO Product (product_name, price, quantity, category_id) VALUES (?, ?, ?, ?)");
        $result = $stmt->execute([$name, $price, $stock, $cat_id]);
        
        if ($result) {
            $this->handler->sendResponse(true, ['product_id' => $this->pdo->lastInsertId()], 'Product created successfully');
        } else {
            $this->handler->sendResponse(false, null, 'Failed to create product');
        }
    }
    
    public function update() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $id = $data['product_id'] ?? $_GET['id'] ?? 0;
        
        if (!$id) return $this->handler->sendResponse(false, null, 'Product ID required');
        
        $fields = []; $params = [];
        if (isset($data['name'])) { $fields[] = "product_name = ?"; $params[] = $data['name']; }
        if (isset($data['price'])) { $fields[] = "price = ?"; $params[] = $data['price']; }
        if (isset($data['stock_qty'])) { $fields[] = "quantity = ?"; $params[] = $data['stock_qty']; }
        if (isset($data['category_id'])) { $fields[] = "category_id = ?"; $params[] = $data['category_id']; }
        
        if (empty($fields)) return $this->handler->sendResponse(false, null, 'No fields to update');
        
        $params[] = $id;
        $stmt = $this->pdo->prepare("UPDATE Product SET " . implode(', ', $fields) . " WHERE product_id = ?");
        
        if ($stmt->execute($params)) {
            $this->handler->sendResponse(true, null, 'Product updated successfully');
        } else {
            $this->handler->sendResponse(false, null, 'Failed to update product');
        }
    }

    public function delete() {
        $id = $_GET['id'] ?? $_POST['id'] ?? 0;
        if (!$id) return $this->handler->sendResponse(false, null, 'Product ID required');
        
        try {
            // Relational cleanup handled by ON DELETE CASCADE in schema[cite: 2]
            $stmt = $this->pdo->prepare("DELETE FROM Product WHERE product_id = ?");
            if ($stmt->execute([$id])) {
                $this->handler->sendResponse(true, null, 'Product deleted successfully');
            } else {
                $this->handler->sendResponse(false, null, 'Failed to delete product');
            }
        } catch (Exception $e) {
            $this->handler->sendResponse(false, null, 'Failed to delete product: ' . $e->getMessage());
        }
    }
    
    public function alerts() {
        $this->syncStockAlerts();
        $stmt = $this->pdo->query("SELECT a.alert_id, a.product_id, a.message, a.alert_status AS status, p.product_name AS product_name 
                                   FROM StockAlert a 
                                   LEFT JOIN Product p ON a.product_id = p.product_id 
                                   WHERE a.alert_status = 'unread'");
        $this->handler->sendResponse(true, $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    private function syncStockAlerts() {
        $stmt = $this->pdo->query("SELECT product_id, product_name, quantity FROM Product");
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($products as $product) {
            $stock = (int) ($product['quantity'] ?? 0);
            $isCritical = $stock < 5;
            $isLow = $stock < 15 && $stock >= 5;

            if (!$isCritical && !$isLow) {
                $this->pdo->prepare("UPDATE StockAlert SET alert_status = 'read' WHERE product_id = ? AND alert_status = 'unread'")->execute([$product['product_id']]);
                continue;
            }

            $message = $isCritical
                ? "Critical stock: {$product['product_name']} has {$stock} units left"
                : "Low stock: {$product['product_name']} has {$stock} units left";

            $check = $this->pdo->prepare("SELECT alert_id FROM StockAlert WHERE product_id = ? AND alert_status = 'unread' LIMIT 1");
            $check->execute([$product['product_id']]);
            
            if (!$check->fetch()) {
                $insert = $this->pdo->prepare("INSERT INTO StockAlert (product_id, message, alert_status) VALUES (?, ?, 'unread')");
                $insert->execute([$product['product_id'], $message]);
            }
        }
    }
}
?>