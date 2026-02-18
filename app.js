const API_BASE = "/api";
const IS_ADMIN = window.location.pathname.includes("/admin");

// =============================
// UTILIDADES
// =============================
function normalizar(txt) {
    return txt.toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
}

function formatDiaTitulo(fechaStr) {
    const fecha = new Date(fechaStr);
    const dia = fecha.toLocaleDateString("es-ES", { weekday: "long" });
    return dia.charAt(0).toUpperCase() + dia.slice(1) + " " + fecha.toLocaleDateString();
}

function seleccionarMesActualPorDefecto() {
    const ahora = new Date();
    const inputMes = document.getElementById("mes-filter");
    if(inputMes) inputMes.value = String(ahora.getMonth() + 1).padStart(2, "0");
}

function showTab(tab) {
    document.querySelectorAll(".tab-content").forEach(t => t.style.display = "none");
    document.getElementById(tab).style.display = "block";
}

// =============================
// RENDER TURNOS
// =============================
function renderShifts(data) {
    const cont = document.getElementById("turnos-container");
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

            const esPendiente = s.worker.trim() === "Monitor/a pendiente de confirmar";
            const rutaImagen = esPendiente ? "pendiente.PNG" : (s.image || "default.png");

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
    renderShifts(data);
}

function filterTurnos() {
    const t = document.getElementById("trabajador-filter").value;
    const m = document.getElementById("mes-filter").value;
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
    
    select.innerHTML = "";
    
    const prioridad = ["Gori", "Rober", "Paula MC", "Paula AS"];
    const nombres = data.map(w => w.name);
    
    // 1. Añadimos prioritarios (Gori será el primero)
    prioridad.forEach(n => { 
        if (nombres.includes(n)) select.add(new Option(n, n)); 
    });

    // 2. Añadimos resto de nombres
    nombres.filter(n => !prioridad.includes(n) && n !== "Monitor/a pendiente de confirmar")
           .forEach(n => select.add(new Option(n, n)));
    
    // 3. Añadimos el pendiente casi al final
    select.add(new Option("Monitor/a pendiente de confirmar", "Monitor/a pendiente de confirmar"));

    // 4. Opción para añadir nuevos
    select.add(new Option("+ Añadir monitor/a nuevo", "__nuevo__"));
    
    // FORZAR QUE EL PRIMERO (GORI) ESTÉ SELECCIONADO POR DEFECTO
    select.selectedIndex = 0;
}

async function loadEvents() {
    const res = await fetch(`${API_BASE}/get_events.php`);
    const data = await res.json();
    const select = document.getElementById("turno");
    select.innerHTML = "";
    let magiaAñadida = false;
    data.forEach(e => {
        const norm = normalizar(e.name);
        if (norm === "frankenstein") select.add(new Option("Frankenstein", e.name));
        if (norm === "escuela de magia" && !magiaAñadida) { select.add(new Option("Magia", e.name)); magiaAñadida = true; }
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
        document.getElementById("registro").style.display = "none";
    }

    const tFilter = document.getElementById("trabajador-filter");
    const mFilter = document.getElementById("mes-filter");
    if(tFilter) tFilter.addEventListener("change", filterTurnos);
    if(mFilter) mFilter.addEventListener("change", filterTurnos);

    flatpickr("#dia", { dateFormat: "Y-m-d" });
    await loadShifts();
    seleccionarMesActualPorDefecto();
    filterTurnos();

    if (!IS_ADMIN) return;

    const deleteSelect = document.getElementById("delete-select");
    const deleteMonthFilter = document.getElementById("delete-month-filter");
    const trabajadorSelect = document.getElementById("trabajador");
    const turnoSelect = document.getElementById("turno");

    await loadWorkers();
    await loadEvents();

    deleteMonthFilter.addEventListener("change", updateDeleteList);

    trabajadorSelect.addEventListener("change", () => {
        if (trabajadorSelect.value !== "__nuevo__") return;
        const nombre = prompt("Nombre del nuevo monitor/a:");
        if (!nombre) {
            trabajadorSelect.selectedIndex = 0; // Volver al primero si cancela
            return;
        }
        trabajadorSelect.add(new Option(nombre, nombre), trabajadorSelect.length - 1);
        trabajadorSelect.value = nombre;
    });

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

    document.getElementById("turno-form").addEventListener("submit", async e => {
        e.preventDefault();
        const fechaVal = document.getElementById("dia").value;
        if(!fechaVal) { alert("Por favor, selecciona una fecha"); return; }

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
        await loadWorkers(); // Recargar para asegurar que Gori vuelve a ser el seleccionado
        showTab("turnos");
        await loadShifts();
    });

    document.getElementById("delete-btn").addEventListener("click", async () => {
        if (!deleteSelect.value) return;
        if (!confirm("¿Eliminar turno?")) return;
        await fetch(`${API_BASE}/delete_shift.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: deleteSelect.value })
        });
        await loadShifts();
    });
});