<?php
require dirname(__DIR__) . "/auth.php";
require_auth();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Gestión de Turnos - Admin</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" href="/images/favicomyurmuvi.png">
    <link rel="shortcut icon" href="/images/favicomyurmuvi.png">
    <link rel="apple-touch-icon" href="/images/favicomyurmuvi.png">
    <link rel="stylesheet" href="/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
    <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
</head>
<body>

<div class="container">
    <div class="tabs">
        <img src="/images/logoyurmuvi.PNG" class="logo-image" alt="Logo">
        <button class="tab-button" onclick="showTab('turnos')">Horarios</button>
        <button class="tab-button" onclick="showTab('registro')">Registro</button>
        <button class="tab-button" onclick="showTab('calendario')">Calendario</button>
    </div>

    <div id="turnos" class="tab-content">
        <div class="filters">
            <div>
                <label>Monitor/a</label><br>
                <select id="trabajador-filter">
                    <option value="">Todos</option>
                </select>
            </div>
            <div>
                <label>Mes</label><br>
                <select id="mes-filter">
                    <option value="">Todos</option>
                    <option value="01">Enero</option>
                    <option value="02">Febrero</option>
                    <option value="03">Marzo</option>
                    <option value="04">Abril</option>
                    <option value="05">Mayo</option>
                    <option value="06">Junio</option>
                    <option value="07">Julio</option>
                    <option value="08">Agosto</option>
                    <option value="09">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
                </select>
            </div>
        </div>
        <div id="turnos-container"></div>
    </div>

    <div id="calendario" class="tab-content">
        <div class="calendar-panel">
            <div class="calendar-toolbar">
                <button type="button" id="calendar-prev" class="calendar-nav-btn" aria-label="Mes anterior">◀</button>
                <h2 id="calendar-month-title"></h2>
                <button type="button" id="calendar-next" class="calendar-nav-btn" aria-label="Mes siguiente">▶</button>
            </div>

            <div class="calendar-weekdays">
                <div>Lun</div>
                <div>Mar</div>
                <div>Mié</div>
                <div>Jue</div>
                <div>Vie</div>
                <div>Sáb</div>
                <div>Dom</div>
            </div>

            <div id="calendar-grid" class="calendar-grid"></div>
        </div>

        <div id="calendar-day-detail" class="calendar-day-detail" style="display:none;" aria-hidden="true">
            <div class="calendar-day-detail-content" role="dialog" aria-modal="true" aria-labelledby="calendar-day-detail-title">
                <div class="calendar-day-detail-header">
                    <h3 id="calendar-day-detail-title"></h3>
                    <button type="button" id="calendar-day-detail-close">Cerrar</button>
                </div>
                <div id="calendar-day-detail-body"></div>
            </div>
        </div>
    </div>

    <div id="registro" class="tab-content">
        <form id="turno-form">
            <h2>Añadir Turno</h2>
            <label>Trabajador</label>
            <select id="trabajador">
                <option value="Monitor/a pendiente de confirmar">Monitor/a pendiente de confirmar</option>
                <option value="__nuevo__">+ Añadir monitor/a nuevo</option>
            </select>

            <label>Turno</label>
            <select id="turno">
                <option value="__nuevo_turno__">+ Añadir evento</option>
            </select>

            <label>Día</label>
            <input type="text" id="dia" placeholder="Selecciona fecha...">

            <label>Franja</label>
            <select id="franja">
                <option>Todo el día</option>
                <option>Mañana</option>
                <option>Tarde</option>
            </select>

            <label>Observaciones</label>
            <textarea id="observaciones"></textarea>

            <button type="submit">Guardar Turno</button>
        </form>

        <div class="delete-block">
            <h2>Eliminar registro</h2>
            <label>1. Filtrar por mes y año:</label>
            <input type="month" id="delete-month-filter">
            
            <label>2. Seleccionar turno:</label>
            <select id="delete-select">
                <option value="">Selecciona un mes primero...</option>
            </select>
            <button id="delete-btn">Eliminar Registro</button>
        </div>
    </div>
</div>

<script src="/app.js"></script>
</body>
</html>
