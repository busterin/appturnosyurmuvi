<?php
require_once __DIR__ . "/../auth.php";
require_auth();

require "config.php";
$stmt = $pdo->query("SELECT id, name, color FROM events ORDER BY name");
echo json_encode($stmt->fetchAll());
