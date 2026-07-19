<?php
// modules/reports/api.php

class ReportsAPI {
    private $pdo;
    private $handler;

    // Class entry definitions matching centralized modular routing standards
    public function __construct($pdo, $handler) {
        $this->pdo = $pdo;
        $this->handler = $handler;
    }

    /**
     * Saves a snapshot of localized sales summaries securely to the database.
     * Accessible via api_handler query router actions
     */
    public function save_report() {
        $input = json_decode(file_get_contents('php://input'), true);
        $data = $input ?: $_POST;

        $report_type     = $data['report_type'] ?? 'Daily';
        $in_store_orders = intval($data['in_store_orders'] ?? 0);
        $online_orders   = intval($data['online_orders'] ?? 0);
        $cake_orders     = intval($data['cake_orders'] ?? 0);
        $total_revenue   = floatval($data['total_revenue'] ?? 0.00);
        $current_date    = date('Y-m-d'); 

        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO SalesReport 
                (report_type, created_date, in_store_orders, online_orders, cake_orders, total_revenue) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $report_type,
                $current_date,
                $in_store_orders,
                $online_orders,
                $cake_orders,
                $total_revenue
            ]);

            $this->handler->sendResponse(true, ['report_id' => $this->pdo->lastInsertId()], 'Report archived successfully');
        } catch (PDOException $e) {
            $this->handler->sendResponse(false, null, 'Database failure error: ' . $e->getMessage());
        }
    }
}
?>