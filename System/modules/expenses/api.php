<?php
// modules/expenses/api.php

class ExpensesAPI {
    private $pdo;
    private $handler;

    public function __construct($pdo, $handler) {
        $this->pdo = $pdo;
        $this->handler = $handler;
    }

    /**
     * Pulls historical expenditures out from the database engine
     */
    public function list() {
        $stmt = $this->pdo->query("SELECT expense_record_id AS id, ammount AS amount, description, bill_number, date FROM ExpenseRecord ORDER BY date DESC");
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $this->handler->sendResponse(true, $records);
    }

    /**
     * Logs a new expenditure parameter entry row into database memory
     */
    public function create() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $amount = isset($data['amount']) ? floatval($data['amount']) : 0;
        $description = $data['description'] ?? '';
        $bill_number = $data['bill_number'] ?? '';
        $date = $data['date'] ?? date('Y-m-d');

        if ($amount <= 0) {
            return $this->handler->sendResponse(false, null, 'A valid tracking amount greater than zero is required.');
        }

        // Enforces parity with unique schema typographic definition 'ammount'
        $stmt = $this->pdo->prepare("INSERT INTO ExpenseRecord (ammount, description, bill_number, date) VALUES (?, ?, ?, ?)");
        $result = $stmt->execute([$amount, $description, $bill_number, $date]);

        if ($result) {
            $this->handler->sendResponse(true, ['expense_record_id' => $this->pdo->lastInsertId()], 'Expense record logged securely.');
        } else {
            $this->handler->sendResponse(false, null, 'Failed to insert data layer parameters.');
        }
    }

    // delete the record
    public function delete() {
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $id = $data['id'] ?? $_GET['id'] ?? 0;

        if (!$id) {
            return $this->handler->sendResponse(false, null, 'Expense ID required.');
        }

        $stmt = $this->pdo->prepare("DELETE FROM ExpenseRecord WHERE expense_record_id = ?");
        $result = $stmt->execute([$id]);

        if ($result) {
            $this->handler->sendResponse(true, null, 'Expense record deleted successfully.');
        } else {
            $this->handler->sendResponse(false, null, 'Failed to remove data layer parameter.');
        }
    }
}
?>