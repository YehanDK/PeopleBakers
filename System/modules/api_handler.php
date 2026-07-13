<?php
// modules/api_handler.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors in output

// Load database config
require_once __DIR__ . '/../config/db.php';

class APIHandler {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function sendResponse($success, $data = null, $message = '') {
        echo json_encode([
            'success' => $success,
            'data' => $data,
            'message' => $message
        ]);
        exit;
    }
    
    public function handleRequest($module, $action, $method) {
        $moduleFile = __DIR__ . "/$module/api.php";
        
        if (!file_exists($moduleFile)) {
            $this->sendResponse(false, null, "Module '$module' not found at: $moduleFile");
        }
        
        require_once $moduleFile;
        $className = ucfirst($module) . 'API';
        
        if (!class_exists($className)) {
            $this->sendResponse(false, null, "API class '$className' not found in module");
        }
        
        $api = new $className($this->pdo, $this);
        
        if (!method_exists($api, $action)) {
            $this->sendResponse(false, null, "Action '$action' not found in module '$module'");
        }
        
        return $api->$action();
    }
}

$handler = new APIHandler($pdo);

// Get parameters
$module = $_GET['module'] ?? $_POST['module'] ?? '';
$action = $_GET['action'] ?? $_POST['action'] ?? '';

if (empty($module) || empty($action)) {
    $handler->sendResponse(false, null, 'Missing module or action parameter');
}

$handler->handleRequest($module, $action, $_SERVER['REQUEST_METHOD']);
?>