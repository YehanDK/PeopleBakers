<?php
// modules/products/api.php

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
    case 'categories':
        listCategories();
        break;
    case 'createCategory':
        createCategory();
        break;
    default:
        sendResponse(false, null, 'Invalid action');
}

function listProducts() {
    global $pdo;
    // FIX: Updated table names to Product / ProductCategory and columns to product_name / quantity[cite: 2]
    $stmt = $pdo->query("SELECT p.product_id as id, p.product_name as name, p.price, p.quantity as stock, c.category_name as category 
                         FROM Product p 
                         LEFT JOIN ProductCategory c ON p.category_id = c.category_id");
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    sendResponse(true, $products);
}

function createProduct() {
    global $pdo;
    $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    
    // FIX: Adjusted query to target new Product table parameters[cite: 2]
    $stmt = $pdo->prepare("INSERT INTO Product (product_name, price, quantity, category_id, description) VALUES (?, ?, ?, ?, ?)");
    $result = $stmt->execute([
        $data['name'] ?? '',
        $data['price'] ?? 0,
        $data['stock'] ?? 0,
        $data['category_id'] ?? null,
        $data['description'] ?? '' // Supporting the new schema's description parameter explicitly[cite: 2]
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
    
    // FIX: Re-mapped field updating logic to use the new quantity schema constraint[cite: 2]
    $stmt = $pdo->prepare("UPDATE Product SET price = ?, quantity = ? WHERE product_id = ?");
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
    $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $id = $data['id'] ?? $_POST['id'] ?? '';
    
    // FIX: Relational ON DELETE CASCADE handling configured at database layer drops dependent nodes automatically[cite: 2]
    $stmt = $pdo->prepare("DELETE FROM Product WHERE product_id = ?");
    $result = $stmt->execute([$id]);
    
    if ($result) {
        sendResponse(true, null, 'Product deleted');
    } else {
        sendResponse(false, null, 'Failed to delete product');
    }
}

function createCategory() {
    global $pdo;
    $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $name = trim($data['category_name'] ?? '');

    if ($name === '') {
        sendResponse(false, null, 'Category name is required');
    }

    // Prevent duplicate category names
    $check = $pdo->prepare("SELECT category_id FROM ProductCategory WHERE category_name = ?");
    $check->execute([$name]);
    if ($check->fetch()) {
        sendResponse(false, null, 'Category already exists');
    }

    $stmt = $pdo->prepare("INSERT INTO ProductCategory (category_name) VALUES (?)");
    $result = $stmt->execute([$name]);

    if ($result) {
        sendResponse(true, ['id' => $pdo->lastInsertId(), 'category_name' => $name], 'Category created');
    } else {
        sendResponse(false, null, 'Failed to create category');
    }
}

function listCategories() {
    global $pdo;
    // FIX: Targets uppercase singular ProductCategory layout table[cite: 2]
    $stmt = $pdo->query("
        SELECT
            category_id,
            category_name
        FROM ProductCategory
        ORDER BY category_name
    ");

    echo json_encode(
        $stmt->fetchAll(PDO::FETCH_ASSOC)
    );
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