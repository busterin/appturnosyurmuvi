<?php
require "config.php";
$stmt = $pdo->query("SELECT id, name, image FROM workers ORDER BY name");
echo json_encode($stmt->fetchAll());
