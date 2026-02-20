<?php
require_once __DIR__ . "/../auth.php";
require_auth();

require "config.php";

header("Content-Type: application/json; charset=UTF-8");

$sql = "
SELECT 
    s.id,
    s.shift_date,
    s.franja,
    s.notes,
    w.name AS worker,
    w.image,
    e.name AS event,
    e.color
FROM shifts s
JOIN workers w ON s.worker_id = w.id
JOIN events e ON s.event_id = e.id
ORDER BY s.shift_date ASC
";

$stmt = $pdo->query($sql);
$data = $stmt->fetchAll();

echo json_encode($data, JSON_UNESCAPED_UNICODE);
exit;
