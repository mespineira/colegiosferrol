document.addEventListener('DOMContentLoaded', () => {
    const fichaContainer = document.getElementById('ficha-colegio');

    // 1. Obtener el 'slug' de la URL amigable
    const path = window.location.pathname; // Esto funciona (ej: /colegio/ceip-a-laxe)
    const colegioSlug = path.substring(path.lastIndexOf('/') + 1);

    if (!colegioSlug) {
        fichaContainer.innerHTML = '<p class="alert alert-danger">Error: No se ha especificado ningún colegio.</p>';
        return;
    }

    // 2. Cargar los datos y encontrar el colegio correcto (RUTA CORREGIDA)
    fetch('/colegios.json?v=' + new Date().getTime()) // <-- RUTA CORREGIDA
        .then(response => response.json())
        .then(colegios => {
            const colegio = colegios.find(c => c.slug === colegioSlug);

            if (colegio) {
                renderFicha(colegio);
                renderSimilar(colegios, colegio);
            } else {
                fichaContainer.innerHTML = '<p class="alert alert-warning">No se ha encontrado el colegio especificado.</p>';
                document.title = 'Colegio no encontrado | Guía de Colegios en Ferrol';
            }
        })
        .catch(error => {
            console.error('Error al cargar la ficha del colegio:', error);
            fichaContainer.innerHTML = '<p class="alert alert-danger">No se pudo cargar la información del colegio.</p>';
        });

    // 3. Función para pintar la ficha completa en el HTML
    function renderFicha(colegio) {
        // Actualizar el título y la metadescripción (importante para SEO)
        document.title = `${colegio.nombre} | Guía de Colegios en Ferrol`;
        document.querySelector('meta[name="description"]').setAttribute('content', colegio.descripcion_corta);

        const cursosImpartidosHTML = `
            <li class="list-group-item ${colegio.cursos_impartidos.infantil ? 'list-group-item-check' : ''}">Educación Infantil</li>
            <li class="list-group-item ${colegio.cursos_impartidos.primaria ? 'list-group-item-check' : ''}">Educación Primaria</li>
            <li class="list-group-item ${colegio.cursos_impartidos.eso ? 'list-group-item-check' : ''}">Educación Secundaria Obligatoria (ESO)</li>
            <li class="list-group-item ${colegio.cursos_impartidos.bachillerato ? 'list-group-item-check' : ''}">Bachillerato</li>
        `;
        
        const serviciosHTML = `
            <li class="list-group-item ${colegio.servicios.transporte_escolar ? 'list-group-item-check' : 'list-group-item-cross'}">🚌 Transporte Escolar</li>
            <li class="list-group-item ${colegio.servicios.comedor ? 'list-group-item-check' : 'list-group-item-cross'}">🍽️ Comedor</li>
            <li class="list-group-item ${colegio.servicios.horario_ampliado ? 'list-group-item-check' : 'list-group-item-cross'}">🕒 Horario Ampliado</li>
            <li class="list-group-item ${colegio.servicios.gabinete_psicopedagogico ? 'list-group-item-check' : 'list-group-item-cross'}">🧠 Gabinete Psicopedagogico</li>
        `;

        const fichaHTML = `
            <div class="card shadow-lg">
                <div class="card-body p-4 p-md-5">
                    
                    <div class="row g-4 align-items-center mb-4">
                        <div class="col-lg-5">
                            <img src="${colegio.imagen_principal}" class="img-fluid rounded shadow-sm" alt="Imagen de ${colegio.nombre}">
                        </div>
                        <div class="col-lg-7">
                            <span class="badge bg-primary fs-6 mb-2">${colegio.tipo}</span>
                            <h1 class="card-title display-5">${colegio.nombre}</h1>
                            <h2 class="card-subtitle mb-3 text-muted">${colegio.direccion}</h2>
                        </div>
                    </div>

                    <hr class="my-4">

                    <div class="row">
                        <div class="col-md-8">
                            <h3>Proyecto Educativo</h3>
                            <p>${colegio.informacion_general.proyecto_educativo}</p>
                            
                            <h3>Profesorado</h3>
                            <p>${colegio.informacion_general.profesorado}</p>
                        </div>
                        <div class="col-md-4">
                            <ul class="list-group">
                                <li class="list-group-item"><strong>Nivel Académico:</strong> ${colegio.informacion_general.nivel_academico}</li>
                                <li class="list-group-item"><strong>Niños por aula:</strong> ${colegio.informacion_general.ninos_por_aula || 'No especificado'}</li>
                                <li class="list-group-item"><strong>Idiomas:</strong> ${colegio.informacion_general.idiomas.join(', ')}</li>
                            </ul>
                        </div>
                    </div>

                    <hr class="my-4">

                    <div class="row g-4">
                        <div class="col-md-6">
                            <h3>Cursos Impartidos</h3>
                            <ul class="list-group">${cursosImpartidosHTML}</ul>
                        </div>
                        <div class="col-md-6">
                            <h3>Servicios Disponibles</h3>
                            <ul class="list-group">${serviciosHTML}</ul>
                        </div>
                    </div>

                    <hr class="my-4">

                    <div class="row g-4">
                         <div class="col-md-6">
                            <h3>Instalaciones</h3>
                            <ul class="list-group">
                                ${colegio.instalaciones.map(item => `<li class="list-group-item">${item}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="col-md-6">
                            <h3>Actividades Extraescolares</h3>
                             <ul class="list-group">
                                ${colegio.actividades_extraescolares.map(item => `<li class="list-group-item">${item}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        fichaContainer.innerHTML = fichaHTML;
    }
    
    // =======================================================
    // == FUNCIÓN PARA MOSTRAR COLEGIOS SIMILARES ==
    // =======================================================
    function renderSimilar(todosLosColegios, colegioActual) {
        const similarContainer = document.getElementById('colegios-similares-container');
        if (!similarContainer) return; 

        const tipoActual = colegioActual.tipo;
        const idActual = colegioActual.id;
        const MAX_SIMILARES = 3;

        const colegiosSimilares = todosLosColegios.filter(c => {
            return c.tipo === tipoActual && c.id !== idActual;
        });

        const similaresBarajados = colegiosSimilares.sort(() => 0.5 - Math.random());
        const listaFinal = similaresBarajados.slice(0, MAX_SIMILARES);

        if (listaFinal.length === 0) {
            similarContainer.style.display = 'none'; 
            return;
        }

        let htmlSimilares = '<h2 class="mb-4">Otros colegios que te podrían interesar</h2><div class="row g-4">';

        listaFinal.forEach(colegio => {
            htmlSimilares += `
                <div class="col-md-4">
                    <div class="card h-100 shadow-sm card-colegio">
                        <img src="${colegio.imagen_principal}" class="card-img-top" alt="Fachada de ${colegio.nombre}">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">
                                <a href="/colegio/${colegio.slug}" class="text-decoration-none text-dark">${colegio.nombre}</a>
                            </h5>
                            <h6 class="card-subtitle mb-2 text-muted">${colegio.zona}</h6>
                            <p class="card-text">${colegio.descripcion_corta.substring(0, 90)}...</p>
                            <span class="badge bg-primary mb-2" style="width: fit-content;">${colegio.tipo}</span>
                            <div class="mt-auto pt-3">
                                <a href="/colegio/${colegio.slug}" class="btn btn-primary w-100">Ver ficha completa</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        htmlSimilares += '</div>';
        similarContainer.innerHTML = htmlSimilares;
    }
});