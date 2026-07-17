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
        
        // NOTE: o.* already contains o.customer_name. Aliasing c.name as customer_name here
        // used to silently overwrite it with NULL for walk-in/custom orders (no customer_id).
        // COALESCE keeps the walk-in name when there's no linked customer record.
        $sql = "SELECT o.*, COALESCE(o.customer_name, c.name) as customer_name, COALESCE(oo.delivery_address, c.address) as address, c.phone as customer_phone, cco.phone, cco.design_details, cco.description, cco.pickup_date, cco.status as cake_status FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.customer_id
                LEFT JOIN online_orders oo ON o.order_id = oo.order_id
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
        
        $stmt = $this->pdo->prepare("SELECT o.*, COALESCE(o.customer_name, c.name) as customer_name, COALESCE(oo.delivery_address, c.address) as address, c.phone as customer_phone, cco.phone, cco.design_details, cco.description, cco.pickup_date, cco.status as cake_status FROM orders o
                                     LEFT JOIN customers c ON o.customer_id = c.customer_id
                                     LEFT JOIN online_orders oo ON o.order_id = oo.order_id
                                     LEFT JOIN custom_cake_orders cco ON o.order_id = cco.order_id
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
        $phone = $data['phone'] ?? null;
        $design_details = $data['design_details'] ?? null;
        $description = $data['description'] ?? null;
        $pickup_date = $data['pickup_date'] ?? null;
        
        // NEW: Grab payment details from payload
        $payment_method = $data['payment_method'] ?? 'Online'; 
        $payment_status = ($payment_method === 'Card') ? 'Completed' : 'Pending';

        // CUSTOM ORDERS: do NOT create an order row yet. The request lives ONLY in
        // custom_cake_orders with status 'PendingApproval'. It is moved into `orders`
        // only after a sales supervisor approves it (see custom/api.php -> approve()).
        if ($order_type === 'Custom') {
            if (empty($design_details) || empty($pickup_date)) {
                return $this->handler->sendResponse(false, null, 'Custom cake orders require design details and a pickup date.');
            }
            $stmt = $this->pdo->prepare("INSERT INTO custom_cake_orders (customer_id, customer_name, phone, design_details, description, pickup_date, status) VALUES (?, ?, ?, ?, ?, ?, 'PendingApproval')");
            $stmt->execute([$customer_id, $customer_name, $phone, $design_details, $description, $pickup_date]);
            $custom_order_id = $this->pdo->lastInsertId();
            $this->handler->sendResponse(true, ['custom_order_id' => $custom_order_id], 'Custom cake request submitted for supervisor approval.');
        }

        if (empty($items) || $total_amount <= 0) {
            return $this->handler->sendResponse(false, null, 'Order must have items and valid total');
        }

        // Initial status depends on order type:
        // - InStore: paid and handed over at the counter, so it's Completed right away.
        // - Online: still needs to be prepared/delivered, so it starts Pending.
        $initial_status = ($order_type === 'InStore') ? 'Completed' : 'Pending';

        try {
            $this->pdo->beginTransaction();

            // 1. Insert order record
            $stmt = $this->pdo->prepare("INSERT INTO orders (customer_id, customer_name, total_amount, order_type, status) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$customer_id, $customer_name, $total_amount, $order_type, $initial_status]);
            $order_id = $this->pdo->lastInsertId();

            // 2. Handle specific type processing routes (Custom is handled above, so only InStore/Online reach here)
            {
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
        
        $allowed = ['Pending', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered', 'Completed', 'Cancelled', 'Rejected'];
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

    // Updates ONLY the custom cake approval status (PendingApproval / Approved / Rejected)
    // Approval lives on custom_cake_orders, separate from the order fulfillment status.
    public function updateCakeStatus() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $id = $data['order_id'] ?? $_GET['id'] ?? 0;
        $status = $data['status'] ?? '';

        if (!$id || empty($status)) {
            return $this->handler->sendResponse(false, null, 'Order ID and status are required');
        }

        $allowed = ['PendingApproval', 'Approved', 'Rejected'];
        if (!in_array($status, $allowed)) {
            return $this->handler->sendResponse(false, null, 'Invalid cake status');
        }

        $stmt = $this->pdo->prepare("UPDATE custom_cake_orders SET status = ? WHERE order_id = ?");
        $result = $stmt->execute([$status, $id]);

        if ($result) {
            $this->handler->sendResponse(true, null, 'Custom cake status updated successfully');
        } else {
            $this->handler->sendResponse(false, null, 'Failed to update custom cake status');
        }
    }

    // Update custom cake order details (customer_name, design_details, description, pickup_date, status)
    // Works for BOTH pending requests (keyed by custom_order_id) and approved ones (keyed by order_id).
    public function update() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $order_id = $data['order_id'] ?? $_GET['id'] ?? 0;
        $custom_order_id = $data['custom_order_id'] ?? 0;

        if (!$order_id && !$custom_order_id) {
            return $this->handler->sendResponse(false, null, 'Order ID or custom order ID is required');
        }

        // If only custom_order_id was given, resolve its linked order_id (set once approved)
        if ($custom_order_id && !$order_id) {
            $stmt = $this->pdo->prepare("SELECT order_id FROM custom_cake_orders WHERE custom_order_id = ?");
            $stmt->execute([$custom_order_id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row && $row['order_id']) {
                $order_id = $row['order_id'];
            }
        }

        // Fields from orders table
        $orderFields = [];
        $orderParams = [];
        if (isset($data['customer_name'])) {
            $orderFields[] = 'customer_name = ?';
            $orderParams[] = $data['customer_name'];
        }

        // Fields from custom_cake_orders table
        $cakeFields = [];
        $cakeParams = [];
        if (isset($data['design_details'])) {
            $cakeFields[] = 'design_details = ?';
            $cakeParams[] = $data['design_details'];
        }
        if (isset($data['description'])) {
            $cakeFields[] = 'description = ?';
            $cakeParams[] = $data['description'];
        }
        if (isset($data['pickup_date'])) {
            $cakeFields[] = 'pickup_date = ?';
            $cakeParams[] = $data['pickup_date'];
        }
        if (isset($data['phone'])) {
            $cakeFields[] = 'phone = ?';
            $cakeParams[] = $data['phone'];
        }
        // Price is stored ONLY on the orders table as total_amount (custom_cake_orders has no price column).
        // Only update it when the cake already has an order (i.e. it's been approved).
        if (isset($data['price']) && $order_id) {
            $orderFields[] = 'total_amount = ?';
            $orderParams[] = floatval($data['price']);
        }
        if (isset($data['status'])) {
            $allowed = ['PendingApproval', 'Approved', 'Rejected'];
            if (!in_array($data['status'], $allowed)) {
                return $this->handler->sendResponse(false, null, 'Invalid cake status');
            }
            $cakeFields[] = 'status = ?';
            $cakeParams[] = $data['status'];
        }

        try {
            $this->pdo->beginTransaction();

            // Update orders table if an order exists and customer_name provided
            if (!empty($orderFields) && $order_id) {
                $orderParams[] = $order_id;
                $stmt = $this->pdo->prepare("UPDATE orders SET " . implode(', ', $orderFields) . " WHERE order_id = ?");
                $stmt->execute($orderParams);
            }

            // Update custom_cake_orders table if any cake fields provided.
            // Pending requests have no order_id yet, so key by custom_order_id when present.
            if (!empty($cakeFields)) {
                if ($custom_order_id) {
                    $cakeParams[] = $custom_order_id;
                    $stmt = $this->pdo->prepare("UPDATE custom_cake_orders SET " . implode(', ', $cakeFields) . " WHERE custom_order_id = ?");
                } else {
                    $cakeParams[] = $order_id;
                    $stmt = $this->pdo->prepare("UPDATE custom_cake_orders SET " . implode(', ', $cakeFields) . " WHERE order_id = ?");
                }
                $stmt->execute($cakeParams);
            }

            $this->pdo->commit();
            $this->handler->sendResponse(true, null, 'Custom cake updated successfully');

        } catch (Exception $e) {
            $this->pdo->rollBack();
            $this->handler->sendResponse(false, null, 'Failed to update custom cake: ' . $e->getMessage());
        }
    }

    // Delete an order (and its related records)
    public function delete() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $id = $data['id'] ?? $_GET['id'] ?? 0;

        if (!$id) {
            return $this->handler->sendResponse(false, null, 'Order ID is required');
        }

        try {
            $this->pdo->beginTransaction();

            // payments has no ON DELETE CASCADE, so remove it first
            $stmt = $this->pdo->prepare("DELETE FROM payments WHERE order_id = ?");
            $stmt->execute([$id]);

            // order_items, custom_cake_orders cascade automatically
            $stmt = $this->pdo->prepare("DELETE FROM orders WHERE order_id = ?");
            $stmt->execute([$id]);

            $this->pdo->commit();
            $this->handler->sendResponse(true, null, 'Order deleted successfully');
        } catch (Exception $e) {
            $this->pdo->rollBack();
            $this->handler->sendResponse(false, null, 'Failed to delete order: ' . $e->getMessage());
        }
    }
}
?>