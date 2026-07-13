<?php
require_once __DIR__ . '/../../config/db.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'list':
        listProducts();
        break;
    case 'create':
        createProduct();
        break;
    case 'update':
        updateProduct();
        break;
    case 'delete':
        deleteProduct();
        break;
    default:
        sendResponse(false, null, 'Invalid action');
}

function listProducts() {
    global $pdo;
    $stmt = $pdo->query("SELECT p.product_id as id, p.name, p.price, p.stock_qty as stock, c.category_name as category FROM products p LEFT JOIN product_categories c ON p.category_id = c.category_id");
    $products = $stmt->fetchAll();
    sendResponse(true, $products);
}

function createProduct() {
    global $pdo;
    $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    
    $stmt = $pdo->prepare("INSERT INTO products (name, price, stock_qty, category_id) VALUES (?, ?, ?, ?)");
    $result = $stmt->execute([
        $data['name'],
        $data['price'],
        $data['stock'] ?? 0,
        $data['category_id'] ?? null
    ]);
    
    if ($result) {
        sendResponse(true, ['id' => $pdo->lastInsertId()], 'Product created');
    } else {
        sendResponse(false, null, 'Failed to create product');
    }
}

function updateProduct() {
    global $pdo;
    $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    
    $stmt = $pdo->prepare("UPDATE products SET price = ?, stock_qty = ? WHERE product_id = ?");
    $result = $stmt->execute([
        $data['price'],
        $data['stock'],
        $data['id']
    ]);
    
    if ($result) {
        sendResponse(true, null, 'Product updated');
    } else {
        sendResponse(false, null, 'Failed to update product');
    }
}

function deleteProduct() {
    global $pdo;
    $id = $_POST['id'] ?? '';
    $stmt = $pdo->prepare("DELETE FROM products WHERE product_id = ?");
    $result = $stmt->execute([$id]);
    
    if ($result) {
        sendResponse(true, null, 'Product deleted');
    } else {
        sendResponse(false, null, 'Failed to delete product');
    }
}

function sendResponse($success, $data = null, $message = '') {
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'message' => $message
    ]);
    exit;
}
?>