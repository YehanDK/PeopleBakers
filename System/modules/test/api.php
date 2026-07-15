<?php
// modules/test/api.php

class TestAPI {
    private $pdo;
    private $handler;
    
    public function __construct($pdo, $handler) {
        $this->pdo = $pdo;
        $this->handler = $handler;
    }
    
    public function ping() {
        $this->handler->sendResponse(true, ['message' => 'API is working!', 'timestamp' => date('Y-m-d H:i:s')]);
    }
}