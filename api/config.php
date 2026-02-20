<?php
require_once __DIR__ . "/../auth.php";
require_auth();

// api/config.php

$host = "db5019476862.hosting-data.io";
$db   = "dbs15235508";
$user = "dbu1679376";
$pass = "Mayurni123!";
$charset = "utf8mb4";

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$db;charset=$charset",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error de conexión"]);
    exit;
}
