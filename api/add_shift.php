<?php
require_once __DIR__ . "/../auth.php";
require_auth();

require "config.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    http_response_code(400);
    exit;
}

// Obtener worker_id
$stmt = $pdo->prepare("SELECT id FROM workers WHERE name = ?");
$stmt->execute([$data["worker"]]);
$worker = $stmt->fetch();

if (!$worker) {
    $stmt = $pdo->prepare("INSERT INTO workers (name) VALUES (?)");
    $stmt->execute([$data["worker"]]);
    $workerId = $pdo->lastInsertId();
} else {
    $workerId = $worker["id"];
}

// Obtener event_id
$stmt = $pdo->prepare("SELECT id FROM events WHERE name = ?");
$stmt->execute([$data["event"]]);
$event = $stmt->fetch();

if (!$event) {
    $stmt = $pdo->prepare(
        "INSERT INTO events (name, color) VALUES (?, '#8b1e1e')"
    );
    $stmt->execute([$data["event"]]);
    $eventId = $pdo->lastInsertId();
} else {
    $eventId = $event["id"];
}

// Insert shift
$stmt = $pdo->prepare("
INSERT INTO shifts (shift_date, worker_id, event_id, franja, notes)
VALUES (?, ?, ?, ?, ?)
");

$stmt->execute([
    $data["date"],
    $workerId,
    $eventId,
    $data["franja"],
    $data["notes"] ?? null
]);

echo json_encode(["success" => true]);
