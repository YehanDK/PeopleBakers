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
        // Targets updated structural table frameworks with frontend aliases
        $stmt = $this->pdo->query("SELECT r.stock_record_id AS id, r.product_id, r.supplier_id, r.quantity as qty,                                            r.unit_price AS unitCost, r.total, DATE(NOW()) AS date,
                                           p.product_name AS item, s.supplier_name AS supplier
                                    FROM StockRecord r
                                    LEFT JOIN Product p ON r.product_id = p.product_id
                                    LEFT JOIN Supplier s ON r.supplier_id = s.supplier_id
                                    ORDER BY r.stock_record_id DESC");
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $this->handler->sendResponse(true, $records);
    }
         
    public function create() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
                 
        $product_id = $data['product_id'] ?? 0;
        $supplier_id = $data['supplier_id'] ?? 0;
        $quantity = $data['quantity'] ?? 0;
        $unit_cost = $data['unit_cost'] ?? 0;
        $restock_date = $data['restock_date'] ?? date('Y-m-d'); // Extracted date data safely
                 
        if (!$product_id || !$supplier_id || $quantity <= 0 || $unit_cost <= 0) {
            return $this->handler->sendResponse(false, null, 'Missing required fields');
        }
                 
        $total = $quantity * $unit_cost;
                 
        try {
            $this->pdo->beginTransaction();
                     
            // 1. Insert record into base inventory table
            $stmt = $this->pdo->prepare("INSERT INTO StockRecord (product_id, supplier_id, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$product_id, $supplier_id, $quantity, $unit_cost, $total]);
                     
            // 2. Fetch the newly generated stock record primary key id
            $restock_id = $this->pdo->lastInsertId();
            
            // 3. Update product stock values pool
            $stmt = $this->pdo->prepare("UPDATE Product SET quantity = quantity + ? WHERE product_id = ?");
            $stmt->execute([$quantity, $product_id]);
                     
            // 4. Automated expense record insertion (Fixed missing $ typo)
            $expStmt = $this->pdo->prepare("INSERT INTO ExpenseRecord (ammount, description, bill_number, date) VALUES (?, ?, ?, ?)");
            $expStmt->execute([$total, 'restock bill', $restock_id, $restock_date]);
            
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
                 
        if (isset($data['supplier_id'])) { $fields[] = "supplier_id = ?"; $params[] = $data['supplier_id']; }
        if (isset($data['quantity'])) { $fields[] = "quantity = ?"; $params[] = $data['quantity']; }
        if (isset($data['unit_cost'])) { $fields[] = "unit_price = ?"; $params[] = $data['unit_cost']; }
                 
        if (empty($fields)) {
            return $this->handler->sendResponse(false, null, 'No fields to update');
        }
                 
        try {
            $this->pdo->beginTransaction();
                          
            $params[] = $id;
            $sql = "UPDATE StockRecord SET " . implode(', ', $fields) . " WHERE stock_record_id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
                          
            $stmtSync = $this->pdo->prepare("UPDATE StockRecord SET total = quantity * unit_price WHERE stock_record_id = ?");
            $stmtSync->execute([$id]);
                          
            $this->pdo->commit();
            $this->handler->sendResponse(true, null, 'Restock updated successfully');
        } catch (Exception $e) {
            $this->pdo->rollBack();
            $this->handler->sendResponse(false, null, 'Failed to update restock: ' . $e->getMessage());
        }
    }
         
    public function delete() {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? $_GET['id'] ?? $_POST['id'] ?? 0;
                 
        if (!$id) {
            return $this->handler->sendResponse(false, null, 'Restock ID required');
        }
                 
        $stmt = $this->pdo->prepare("DELETE FROM StockRecord WHERE stock_record_id = ?");
        $result = $stmt->execute([$id]);
                 
        if ($result) {
            $this->handler->sendResponse(true, null, 'Restock deleted successfully');
        } else {
            $this->handler->sendResponse(false, null, 'Failed to delete restock');
        }
    }
         
    public function suppliers() {
        $stmt = $this->pdo->query("SELECT supplier_id, supplier_name AS name FROM Supplier ORDER BY supplier_name");
        $suppliers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $this->handler->sendResponse(true, $suppliers);
    }
}
?>