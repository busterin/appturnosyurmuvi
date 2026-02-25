const API_BASE = "/api";
const IS_ADMIN = window.location.pathname.includes("/admin");

let allShifts = [];
let calendarCurrentMonth = (() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
})();
let selectedCalendarDate = null;

// =============================
// UTILIDADES
// =============================
function normalizar(txt) {
    return txt.toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
}

function parseFechaLocal(fechaStr) {
    const [y, m, d] = String(fechaStr).split("-").map(Number);
    return new Date(y, m - 1, d);
}

function formatFechaKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function formatDiaTitulo(fechaStr) {
    const fecha = parseFechaLocal(fechaStr);
    const dia = fecha.toLocaleDateString("es-ES", { weekday: "long" });
    return dia.charAt(0).toUpperCase() + dia.slice(1) + " " + fecha.toLocaleDateString("es-ES");
}

function escaparHtml(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function seleccionarMesActualPorDefecto() {
    const ahora = new Date();
    const inputMes = document.getElementById("mes-filter");
    if (inputMes) inputMes.value = String(ahora.getMonth() + 1).padStart(2, "0");
}

function getRutaImagenTurno(shift) {
    const esPendiente = (shift.worker || "").trim() === "Monitor/a pendiente de confirmar";
    return esPendiente ? "pendiente.PNG" : (shift.image || "default.png");
}

function getClaseEvento(eventName) {
    const ev = normalizar(eventName || "");
    if (ev === "frankenstein") return "Frankenstein";
    if (ev === "escuela de magia") return "Escuela-de-Magia";
    if (ev === "filosofal") return "Filosofal";
    if (ev === "vacaciones") return "Vacaciones";
    return "";
}

function compareWorkersCalendarPriority(a, b) {
    const prioridad = [
        "Gori",
        "Rober",
        "Paula AS",
        "Paula MC",
        "Monitor/a pendiente de confirmar"
    ];
    const ia = prioridad.indexOf(a);
    const ib = prioridad.indexOf(b);
    const aPrioritario = ia !== -1;
    const bPrioritario = ib !== -1;

    if (aPrioritario && bPrioritario) return ia - ib;
    if (aPrioritario) return -1;
    if (bPrioritario) return 1;
    return a.localeCompare(b, "es");
}

function showTab(tab) {
    document.querySelectorAll(".tab-content").forEach(t => t.style.display = "none");
    const tabEl = document.getElementById(tab);
    if (tabEl) tabEl.style.display = "block";
}

// =============================
// RENDER TURNOS
// =============================
function renderShifts(data) {
    const cont = document.getElementById("turnos-container");
    if (!cont) return;

    cont.innerHTML = "";
    const dias = {};
    const trabajadoresSet = new Set();

    data.forEach(s => {
        if (!dias[s.shift_date]) dias[s.shift_date] = [];
        dias[s.shift_date].push(s);
        trabajadoresSet.add(s.worker);
    });

    rellenarFiltroTrabajadores([...trabajadoresSet]);

    Object.keys(dias).sort().forEach(date => {
        const diaCard = document.createElement("div");
        diaCard.className = "dia-card";
        diaCard.id = date;
        diaCard.innerHTML = `<h3>${formatDiaTitulo(date)}</h3>`;

        dias[date].forEach(s => {
            const card = document.createElement("div");
            card.className = "turno";
            card.dataset.id = s.id;
            const ev = normalizar(s.event);

            if (ev === "frankenstein") card.classList.add("Frankenstein");
            if (ev === "escuela de magia") card.classList.add("Escuela-de-Magia");
            if (ev === "filosofal") card.classList.add("Filosofal");
            if (ev === "vacaciones") card.classList.add("Vacaciones");

            const rutaImagen = getRutaImagenTurno(s);

            card.innerHTML = `
                <div class="turno-info">
                    <h4>${ev === "escuela de magia" ? "Magia" : s.event}</h4>
                    <p>${s.worker}</p>
                    <p><strong>Franja:</strong> ${s.franja}</p>
                    ${s.notes ? `<p>${s.notes}</p>` : ""}
                </div>
                <div class="turno-icon">
                    <img src="/images/${rutaImagen}" class="trabajador-img" onerror="this.src='/images/default.png'">
                </div>
            `;
            diaCard.appendChild(card);
        });
        cont.appendChild(diaCard);
    });

    filterTurnos();
    if (IS_ADMIN) updateDeleteList();
}

// =============================
// CALENDARIO
// =============================
function getCalendarShiftsByDate() {
    const map = {};
    allShifts.forEach(s => {
        if (!map[s.shift_date]) map[s.shift_date] = [];
        map[s.shift_date].push(s);
    });
    return map;
}

function renderCalendar() {
    const grid = document.getElementById("calendar-grid");
    const monthTitle = document.getElementById("calendar-month-title");
    if (!grid || !monthTitle) return;

    const shiftsByDate = getCalendarShiftsByDate();
    const monthStart = new Date(calendarCurrentMonth.getFullYear(), calendarCurrentMonth.getMonth(), 1);
    const monthText = monthStart.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    monthTitle.textContent = monthText.charAt(0).toUpperCase() + monthText.slice(1);

    grid.innerHTML = "";

    const firstWeekday = (monthStart.getDay() + 6) % 7; // lunes = 0
    const firstCellDate = new Date(monthStart);
    firstCellDate.setDate(monthStart.getDate() - firstWeekday);

    for (let i = 0; i < 42; i++) {
        const cellDate = new Date(firstCellDate);
        cellDate.setDate(firstCellDate.getDate() + i);

        const dateKey = formatFechaKey(cellDate);
        const dayShifts = (shiftsByDate[dateKey] || []).slice();
        dayShifts.sort((a, b) => {
            if (a.worker !== b.worker) return a.worker.localeCompare(b.worker, "es");
            if (a.franja !== b.franja) return a.franja.localeCompare(b.franja, "es");
            return a.event.localeCompare(b.event, "es");
        });

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "calendar-day";
        if (cellDate.getMonth() !== monthStart.getMonth()) btn.classList.add("is-outside");
        if (dayShifts.length) btn.classList.add("has-shifts");
        if (selectedCalendarDate === dateKey) btn.classList.add("is-selected");

        btn.innerHTML = `
            <div class="calendar-day-number">${cellDate.getDate()}</div>
            <div class="calendar-day-avatars"></div>
        `;

        const avatarWrap = btn.querySelector(".calendar-day-avatars");
        const workersMap = new Map();
        dayShifts.forEach(shift => {
            if (!workersMap.has(shift.worker)) {
                workersMap.set(shift.worker, getRutaImagenTurno(shift));
            }
        });

        const workersEntries = [...workersMap.entries()].sort((a, b) =>
            compareWorkersCalendarPriority(a[0], b[0])
        );
        workersEntries.slice(0, 4).forEach(([worker, image]) => {
            const img = document.createElement("img");
            img.className = "calendar-avatar";
            img.src = `/images/${image}`;
            img.alt = worker;
            img.title = worker;
            img.onerror = () => { img.src = "/images/default.png"; };
            avatarWrap.appendChild(img);
        });

        if (workersEntries.length > 4) {
            const more = document.createElement("span");
            more.className = "calendar-more";
            more.textContent = `+${workersEntries.length - 4}`;
            avatarWrap.appendChild(more);
        }

        btn.addEventListener("click", () => {
            if (cellDate.getMonth() !== calendarCurrentMonth.getMonth() || cellDate.getFullYear() !== calendarCurrentMonth.getFullYear()) {
                calendarCurrentMonth = new Date(cellDate.getFullYear(), cellDate.getMonth(), 1);
            }
            selectedCalendarDate = dateKey;
            renderCalendar();
            renderCalendarDayDetail(dateKey, shiftsByDate[dateKey] || []);
        });

        grid.appendChild(btn);
    }

    const detailPanel = document.getElementById("calendar-day-detail");
    if (selectedCalendarDate && detailPanel && detailPanel.style.display !== "none") {
        renderCalendarDayDetail(selectedCalendarDate, shiftsByDate[selectedCalendarDate] || []);
    }
}

function renderCalendarDayDetail(dateKey, shifts) {
    const panel = document.getElementById("calendar-day-detail");
    const title = document.getElementById("calendar-day-detail-title");
    const body = document.getElementById("calendar-day-detail-body");
    if (!panel || !title || !body) return;

    title.textContent = formatDiaTitulo(dateKey);
    body.innerHTML = "";

    if (!shifts.length) {
        body.innerHTML = `<div class="calendar-empty">No hay turnos asignados para este día.</div>`;
        panel.style.display = "flex";
        panel.setAttribute("aria-hidden", "false");
        return;
    }

    const grouped = {};
    shifts.forEach(s => {
        if (!grouped[s.worker]) grouped[s.worker] = [];
        grouped[s.worker].push(s);
    });

    Object.keys(grouped).sort((a, b) => a.localeCompare(b, "es")).forEach(worker => {
        const workerShifts = grouped[worker].slice().sort((a, b) => {
            if (a.franja !== b.franja) return a.franja.localeCompare(b.franja, "es");
            return a.event.localeCompare(b.event, "es");
        });

        const card = document.createElement("div");
        card.className = "calendar-detail-item";

        const imageName = getRutaImagenTurno(workerShifts[0]);
        card.innerHTML = `
            <div class="calendar-detail-worker">
                <img src="/images/${imageName}" alt="${escaparHtml(worker)}" onerror="this.src='/images/default.png'">
                <span>${escaparHtml(worker)}</span>
            </div>
            <div class="calendar-detail-shifts">
            ${workerShifts.map(s => `
                <div class="calendar-detail-shift ${getClaseEvento(s.event)}">
                    <p><strong>${escaparHtml(normalizar(s.event) === "escuela de magia" ? "Magia" : s.event)}</strong> · ${escaparHtml(s.franja)}</p>
                    ${s.notes ? `<p>${escaparHtml(s.notes)}</p>` : ""}
                </div>
            `).join("")}
            </div>
        `;

        body.appendChild(card);
    });

    panel.style.display = "flex";
    panel.setAttribute("aria-hidden", "false");
}

function hideCalendarDayDetail() {
    const panel = document.getElementById("calendar-day-detail");
    if (!panel) return;
    panel.style.display = "none";
    panel.setAttribute("aria-hidden", "true");
}

function moveCalendarMonth(delta) {
    calendarCurrentMonth = new Date(
        calendarCurrentMonth.getFullYear(),
        calendarCurrentMonth.getMonth() + delta,
        1
    );
    renderCalendar();
}

// =============================
// FILTROS VISTA USUARIO
// =============================
function rellenarFiltroTrabajadores(lista) {
    const select = document.getElementById("trabajador-filter");
    if (!select) return;
    const prioridad = ["Gori", "Rober", "Paula MC", "Paula AS"];
    let trabajadores = lista.sort();
    if (!IS_ADMIN) trabajadores = trabajadores.filter(n => prioridad.includes(n));
    const actual = select.value;
    select.innerHTML = `<option value="">Todos</option>`;
    trabajadores.forEach(nombre => select.add(new Option(nombre, nombre)));
    select.value = actual;
}

async function loadShifts() {
    const res = await fetch(`${API_BASE}/get_shifts.php`);
    const data = await res.json();
    allShifts = data;
    renderShifts(data);
    renderCalendar();
}

function filterTurnos() {
    const tFilter = document.getElementById("trabajador-filter");
    const mFilter = document.getElementById("mes-filter");
    if (!tFilter || !mFilter) return;

    const t = tFilter.value;
    const m = mFilter.value;
    document.querySelectorAll(".dia-card").forEach(dia => {
        const mes = dia.id.split("-")[1];
        let visible = false;
        dia.querySelectorAll(".turno").forEach(turno => {
            const nombre = turno.querySelector(".turno-info p").textContent;
            const ok = (!t || nombre === t) && (!m || mes === m);
            turno.style.display = ok ? "" : "none";
            if (ok) visible = true;
        });
        dia.style.display = visible ? "" : "none";
    });
}

// =============================
// ADMIN: BORRADO CON FILTRO
// =============================
function updateDeleteList() {
    const select = document.getElementById("delete-select");
    const monthFilterInput = document.getElementById("delete-month-filter");
    if (!select || !monthFilterInput) return;

    const monthFilter = monthFilterInput.value;
    select.innerHTML = "";
    let hayTurnos = false;

    document.querySelectorAll(".dia-card").forEach(dia => {
        const fechaDia = dia.id;
        const mesAnioDia = fechaDia.substring(0, 7);
        if (!monthFilter || mesAnioDia === monthFilter) {
            dia.querySelectorAll(".turno").forEach(turno => {
                const fechaTexto = dia.querySelector("h3").textContent;
                const opt = document.createElement("option");
                opt.value = turno.dataset.id;
                opt.textContent = `${fechaTexto} · ${turno.querySelector("h4").textContent} · ${turno.querySelector(".turno-info p").textContent}`;
                select.appendChild(opt);
                hayTurnos = true;
            });
        }
    });

    if (!hayTurnos) {
        select.add(new Option(monthFilter ? "No hay turnos este mes" : "Selecciona un mes...", ""));
    }
}

// =============================
// ADMIN: CARGAR SELECTORES
// =============================
async function loadWorkers() {
    const res = await fetch(`${API_BASE}/get_workers.php`);
    const data = await res.json();
    const select = document.getElementById("trabajador");
    if (!select) return;

    select.innerHTML = "";

    const prioridad = ["Gori", "Rober", "Paula MC", "Paula AS"];
    const nombres = data.map(w => w.name);

    prioridad.forEach(n => {
        if (nombres.includes(n)) select.add(new Option(n, n));
    });

    nombres.filter(n => !prioridad.includes(n) && n !== "Monitor/a pendiente de confirmar")
        .forEach(n => select.add(new Option(n, n)));

    select.add(new Option("Monitor/a pendiente de confirmar", "Monitor/a pendiente de confirmar"));
    select.add(new Option("+ Añadir monitor/a nuevo", "__nuevo__"));
    select.selectedIndex = 0;
}

async function loadEvents() {
    const res = await fetch(`${API_BASE}/get_events.php`);
    const data = await res.json();
    const select = document.getElementById("turno");
    if (!select) return;

    select.innerHTML = "";
    let magiaAñadida = false;
    data.forEach(e => {
        const norm = normalizar(e.name);
        if (norm === "frankenstein") select.add(new Option("Frankenstein", e.name));
        if (norm === "escuela de magia" && !magiaAñadida) {
            select.add(new Option("Magia", e.name));
            magiaAñadida = true;
        }
        if (norm === "filosofal") select.add(new Option("Filosofal", e.name));
        if (norm === "vacaciones") select.add(new Option("Vacaciones", e.name));
    });
    data.filter(e => !["frankenstein", "escuela de magia", "filosofal", "vacaciones"].includes(normalizar(e.name)))
        .forEach(e => select.add(new Option(e.name, e.name)));
    select.add(new Option("+ Añadir evento", "__nuevo_turno__"));
}

// =============================
// INICIALIZACIÓN
// =============================
document.addEventListener("DOMContentLoaded", async () => {
    showTab("turnos");

    if (!IS_ADMIN) {
        document.querySelectorAll('[onclick*="registro"]').forEach(b => b.style.display = "none");
        const registroTab = document.getElementById("registro");
        if (registroTab) registroTab.style.display = "none";
    }

    const tFilter = document.getElementById("trabajador-filter");
    const mFilter = document.getElementById("mes-filter");
    if (tFilter) tFilter.addEventListener("change", filterTurnos);
    if (mFilter) mFilter.addEventListener("change", filterTurnos);

    const prevBtn = document.getElementById("calendar-prev");
    const nextBtn = document.getElementById("calendar-next");
    const closeDetailBtn = document.getElementById("calendar-day-detail-close");
    const detailPanel = document.getElementById("calendar-day-detail");
    if (prevBtn) prevBtn.addEventListener("click", () => moveCalendarMonth(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => moveCalendarMonth(1));
    if (closeDetailBtn) closeDetailBtn.addEventListener("click", hideCalendarDayDetail);
    if (detailPanel) {
        detailPanel.addEventListener("click", e => {
            if (e.target === detailPanel) hideCalendarDayDetail();
        });
    }
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") hideCalendarDayDetail();
    });

    if (document.getElementById("dia") && typeof flatpickr !== "undefined") {
        flatpickr("#dia", { dateFormat: "Y-m-d" });
    }

    await loadShifts();
    seleccionarMesActualPorDefecto();
    filterTurnos();

    if (!IS_ADMIN) return;

    const deleteSelect = document.getElementById("delete-select");
    const deleteMonthFilter = document.getElementById("delete-month-filter");
    const trabajadorSelect = document.getElementById("trabajador");
    const turnoSelect = document.getElementById("turno");
    const turnoForm = document.getElementById("turno-form");
    const deleteBtn = document.getElementById("delete-btn");

    await loadWorkers();
    await loadEvents();

    if (deleteMonthFilter) deleteMonthFilter.addEventListener("change", updateDeleteList);

    if (trabajadorSelect) {
        trabajadorSelect.addEventListener("change", () => {
            if (trabajadorSelect.value !== "__nuevo__") return;
            const nombre = prompt("Nombre del nuevo monitor/a:");
            if (!nombre) {
                trabajadorSelect.selectedIndex = 0;
                return;
            }
            trabajadorSelect.add(new Option(nombre, nombre), trabajadorSelect.length - 1);
            trabajadorSelect.value = nombre;
        });
    }

    if (turnoSelect) {
        turnoSelect.addEventListener("change", () => {
            if (turnoSelect.value !== "__nuevo_turno__") return;
            const nombre = prompt("Nombre del nuevo evento:");
            if (!nombre) {
                turnoSelect.selectedIndex = 0;
                return;
            }
            turnoSelect.add(new Option(nombre, nombre), turnoSelect.length - 1);
            turnoSelect.value = nombre;
        });
    }

    if (turnoForm && trabajadorSelect && turnoSelect) {
        turnoForm.addEventListener("submit", async e => {
            e.preventDefault();
            const fechaVal = document.getElementById("dia").value;
            if (!fechaVal) {
                alert("Por favor, selecciona una fecha");
                return;
            }

            await fetch(`${API_BASE}/add_shift.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    worker: trabajadorSelect.value,
                    event: turnoSelect.value,
                    date: fechaVal,
                    franja: document.getElementById("franja").value,
                    notes: document.getElementById("observaciones").value.trim()
                })
            });
            e.target.reset();
            await loadWorkers();
            showTab("turnos");
            await loadShifts();
        });
    }

    if (deleteBtn && deleteSelect) {
        deleteBtn.addEventListener("click", async () => {
            if (!deleteSelect.value) return;
            if (!confirm("¿Eliminar turno?")) return;
            await fetch(`${API_BASE}/delete_shift.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: deleteSelect.value })
            });
            await loadShifts();
        });
    }
});
