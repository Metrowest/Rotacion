// Configuración inicial indexada de los grupos móviles y sus encargados correspondientes
let gruposMoviles = Array.of(1, 2, 5, 6);
let lideresMoviles = Array.of("Lázaro Cabrera", "Keiff Hernández", "Carlos Remolina", "Jorge Carlo");

// Mapeo estricto de asignación de tareas por mes para evitar repeticiones (Ciclo de 8 grupos)
const asignacionTareasPorMes = {
    "Julio & Agosto": "Grupos 1 y 3",
    "Septiembre & Octubre": "Grupos 2 y 4",
    "Noviembre & Diciembre": "Grupos 5 y 7",
    "Enero & Febrero": "Grupos 6 y 8",
    "Marzo & Abril": "Grupos 1 y 3",
    "Mayo & Junio": "Grupos 2 y 4"
};

// Referencias del DOM
const selectMeses = document.getElementById('selectMeses');
const headerMeses = document.getElementById('headerMeses');
const gruposTareas = document.getElementById('gruposTareas');
const btnRotar = document.getElementById('btnRotar');
const btnGuardar = document.getElementById('btnGuardar');
const btnInstalar = document.getElementById('btnInstalar');
const tablaBody = document.getElementById('tablaBody');

// 🔌 URL de Google Apps Script (Tu enlace activo)
const URL_GOOGLE_SHEETS = "https://script.google.com/macros/s/AKfycbwYRwPhuIdW68Wz1525TnVtarMBduun8KhaOiXWMQH-dJmHjJblCLYCeOXdjXZyPx24/exec"; 

// 1. Sincronizar selectores
selectMeses.addEventListener('change', () => {
    const mesSeleccionado = selectMeses.value;
    headerMeses.textContent = mesSeleccionado;
    gruposTareas.textContent = asignacionTareasPorMes[mesSeleccionado] || "No asignados";
});

// 2. FUNCIÓN DE ACTUALIZACIÓN FORZADA (Garantiza que el grupo y su encargado roten juntos)
function actualizarTablaGrupos() {
    const filas = tablaBody.querySelectorAll('tr');
    const gruposFijos = Array.of(3, 4, 7, 8);

    filas.forEach((fila, index) => {
        // Actualiza el texto de la columna Grupos
        const inputGrupo = fila.querySelector('.input-grupo');
        inputGrupo.value = `Grupos ${gruposFijos[index]} y ${gruposMoviles[index]}`;
        
        // Actualiza forzadamente el texto de la columna "Encargado que Rota"
        const inputMovil = fila.querySelector('.input-movil');
        inputMovil.value = lideresMoviles[index];
    });
}

// 3. Botón de Rotación Cíclica en paralelo
btnRotar.addEventListener('click', () => {
    // Rotar los números de los grupos
    const ultimoGrupo = gruposMoviles.pop();
    gruposMoviles.unshift(ultimoGrupo);

    // Rotar los nombres de los líderes en idéntico orden
    const ultimoLider = lideresMoviles.pop();
    lideresMoviles.unshift(ultimoLider);
    
    // Forzar el redibujado en la pantalla de la PWA
    actualizarTablaGrupos();
});

// 4. Guardar los datos estructurados en las 6 columnas de Google Sheets
btnGuardar.addEventListener('click', async () => {
    if (!URL_GOOGLE_SHEETS) {
        alert("⚠️ Configura la URL de Google Sheets en app.js");
        return;
    }

    const datos = {
        mes: selectMeses.value,
        filas: []
    };

    const filas = tablaBody.querySelectorAll('tr');
    filas.forEach(fila => {
        datos.filas.push({
            grupos: fila.querySelector('.input-grupo').value.trim(),
            fijo: fila.querySelector('.input-fijo').value.trim(),
            movil: fila.querySelector('.input-movil').value.trim(),
            hogar: fila.querySelector('.input-hogar').value.trim(),
            direccion: fila.querySelector('.input-direccion').value.trim()
        });
    });

    try {
        btnGuardar.textContent = "⏳ Guardando...";
        btnGuardar.disabled = true;

        await fetch(URL_GOOGLE_SHEETS, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: JSON.stringify(datos)
        });

        alert("✅ Cambios enviados con éxito. Revisa tu Google Sheets.");

    } catch (error) {
        alert("❌ Error de red al intentar guardar.");
    } finally {
        btnGuardar.textContent = "💾 Guardar Cambios en la Nube";
        btnGuardar.disabled = false;
    }
});

// 5. Service Worker e Instalación
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js');
    });
}

let eventoInstalacion;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    eventoInstalacion = e;
    btnInstalar.style.display = 'block';
});

btnInstalar.addEventListener('click', async () => {
    if (eventoInstalacion) {
        eventoInstalacion.prompt();
        const { outcome } = await eventoInstalacion.userChoice;
        if (outcome === 'accepted') btnInstalar.style.display = 'none';
        eventoInstalacion = null;
    }
});