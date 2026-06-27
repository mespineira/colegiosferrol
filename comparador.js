document.addEventListener('DOMContentLoaded', () => {
    // Inicializar UI del Comparador (Sticky Bar, Modal, Toasts)
    inicializarUIComparador();
    // Actualizar estado visual de los botones que puedan existir en el DOM
    actualizarBotonesComparador();
});

const CLAVE_LOCALSTORAGE = 'comparador_colegios_ferrol';
const MAX_COLEGIOS = 3;

// --- LOGICA DE STATE ---

function obtenerColegiosComparador() {
    const guardados = localStorage.getItem(CLAVE_LOCALSTORAGE);
    return guardados ? JSON.parse(guardados) : [];
}

function guardarColegiosComparador(listaIds) {
    localStorage.setItem(CLAVE_LOCALSTORAGE, JSON.stringify(listaIds));
    actualizarBotonesComparador();
    actualizarStickyBar();
}

// Global para llamar desde HTML
window.toggleComparar = function (id) {
    let colegios = obtenerColegiosComparador();
    const index = colegios.indexOf(id);

    if (index !== -1) {
        // Si ya está, lo quitamos
        colegios.splice(index, 1);
        guardarColegiosComparador(colegios);
    } else {
        // Si no está, intentamos añadirlo
        if (colegios.length >= MAX_COLEGIOS) {
            mostrarToastError(`Solo puedes comparar un máximo de ${MAX_COLEGIOS} colegios a la vez. <br> Elimina alguno primero.`);
            return;
        }
        colegios.push(id);
        guardarColegiosComparador(colegios);
        mostrarToastExito('Colegio añadido al comparador.');
    }
}

// --- LOGICA DE UI (BOTONES) ---

function actualizarBotonesComparador() {
    const colegiosGuardados = obtenerColegiosComparador();
    const botones = document.querySelectorAll('.btn-comparar');

    botones.forEach(btn => {
        const id = parseInt(btn.getAttribute('data-id'));
        if (colegiosGuardados.includes(id)) {
            // Estado: Añadido
            btn.classList.remove('btn-outline-primary', 'btn-primary');
            btn.classList.add('btn-success');
            // Cambiar ícono/texto
            btn.innerHTML = '✓ Añadido para comparar';
        } else {
            // Estado: No añadido
            btn.classList.remove('btn-success');

            // Lógica para diferenciar botones principales en index vs ficha
            if (btn.classList.contains('btn-comparar-ficha')) {
                btn.classList.add('btn-primary');
            } else {
                btn.classList.add('btn-outline-primary');
            }

            btn.innerHTML = '+ Añadir al comparador';
        }
    });

    // Siempre refrescar el Sticky Bar cuando se actualicen los botones
    actualizarStickyBar();
}


// --- LOGICA DE UI (STICKY BAR Y MODAL) ---

