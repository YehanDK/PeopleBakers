<?php
// System/modules/custom/api.php
// Custom Cake Order workflow: sales assistant requests -> supervisor approves -> order created

class customAPI {
    private $pdo;
    private $handler;

    public function __construct($pdo, $handler) {
        $this->pdo = $pdo;
        $this->handler = $handler;
    }

    // Sales assistant submits a custom cake request (goes to custom_cake_orders first)
    public function create() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;

        $customer_name = $data['customer_name'] ?? '';
        $customer_id = $data['customer_id'] ?? null;
        $phone = $data['phone'] ?? null;
        $design_details = $data['design_details'] ?? '';
        $description = $data['description'] ?? '';
        $pickup_date = $data['pickup_date'] ?? null;

        if (empty($customer_name) || empty($design_details) || empty($pickup_date)) {
            return $this->handler->sendResponse(false, null, 'Customer name, design, and pickup date are required.');
        }

        $stmt = $this->pdo->prepare("INSERT INTO custom_cake_orders (customer_name, customer_id, phone, design_details, description, pickup_date, status) VALUES (?, ?, ?, ?, ?, ?, 'PendingApproval')");
        $stmt->execute([$customer_name, $customer_id, $phone, $design_details, $description, $pickup_date]);

        $id = $this->pdo->lastInsertId();
        $this->handler->sendResponse(true, ['custom_order_id' => $id], 'Custom cake request submitted for approval.');
    }

    // List all custom cake requests (for supervisor dashboard)
    public function list() {
        $status = $_GET['status'] ?? null;
        // Join orders so the agreed total_amount is available for the detail form
        $sql = "SELECT cco.*, o.total_amount FROM custom_cake_orders cco LEFT JOIN orders o ON cco.order_id = o.order_id";
        if ($status) {
            $sql .= " WHERE cco.status = ?";
        }
        $sql .= " ORDER BY cco.created_at DESC";
        $stmt = $status ? $this->pdo->prepare($sql) : $this->pdo->query($sql);
        if ($status) $stmt->execute([$status]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $this->handler->sendResponse(true, $rows);
    }

    // Supervisor approves -> create the order in orders table
    public function approve() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $custom_order_id = $data['custom_order_id'] ?? $data['id'] ?? 0;
        $approved_by = $data['approved_by'] ?? null;
        $price = isset($data['price']) ? floatval($data['price']) : 0;

        if (!$custom_order_id) {
            return $this->handler->sendResponse(false, null, 'Custom order ID required.');
        }

        $stmt = $this->pdo->prepare("SELECT * FROM custom_cake_orders WHERE custom_order_id = ?");
        $stmt->execute([$custom_order_id]);
        $req = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$req) {
            return $this->handler->sendResponse(false, null, 'Custom order not found.');
        }
        if ($req['status'] !== 'PendingApproval') {
            return $this->handler->sendResponse(false, null, 'Order already processed.');
        }

        try {
            $this->pdo->beginTransaction();

            // Create the order in orders table. The supervisor-set price becomes the order total.
            $stmt = $this->pdo->prepare("INSERT INTO orders (customer_id, customer_name, total_amount, order_type, status) VALUES (?, ?, ?, 'Custom', 'Pending')");
            $stmt->execute([$req['customer_id'], $req['customer_name'], $price]);
            $order_id = $this->pdo->lastInsertId();

            // Link back to custom_cake_orders. The agreed price is already stored as
            // total_amount on the orders row (custom_cake_orders has no price column).
            $stmt = $this->pdo->prepare("UPDATE custom_cake_orders SET order_id = ?, status = 'Approved', approved_by = ?, approved_at = NOW() WHERE custom_order_id = ?");
            $stmt->execute([$order_id, $approved_by, $custom_order_id]);

            $this->pdo->commit();
            $this->handler->sendResponse(true, ['order_id' => $order_id, 'total_amount' => $price], 'Custom cake approved and order created.');
        } catch (Exception $e) {
            $this->pdo->rollBack();
            $this->handler->sendResponse(false, null, 'Approval failed: ' . $e->getMessage());
        }
    }

    // Supervisor rejects
    public function reject() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $custom_order_id = $data['custom_order_id'] ?? $data['id'] ?? 0;
        if (!$custom_order_id) {
            return $this->handler->sendResponse(false, null, 'Custom order ID required.');
        }
        $stmt = $this->pdo->prepare("UPDATE custom_cake_orders SET status = 'Rejected' WHERE custom_order_id = ? AND status = 'PendingApproval'");
        $stmt->execute([$custom_order_id]);
        if ($stmt->rowCount() === 0) {
            return $this->handler->sendResponse(false, null, 'Order not found or already processed.');
        }
        $this->handler->sendResponse(true, null, 'Custom cake request rejected.');
    }

    // Delete a rejected request
    public function delete() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $custom_order_id = $data['custom_order_id'] ?? $data['id'] ?? 0;
        if (!$custom_order_id) {
            return $this->handler->sendResponse(false, null, 'Custom order ID required.');
        }
        $stmt = $this->pdo->prepare("DELETE FROM custom_cake_orders WHERE custom_order_id = ?");
        $stmt->execute([$custom_order_id]);
        $this->handler->sendResponse(true, null, 'Request deleted.');
    }
}