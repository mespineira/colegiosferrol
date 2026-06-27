document.addEventListener('DOMContentLoaded', () => {
    const spinner = document.getElementById('loading-spinner');
    const form = document.getElementById('form-gestionar');
    const msgBox = document.getElementById('mensaje-feedback');
    const titulo = document.getElementById('titulo-centro');

    // 1. EXTRAER ID DE LA URL
    const urlParams = new URLSearchParams(window.location.search);
    const colegioId = urlParams.get('id');

    if (!colegioId) {
        mostrarError("Enlace no válido. Faltan credenciales de acceso en la URL.");
        return;
    }

    let colegioOriginal = null;

    // 2. RECUPERAR COLEGIO DE colegios.json
    fetch('/colegios.json?v=' + new Date().getTime())
        .then(res => res.json())
        .then(data => {
            // Permitir id como entero o string dependiendo de lo que pase el JSON
            colegioOriginal = data.find(c => String(c.id) === String(colegioId));
            
            if (!colegioOriginal) {
                mostrarError("No se ha encontrado el colegio con el identificador facilitado.");
                return;
            }

            // 3. AUTO-RELLENAR FORMULARIO
            popularFormulario(colegioOriginal);
            
            spinner.classList.add('d-none');
            form.classList.remove('d-none');
        })
        .catch(err => {
            console.error(err);
            mostrarError("Hubo un fallo de red al conectar con la base de datos.");
        });

    // 4. ENVÍO DE DATOS
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const btnSubmit = document.getElementById('btn-guardar-ficha');
        const textBtn = btnSubmit.innerHTML;
        btnSubmit.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Transmitiendo...`;
        btnSubmit.disabled = true;

        // Construir el objeto JSON respetando exactamente la estructura de colegios.json
        const payload = empaquetarColegio(colegioOriginal);

        fetch('/enviar_cambios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(respuesta => {
            if (respuesta.success) {
                // Success total, UI Cleanup
                form.classList.add('d-none');
                msgBox.classList.remove('d-none', 'alert-danger');
                msgBox.classList.add('alert-success');
                msgBox.innerHTML = `<strong>Éxito.</strong> Su información ha sido enviada al administrador y será publicada tras una breve revisión visual. Muchas gracias por colaborar con la Guía de Colegios de Ferrol.`;
                window.scrollTo(0,0);
            } else {
                mostrarError(respuesta.message || "Error al procesar el JSON en el servidor.");
            }
        })
        .catch(err => {
            console.error(err);
            mostrarError("Error en la conexión con el administrador de correos.");
        })
        .finally(() => {
            btnSubmit.innerHTML = textBtn;
            btnSubmit.disabled = false;
        });
    });
});

// FUNCIONES DE APOYO

function mostrarError(mensaje) {
    const spinner = document.getElementById('loading-spinner');
    const msgBox = document.getElementById('mensaje-feedback');
    spinner.classList.add('d-none');
    msgBox.classList.remove('d-none');
    msgBox.classList.add('alert-danger');
    msgBox.innerText = mensaje;
}

function popularFormulario(c) {
    document.getElementById('titulo-centro').innerText = `Gestionar: ${c.nombre}`;
    
    // Hidden e info básica
    document.getElementById('admin-id').value = c.id;
    document.getElementById('admin-slug').value = c.slug;
    document.getElementById('admin-nombre').value = c.nombre;
    document.getElementById('admin-tipo').value = c.tipo;
    document.getElementById('admin-zona').value = c.zona;
    document.getElementById('admin-direccion').value = c.direccion;
    document.getElementById('admin-latitud').value = c.latitud || '';
    document.getElementById('admin-longitud').value = c.longitud || '';
    document.getElementById('admin-imagen').value = c.imagen_principal || '';
    document.getElementById('admin-telefono').value = c.telefono || '';
    document.getElementById('admin-desc-corta').value = c.descripcion_corta || '';

    // Info General
    const inf = c.informacion_general || {};
    document.getElementById('admin-nivel-acad').value = inf.nivel_academico || '';
    document.getElementById('admin-profesorado').value = inf.profesorado || '';
    document.getElementById('admin-proy-educ').value = inf.proyecto_educativo || '';
    document.getElementById('admin-ratio').value = inf.ninos_por_aula || '';

    // Switches de cursos
    const bCursos = c.cursos_impartidos || {};
    document.getElementById('admin-curso-inf').checked = !!bCursos.infantil;
    document.getElementById('admin-curso-pri').checked = !!bCursos.primaria;
    document.getElementById('admin-curso-eso').checked = !!bCursos.eso;
    document.getElementById('admin-curso-bac').checked = !!bCursos.bachillerato;
    document.getElementById('admin-curso-fp').checked = !!bCursos.fp;

    // Servicios
    const bServ = c.servicios || {};
    document.getElementById('admin-serv-com').checked = !!bServ.comedor;
    document.getElementById('admin-serv-tra').checked = !!bServ.transporte_escolar;
    document.getElementById('admin-serv-hor').checked = !!bServ.horario_ampliado;
    document.getElementById('admin-serv-psi').checked = !!bServ.gabinete_psicopedagogico;

    // Horarios
    const h = c.horarios || {};
    document.getElementById('admin-horario-sec').value = h.secretaria || '';
    document.getElementById('admin-horario-lec').value = h.lectivo || '';

    // Listas Dinámicas
    renderDynamicList('admin-idiomas-container', inf.idiomas || []);
    renderDynamicList('admin-instalaciones-container', c.instalaciones || []);
    renderDynamicList('admin-extraes-container', c.actividades_extraescolares || []);
}

function renderDynamicList(containerId, arrayDatos) {
    const cont = document.getElementById(containerId);
    cont.innerHTML = '';
    arrayDatos.forEach(val => addDynamicField(containerId, val));
}

// Función global (expuesta) para el botoncillo onclick
window.addDynamicField = function(containerId, value = '') {
    const cont = document.getElementById(containerId);
    const wrapper = document.createElement('div');
    wrapper.className = 'input-group';
    wrapper.innerHTML = `
        <input type="text" class="form-control" value="${value.replace(/"/g, '&quot;')}">
        <button class="btn btn-outline-danger" type="button" onclick="this.parentElement.remove()">X</button>
    `;
    cont.appendChild(wrapper);
}

function getDynamicListValues(containerId) {
    const cont = document.getElementById(containerId);
    const inputs = cont.querySelectorAll('input');
    const valores = [];
    inputs.forEach(inp => {
        if(inp.value.trim() !== '') valores.push(inp.value.trim());
    });
    return valores;
}

function empaquetarColegio(original) {
    // Tomamos todos los inputs y formateamos el root
    let lat = document.getElementById('admin-latitud').value;
    let lon = document.getElementById('admin-longitud').value;

    return {
        id: original.id, // Lo conservamos por seguridad tipo
        nombre: document.getElementById('admin-nombre').value.trim(),
        slug: original.slug, // Mantenemos el slug
        tipo: document.getElementById('admin-tipo').value,
        zona: document.getElementById('admin-zona').value.trim(),
        direccion: document.getElementById('admin-direccion').value.trim(),
        latitud: lat ? parseFloat(lat) : original.latitud,
        longitud: lon ? parseFloat(lon) : original.longitud,
        logo: original.logo, // Reservado
        imagen_principal: document.getElementById('admin-imagen').value.trim(),
        descripcion_corta: document.getElementById('admin-desc-corta').value.trim(),
        
        informacion_general: {
            nivel_academico: document.getElementById('admin-nivel-acad').value.trim(),
            profesorado: document.getElementById('admin-profesorado').value.trim(),
            ninos_por_aula: parseInt(document.getElementById('admin-ratio').value) || 25,
            idiomas: getDynamicListValues('admin-idiomas-container'),
            proyecto_educativo: document.getElementById('admin-proy-educ').value.trim()
        },
        servicios: {
            transporte_escolar: document.getElementById('admin-serv-tra').checked,
            comedor: document.getElementById('admin-serv-com').checked,
            horario_ampliado: document.getElementById('admin-serv-hor').checked,
            gabinete_psicopedagogico: document.getElementById('admin-serv-psi').checked
        },
        cursos_impartidos: {
            infantil: document.getElementById('admin-curso-inf').checked,
            primaria: document.getElementById('admin-curso-pri').checked,
            eso: document.getElementById('admin-curso-eso').checked,
            bachillerato: document.getElementById('admin-curso-bac').checked,
            fp: document.getElementById('admin-curso-fp').checked
        },
        instalaciones: getDynamicListValues('admin-instalaciones-container'),
        actividades_extraescolares: getDynamicListValues('admin-extraes-container'),
        telefono: document.getElementById('admin-telefono').value.trim(),
        horarios: {
            secretaria: document.getElementById('admin-horario-sec').value.trim(),
            lectivo: document.getElementById('admin-horario-lec').value.trim()
        },
        mapa_iframe: original.mapa_iframe // Dejamos intocable el iframe duro
    };
}
