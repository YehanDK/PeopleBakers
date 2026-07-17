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
        
        $sql = "SELECT o.order_id, o.order_date, o.total, o.status, 
                       COALESCE(c.customer_name, iso.customer_name, co.custome_name) AS customer_name,
                       c.customer_address, c.cust_phone_no, co.design_details, co.description, 
                       co.requested_date, o.status as cake_status,
                       CASE 
                           WHEN iso.order_id IS NOT NULL THEN 'InStore'
                           WHEN oo.order_id IS NOT NULL THEN 'Online'
                           WHEN co.order_id IS NOT NULL THEN 'Custom'
                       END AS order_type
                FROM `Order` o
                LEFT JOIN InStoreOrder iso ON o.order_id = iso.order_id
                LEFT JOIN OnlineOrder oo ON o.order_id = oo.order_id
                LEFT JOIN CakeOrder co ON o.order_id = co.order_id
                LEFT JOIN Customer c ON (oo.customer_id = c.customer_id OR co.customer_id = c.customer_id)";

        if ($type === 'online') $sql .= " WHERE oo.order_id IS NOT NULL";
        elseif ($type === 'instore') $sql .= " WHERE iso.order_id IS NOT NULL";
        elseif ($type === 'custom') $sql .= " WHERE co.order_id IS NOT NULL";
        
        $sql .= " ORDER BY o.order_date DESC";
        $orders = $this->pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($orders as &$order) {
            $stmt = $this->pdo->prepare("SELECT oi.quantity, oi.total AS price, p.product_name FROM OrderItem oi 
                                         LEFT JOIN Product p ON oi.product_id = p.product_id WHERE oi.order_id = ?");
            $stmt->execute([$order['order_id']]);
            $order['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        $this->handler->sendResponse(true, $orders);
    }

    public function get() {
        $id = $_GET['id'] ?? $_POST['id'] ?? 0;
        if (!$id) return $this->handler->sendResponse(false, null, 'Order ID required');
        
        $stmt = $this->pdo->prepare("SELECT o.*, co.design_details, co.description, o.status as cake_status FROM `Order` o LEFT JOIN CakeOrder co ON o.order_id = co.order_id WHERE o.order_id = ?");
        $stmt->execute([$id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$order) return $this->handler->sendResponse(false, null, 'Order not found');
        
        $stmt = $this->pdo->prepare("SELECT oi.*, p.product_name FROM OrderItem oi LEFT JOIN Product p ON oi.product_id = p.product_id WHERE oi.order_id = ?");
        $stmt->execute([$id]);
        $order['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $this->handler->sendResponse(true, $order);
    }

    public function create() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        
        $cust_id = $data['customer_id'] ?? null;
        $cust_name = $data['customer_name'] ?? null;
        $total = $data['total_amount'] ?? 0;
        $type = $data['order_type'] ?? 'InStore';
        $items = $data['items'] ?? [];
        $method = $data['payment_method'] ?? 'Cash';
        
        try {
            $this->pdo->beginTransaction();
            
            $stmt = $this->pdo->prepare("INSERT INTO Payment (payment_method, ammount, date) VALUES (?, ?, NOW())");
            $stmt->execute([$method, $total]);
            $payment_id = $this->pdo->lastInsertId();
            
            $stmt = $this->pdo->prepare("INSERT INTO `Order` (payment_id, order_date, total, status) VALUES (?, NOW(), ?, ?)");
            $stmt->execute([$payment_id, $total, ($type === 'InStore' ? 'Completed' : 'Pending')]);
            $order_id = $this->pdo->lastInsertId();
            
            if ($type === 'Custom') {
                // FIX: Removed 'status' field insertion since it no longer exists on CakeOrder table[cite: 11]
                $stmt = $this->pdo->prepare("INSERT INTO CakeOrder (order_id, customer_id, custome_name, phone_no, design_details, description, requested_date) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$order_id, $cust_id, $cust_name, $data['phone'] ?? null, $data['design_details'] ?? null, $data['description'] ?? null, $data['pickup_date'] ?? null]);
            } elseif ($type === 'Online') {
                $stmt = $this->pdo->prepare("INSERT INTO OnlineOrder (order_id, customer_id) VALUES (?, ?)");
                $stmt->execute([$order_id, $cust_id]);
            } else {
                $stmt = $this->pdo->prepare("INSERT INTO InStoreOrder (order_id, order_type, customer_name) VALUES (?, 'InStore', ?)");
                $stmt->execute([$order_id, $cust_name]);
            }
            
            foreach ($items as $item) {
                $stmt = $this->pdo->prepare("INSERT INTO OrderItem (product_id, order_id, quantity, total) VALUES (?, ?, ?, ?)");
                $stmt->execute([$item['product_id'], $order_id, $item['quantity'], $item['price'] * $item['quantity']]);
                $this->pdo->prepare("UPDATE Product SET quantity = quantity - ? WHERE product_id = ?")->execute([$item['quantity'], $item['product_id']]);
            }
            
            $this->pdo->commit();
            $this->handler->sendResponse(true, ['order_id' => $order_id], 'Order created successfully');
        } catch (Exception $e) {
            $this->pdo->rollBack();
            $this->handler->sendResponse(false, null, 'Error: ' . $e->getMessage());
        }
    }

    public function updateStatus() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $stmt = $this->pdo->prepare("UPDATE `Order` SET status = ? WHERE order_id = ?");
        $stmt->execute([$data['status'], $data['order_id']]);
        $this->handler->sendResponse(true, null, 'Status updated');
    }

    public function updateCakeStatus() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        // FIX: Routes custom cake state adjustments directly to parent Order validation framework[cite: 11]
        $stmt = $this->pdo->prepare("UPDATE `Order` SET status = ? WHERE order_id = ?");
        $stmt->execute([$data['status'], $data['order_id']]);
        $this->handler->sendResponse(true, null, 'Cake status updated');
    }

    public function update() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        try {
            $this->pdo->beginTransaction();
            // FIX: Split query to isolate CakeOrder modification parameters from main Order status constraints[cite: 11]
            $stmt = $this->pdo->prepare("UPDATE CakeOrder SET design_details = ?, description = ?, requested_date = ? WHERE order_id = ?");
            $stmt->execute([$data['design_details'], $data['description'], $data['pickup_date'], $data['order_id']]);
            
            $stmt2 = $this->pdo->prepare("UPDATE `Order` SET status = ? WHERE order_id = ?");
            $stmt2->execute([$data['status'], $data['order_id']]);
            
            $this->pdo->commit();
            $this->handler->sendResponse(true, null, 'Cake updated');
        } catch(Exception $e) {
            $this->pdo->rollBack();
            $this->handler->sendResponse(false, null, 'Error: ' . $e->getMessage());
        }
    }

    public function delete() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $stmt = $this->pdo->prepare("DELETE FROM `Order` WHERE order_id = ?");
        $stmt->execute([$data['id'] ?? $_GET['id']]);
        $this->handler->sendResponse(true, null, 'Order deleted');
    }

    public function getSalesData() {
        $duration = $_GET['duration'] ?? 'daily';
        $filter = ($duration === 'monthly') ? "MONTH(o.order_date) = MONTH(CURRENT_DATE())" : "DATE(o.order_date) = CURRENT_DATE()";
        
        $sql = "SELECT SUM(CASE WHEN iso.order_id IS NOT NULL THEN 1 ELSE 0 END) as in_store,
                       SUM(CASE WHEN co.order_id IS NOT NULL THEN 1 ELSE 0 END) as custom_cake,
                       SUM(CASE WHEN oo.order_id IS NOT NULL THEN 1 ELSE 0 END) as online,
                       SUM(o.total) as total_revenue
                FROM `Order` o
                LEFT JOIN InStoreOrder iso ON o.order_id = iso.order_id
                LEFT JOIN OnlineOrder oo ON o.order_id = oo.order_id
                LEFT JOIN CakeOrder co ON o.order_id = co.order_id
                WHERE $filter";
        $summary = $this->pdo->query($sql)->fetch(PDO::FETCH_ASSOC);
        
        $this->handler->sendResponse(true, ['summary' => $summary, 'analytics' => []]);
    }
}
?>