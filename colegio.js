document.addEventListener('DOMContentLoaded', () => {
    const fichaContainer = document.getElementById('ficha-colegio');

    // 1. Obtener el 'slug' de la URL amigable
    const path = window.location.pathname; // Obtiene la ruta, ej: "/colegio-montecastelo"
    const colegioSlug = path.substring(path.lastIndexOf('/') + 1);

    if (!colegioSlug) {
        fichaContainer.innerHTML = '<p class="alert alert-danger">Error: No se ha especificado ningún colegio.</p>';
        return;
    }

    // 2. Cargar los datos y encontrar el colegio correcto
    fetch('colegios.json?v=' + new Date().getTime())
        .then(response => response.json())
        .then(colegios => {
            const colegio = colegios.find(c => c.slug === colegioSlug);

            if (colegio) {
                renderFicha(colegio);
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
            <li class="list-group-item ${colegio.servicios.gabinete_psicopedagogico ? 'list-group-item-check' : 'list-group-item-cross'}">🧠 Gabinete Psicopedagógico</li>
        `;

        const fichaHTML = `
            <div class="card shadow-lg">
                <img src="${colegio.imagen_principal}" class="card-img-top" alt="Imagen de ${colegio.nombre}">
                <div class="card-body p-4">
                    <span class="badge bg-primary fs-6 mb-2">${colegio.tipo}</span>
                    <h1 class="card-title display-5">${colegio.nombre}</h1>
                    <h2 class="card-subtitle mb-3 text-muted">${colegio.direccion}</h2>
                    
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
                                <li class="list-group-item"><strong>Niños por aula:</strong> ${colegio.informacion_general.ninos_por_aula}</li>
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
});