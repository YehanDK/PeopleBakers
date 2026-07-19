<?php
// modules/reports/api.php

class ReportsAPI {
    private $pdo;
    private $handler;

    public function __construct($pdo, $handler) {
        $this->pdo = $pdo;
        $this->handler = $handler;
    }

    // Finance Manager creates & persists a sales report (daily/monthly snapshot)
    public function create() {
        $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $duration = $data['duration'] ?? 'daily';
        if (!in_array($duration, ['daily', 'monthly'])) {
            $duration = 'daily';
        }

        $generated_by = (int) ($data['generated_by'] ?? 0);
        $generated_by_name = $data['generated_by_name'] ?? '';
        $report_data = isset($data['report_data']) ? json_encode($data['report_data']) : '{}';

        // Decode and store the actual PDF file produced by the finance manager's browser
        $report_path = null;
        if (!empty($data['pdf_base64'])) {
            $report_path = $this->savePdfFile($data['pdf_base64'], $duration);
            if ($report_path === false) {
                return $this->handler->sendResponse(false, null, 'Failed to save PDF file to disk');
            }
        }

        try {
            $stmt = $this->pdo->prepare(
                "INSERT INTO SalesReport
                    (duration, generated_by, generated_by_name, created_date, report_data, report_path)
                 VALUES (?, ?, ?, CURDATE(), ?, ?)"
            );
            $stmt->execute([
                $duration, $generated_by, $generated_by_name, $report_data, $report_path
            ]);
            $this->handler->sendResponse(true, [
                'report_id' => $this->pdo->lastInsertId(),
                'report_path' => $report_path
            ], 'Report saved');
        } catch (Exception $e) {
            $this->handler->sendResponse(false, null, 'Failed to save report: ' . $e->getMessage());
        }
    }

    // Writes a base64-encoded PDF to System/uploads/reports/ and returns the
    // web-accessible relative path (from the app root), or false on failure.
    private function savePdfFile($base64, $duration) {
        $binary = base64_decode($base64, true);
        if ($binary === false) return false;

        // System/modules/reports/api.php -> System/  (two levels up)
        $baseDir = dirname(__DIR__, 2);
        $uploadDir = $baseDir . '/uploads/reports';
        if (!is_dir($uploadDir)) {
            if (!mkdir($uploadDir, 0775, true) && !is_dir($uploadDir)) {
                return false;
            }
        }

        $safeDuration = in_array($duration, ['daily', 'monthly']) ? $duration : 'report';
        $filename = 'report_' . $safeDuration . '_' . date('Ymd_His') . '_' . substr(md5(uniqid('', true)), 0, 6) . '.pdf';
        $absolutePath = $uploadDir . '/' . $filename;

        if (file_put_contents($absolutePath, $binary) === false) {
            return false;
        }

        // Path relative to the app root so the browser can open it directly
        return 'uploads/reports/' . $filename;
    }

    // Both roles can list saved reports; the UI decides what actions to show
    public function list() {
        try {
            $stmt = $this->pdo->query(
                "SELECT report_id, duration, created_date, generated_by,
                        generated_by_name, generated_at, report_data, report_path
                 FROM SalesReport
                 ORDER BY generated_at DESC"
            );
            $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $this->handler->sendResponse(true, $reports);
        } catch (Exception $e) {
            $this->handler->sendResponse(false, null, 'Failed to load reports: ' . $e->getMessage());
        }
    }
}
?>
