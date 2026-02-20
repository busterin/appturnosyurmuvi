<?php
require_once __DIR__ . "/../auth.php";
require_auth();

require "config.php";

header("Content-Type: application/vnd.ms-excel");
header("Content-Disposition: attachment; filename=horarios.xls");

echo "Fecha\tTurno\tTrabajador\tFranja\tObservaciones\n";

$stmt = $pdo->query("
    SELECT shift_date, event, worker, franja, notes
    FROM shifts
    ORDER BY shift_date ASC
");

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo
        $row["shift_date"] . "\t" .
        $row["event"] . "\t" .
        $row["worker"] . "\t" .
        $row["franja"] . "\t" .
        str_replace(["\n", "\t"], " ", $row["notes"]) .
        "\n";
}
