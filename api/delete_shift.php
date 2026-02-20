<?php
require_once __DIR__ . "/../auth.php";
require_auth();

require "config.php";

header("Content-Type: application/json; charset=UTF-8");

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data["id"])) {
    http_response_code(400);
    echo json_encode(["error" => "ID no recibido"]);
    exit;
}

$stmt = $pdo->prepare("DELETE FROM shifts WHERE id = ?");
$stmt->execute([$data["id"]]);

echo json_encode(["success" => true]);
exit;
