<?php
// modules/orders/api.php

class OrdersAPI {
    private $pdo;
    private $handler;
    
    public function __construct($pdo, $handler) {
        $this->pdo = $pdo;
        $this->handler = $handler;
    }
    
    public function list() {
        $type = $_GET['type'] ?? $_POST['type'] ?? 'all';
        
        $sql = "SELECT o.*, c.name as customer_name, cco.design_details, cco.description, cco.pickup_date FROM orders o 
                LEFT JOIN customers c ON o.customer_id = c.customer_id
                LEFT JOIN custom_cake_orders cco ON o.order_id = cco.order_id";
        
        if ($type === 'online') {
            $sql .= " WHERE o.order_type = 'Online'";
        } elseif ($type === 'instore') {
            $sql .= " WHERE o.order_type = 'InStore'";
        } elseif ($type === 'custom') {
            $sql .= " WHERE o.order_type = 'Custom'";
        }
        
        $sql .= " ORDER BY o.order_date DESC";
        
        $stmt = $this->pdo->query($sql);
        $orders = $stmt->fetchAll();
        
        foreach ($orders as &$order) {
            $stmt = $this->pdo->prepare("SELECT oi.*, p.name as product_name FROM order_items oi 
                                         LEFT JOIN products p ON oi.product_id = p.product_id 
                                         WHERE oi.order_id = ?");
            $stmt->execute([$order['order_id']]);
            $order['items'] = $stmt->fetchAll();
        }
        
        $this->handler->sendResponse(true, $orders);
    }
    
    public function get() {
        $id = $_GET['id'] ?? $_POST['id'] ?? 0;
        if (!$id) {
            return $this->handler->sendResponse(false, null, 'Order ID required');
        }
        
        $stmt = $this->pdo->prepare("SELECT o.*, c.name as customer_name FROM orders o 
                                     LEFT JOIN customers c ON o.customer_id = c.customer_id 
                                     WHERE o.order_id = ?");
        $stmt->execute([$id]);
        $order = $stmt->fetch();
        
        if (!$order) {
            return $this->handler->sendResponse(false, null, 'Order not found');
        }
        
        $stmt = $this->pdo->prepare("SELECT oi.*, p.name as product_name FROM order_items oi 
                                     LEFT JOIN products p ON oi.product_id = p.product_id 
                                     WHERE oi.order_id = ?");
        $stmt->execute([$id]);
        $order['items'] = $stmt->fetchAll();
        
        $this->handler->sendResponse(true, $order);
    }
    
public function create() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        
        $customer_id = $data['customer_id'] ?? null;
        $customer_name = $data['customer_name'] ?? null;
        $total_amount = $data['total_amount'] ?? 0;
        $order_type = $data['order_type'] ?? 'InStore';
        $items = $data['items'] ?? [];
        $design_details = $data['design_details'] ?? null;
        $description = $data['description'] ?? null;
        $pickup_date = $data['pickup_date'] ?? null;
        
        // NEW: Grab payment details from payload
        $payment_method = $data['payment_method'] ?? 'Online'; 
        $payment_status = ($payment_method === 'Card') ? 'Completed' : 'Pending';

        if ($order_type === 'Custom') {
            $items = [];
            $total_amount = 0;
        } elseif (empty($items) || $total_amount <= 0) {
            return $this->handler->sendResponse(false, null, 'Order must have items and valid total');
        }
        
        try {
            $this->pdo->beginTransaction();
            
            // 1. Insert order record
            $stmt = $this->pdo->prepare("INSERT INTO orders (customer_id, customer_name, total_amount, order_type, status) VALUES (?, ?, ?, ?, 'Pending')");
            $stmt->execute([$customer_id, $customer_name, $total_amount, $order_type]);
            $order_id = $this->pdo->lastInsertId();
            
            // 2. Handle specific type processing routes
            if ($order_type === 'Custom') {
                $stmt = $this->pdo->prepare("INSERT INTO custom_cake_orders (order_id, design_details, description, pickup_date) VALUES (?, ?, ?, ?)");
                $stmt->execute([$order_id, $design_details, $description, $pickup_date]);
            } else {
                foreach ($items as $item) {
                    $stmt = $this->pdo->prepare("INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES (?, ?, ?, ?)");
                    $stmt->execute([$order_id, $item['product_id'], $item['quantity'], $item['price']]);
                    
                    $stmt = $this->pdo->prepare("UPDATE products SET stock_qty = stock_qty - ? WHERE product_id = ?");
                    $stmt->execute([$item['quantity'], $item['product_id']]);
                }
            }
            
            // 3. NEW: Record Payment Entry into payments table mapping to schema requirements
            $stmt = $this->pdo->prepare("INSERT INTO payments (order_id, method, amount, status) VALUES (?, ?, ?, ?)");
            $stmt->execute([$order_id, $payment_method, $total_amount, $payment_status]);
            
            $this->pdo->commit();
            $this->handler->sendResponse(true, ['order_id' => $order_id], 'Order and payment recorded successfully');
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            $this->handler->sendResponse(false, null, 'Failed to create order: ' . $e->getMessage());
        }
    }
        
    public function updateStatus() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $id = $data['order_id'] ?? $_GET['id'] ?? 0;
        $status = $data['status'] ?? '';
        
        if (!$id || empty($status)) {
            return $this->handler->sendResponse(false, null, 'Order ID and status are required');
        }
        
        $allowed = ['Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Completed', 'Cancelled', 'Rejected'];
        if (!in_array($status, $allowed)) {
            return $this->handler->sendResponse(false, null, 'Invalid status');
        }
        
        $stmt = $this->pdo->prepare("UPDATE orders SET status = ? WHERE order_id = ?");
        $result = $stmt->execute([$status, $id]);
        
        if ($result) {
            $this->handler->sendResponse(true, null, 'Order status updated successfully');
        } else {
            $this->handler->sendResponse(false, null, 'Failed to update order status');
        }
    }
}
?>