<?php
require "config.php";
require "fpdf/fpdf.php";

$pdf = new FPDF();
$pdf->AddPage();
$pdf->SetFont("Arial", "B", 12);
$pdf->Cell(0, 10, "Horarios", 0, 1, "C");
$pdf->Ln(5);

$pdf->SetFont("Arial", "", 9);

$stmt = $pdo->query("
    SELECT shift_date, event, worker, franja, notes
    FROM shifts
    ORDER BY shift_date ASC
");

while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $pdf->MultiCell(0, 6,
        "Fecha: {$r['shift_date']}\n" .
        "Turno: {$r['event']}\n" .
        "Trabajador: {$r['worker']}\n" .
        "Franja: {$r['franja']}\n" .
        ($r['notes'] ? "Obs: {$r['notes']}\n" : "") .
        "-----------------------------"
    );
}

$pdf->Output("D", "horarios.pdf");