function inicializarUIComparador() {
    // 1. Inyectar contenedor para Toasts
    if (!document.getElementById('toast-container-comparador')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container-comparador';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1060'; // Encima de casi todo
        toastContainer.style.marginBottom = '80px'; // Encima de la sticky bar
        document.body.appendChild(toastContainer);
    }

    // 2. Inyectar Sticky Bar
    if (!document.getElementById('sticky-bar-comparador')) {
        const stickyBar = document.createElement('div');
        stickyBar.id = 'sticky-bar-comparador';
        stickyBar.className = 'sticky-comparador bg-dark text-white shadow-lg py-3 px-3 d-none';
        stickyBar.innerHTML = `
            <div class="container d-flex flex-column flex-md-row justify-content-between align-items-center">
                <div class="mb-2 mb-md-0 d-flex align-items-center">
                    <span class="badge bg-primary rounded-pill fs-5 me-2" id="sticky-bar-count">0</span>
                    <span class="fs-6 fw-bold">colegios seleccionados para comparar</span>
                </div>
                <div>
                     <button class="btn btn-outline-light btn-sm me-2" onclick="limpiarComparador()">Limpiar</button>
                     <button class="btn btn-primary" onclick="abrirModalComparativa()">Ver comparativa ahora</button>
                </div>
            </div>
        `;
        document.body.appendChild(stickyBar);
    }

    // 3. Inyectar Modal de la Tabla
    if (!document.getElementById('modal-comparador')) {
        const modal = document.createElement('div');
        modal.id = 'modal-comparador';
        modal.className = 'modal fade';
        modal.tabIndex = '-1';
        modal.setAttribute('aria-labelledby', 'modal-comparador-label');
        modal.setAttribute('aria-hidden', 'true');
        modal.innerHTML = `
            <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title" id="modal-comparador-label">Comparativa de Colegios</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body p-0">
                        <!-- Aquí va la tabla generada dinámicamente -->
                        <div id="modal-comparador-contenido" class="table-responsive"></div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

function actualizarStickyBar() {
    const colegiosGuardados = obtenerColegiosComparador();
    const stickyBar = document.getElementById('sticky-bar-comparador');
    const counter = document.getElementById('sticky-bar-count');

    if (stickyBar && counter) {
        counter.textContent = colegiosGuardados.length;
        if (colegiosGuardados.length > 0) {
            stickyBar.classList.remove('d-none');
        } else {
            stickyBar.classList.add('d-none');
            // Si no hay colegios y el modal está abierto, lo cerramos
            const modalEl = document.getElementById('modal-comparador');
            if (modalEl && modalEl.classList.contains('show')) {
                const modalInst = bootstrap.Modal.getInstance(modalEl);
                if (modalInst) modalInst.hide();
            }
        }
    }
}

window.limpiarComparador = function () {
    guardarColegiosComparador([]);
}

window.abrirModalComparativa = function () {
    const colegiosIds = obtenerColegiosComparador();
    if (colegiosIds.length === 0) return;

    const contenidoContainer = document.getElementById('modal-comparador-contenido');
    contenidoContainer.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Cargando datos...</p></div>';

    // Abrir modal usando Bootstrap de forma programática
    const modalComp = new bootstrap.Modal(document.getElementById('modal-comparador'));
    modalComp.show();

    fetch('/colegios.json?v=' + new Date().getTime())
        .then(response => response.json())
        .then(data => {
            const colegiosAComparar = data.filter(c => colegiosIds.includes(c.id));
            generarTablaComparativa(colegiosAComparar, contenidoContainer);
        })
        .catch(error => {
            console.error("Error cargando colegios para comparar", error);
            contenidoContainer.innerHTML = '<div class="alert alert-danger m-3">Hubo un error cargando la comparativa.</div>';
        });
}

function generarTablaComparativa(colegios, container) {
    if (colegios.length === 0) {
        container.innerHTML = '<p class="text-center p-4">No hay colegios seleccionados.</p>';
        return;
    }

    let cabeceras = `<th>Características</th>`;
    let filasEstructura = {
        'Tipo': [],
        'Niveles': [],
        'Servicios': [],
        'Instalaciones': [],
        'Alumnos por aula': [],
        'Zona': [],
        'Acción': []
    };

    colegios.forEach(c => {
        // Cabecera (Imagen + Nombre)
        cabeceras += `
            <th class="text-center align-top p-3" style="min-width: 250px;">
                <img src="${c.imagen_principal}" class="img-fluid rounded shadow-sm mb-2" style="max-height: 120px; object-fit: cover; width: 100%;" alt="${c.nombre}">
                <h5 class="mb-0"><a href="/colegio/${c.slug}" class="text-decoration-none text-dark" target="_blank">${c.nombre} <small>&nearr;</small></a></h5>
            </th>
        `;

        // Tipo
        filasEstructura['Tipo'].push(`<span class="badge bg-secondary fs-6">${c.tipo}</span>`);

        // Zona
        filasEstructura['Zona'].push(c.zona);

        // Niveles
        let nivelesStr = [];
        if (c.cursos_impartidos.infantil) nivelesStr.push('Infantil');
        if (c.cursos_impartidos.primaria) nivelesStr.push('Primaria');
        if (c.cursos_impartidos.eso) nivelesStr.push('ESO');
        if (c.cursos_impartidos.bachillerato) nivelesStr.push('Bach.');
        filasEstructura['Niveles'].push(nivelesStr.join(', '));

        // Servicios
        let serviciosHTML = '<ul class="list-unstyled mb-0 text-start d-inline-block">';
        serviciosHTML += `<li class="${c.servicios.comedor ? 'text-success' : 'text-danger'}">${c.servicios.comedor ? '✓' : '✗'} Comedor</li>`;
        serviciosHTML += `<li class="${c.servicios.transporte_escolar ? 'text-success' : 'text-danger'}">${c.servicios.transporte_escolar ? '✓' : '✗'} Transporte</li>`;
        serviciosHTML += `<li class="${c.servicios.horario_ampliado ? 'text-success' : 'text-danger'}">${c.servicios.horario_ampliado ? '✓' : '✗'} Madrugadores</li>`;
        serviciosHTML += `<li class="${c.servicios.gabinete_psicopedagogico ? 'text-success' : 'text-danger'}">${c.servicios.gabinete_psicopedagogico ? '✓' : '✗'} Orientación</li>`;
        serviciosHTML += '</ul>';
        filasEstructura['Servicios'].push(serviciosHTML);

        // Instalaciones (Top 3)
        const topInstalaciones = c.instalaciones && c.instalaciones.length > 0 ? c.instalaciones.slice(0, 3).join('<br> &bull; ') : 'No especificadas';
        filasEstructura['Instalaciones'].push(topInstalaciones ? `&bull; ${topInstalaciones}` : '-');

        // Alumnos por aula
        filasEstructura['Alumnos por aula'].push(c.informacion_general.ninos_por_aula ? `${c.informacion_general.ninos_por_aula}` : 'No especificado');

        // Acción
        filasEstructura['Acción'].push(`<button class="btn btn-outline-danger btn-sm" onclick="quitarColegioComparativa(${c.id})">Quitar</button>`);
    });

    let htmlTabla = `
        <table class="table table-bordered table-striped table-hover mb-0 text-center align-middle">
            <thead class="table-light">
                <tr>${cabeceras}</tr>
            </thead>
            <tbody>
    `;

    for (const prop in filasEstructura) {
        htmlTabla += `<tr><th class="text-start bg-light align-middle">${prop}</th>`;
        filasEstructura[prop].forEach(val => {
            htmlTabla += `<td>${val}</td>`;
        });
        htmlTabla += `</tr>`;
    }

    htmlTabla += `</tbody></table>`;
    container.innerHTML = htmlTabla;
}

window.quitarColegioComparativa = function (id) {
    toggleComparar(id);
    abrirModalComparativa(); // Recargar modal
}

// --- UTILIDADES TOAST ---

function mostrarToastError(mensaje) {
    lanzarToast(mensaje, 'bg-danger text-white');
}

function mostrarToastExito(mensaje) {
    lanzarToast(mensaje, 'bg-success text-white');
}

function lanzarToast(mensaje, colorClasses) {
    const container = document.getElementById('toast-container-comparador');
    if (!container) return;

    const idToast = 'toast-' + Date.now();
    const html = `
        <div id="${idToast}" class="toast align-items-center ${colorClasses} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body fw-bold">
                    ${mensaje}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', html);
    const toastEl = document.getElementById(idToast);
    const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
    toast.show();

    // Limpiar del DOM al ocultar
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}
