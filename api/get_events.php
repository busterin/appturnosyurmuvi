<?php
require "config.php";
$stmt = $pdo->query("SELECT id, name, color FROM events ORDER BY name");
echo json_encode($stmt->fetchAll());
