document.addEventListener('DOMContentLoaded', () => {
    const fichaContainer = document.getElementById('ficha-colegio');

    // Inyectar URL Canónica dinámicamente
    const canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    canonicalLink.href = 'https://colegiosferrol.es' + window.location.pathname;
    document.head.appendChild(canonicalLink);

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

                // Inyectar el nombre del colegio actual en la recomendación editorial
                const nombreColegioExtraescolar = document.getElementById('nombre-colegio-extraescolar');
                if (nombreColegioExtraescolar) {
                    nombreColegioExtraescolar.textContent = colegio.nombre;
                }
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
        // Actualizar el título y la metadescripción orientados al clic (SEO)
        document.title = `${colegio.nombre} en Ferrol: Opiniones, Servicios y Plazas 2026.`;
        let serviciosExtra = [];
        if (colegio.servicios.comedor) serviciosExtra.push('comedor');
        if (colegio.servicios.transporte_escolar) serviciosExtra.push('transporte escolar');
        let txtServicios = serviciosExtra.length > 0 ? ` Cuenta con servicio de ${serviciosExtra.join(' y ')}.` : '';
        document.querySelector('meta[name="description"]').setAttribute('content', `Descubre el ${colegio.nombre}.${txtServicios} Lee opiniones reales de otras familias aquí. ${colegio.descripcion_corta}`);

        const cursosImpartidosHTML = `
            <li class="list-group-item ${colegio.cursos_impartidos.infantil ? 'list-group-item-check' : ''}">Educación Infantil</li>
            <li class="list-group-item ${colegio.cursos_impartidos.primaria ? 'list-group-item-check' : ''}">Educación Primaria</li>
            <li class="list-group-item ${colegio.cursos_impartidos.eso ? 'list-group-item-check' : ''}">Educación Secundaria Obligatoria (ESO)</li>
            <li class="list-group-item ${colegio.cursos_impartidos.bachillerato ? 'list-group-item-check' : ''}">Bachillerato</li>
        `;

        const badgesArr = [];
        if (colegio.servicios.transporte_escolar) badgesArr.push('<span class="badge bg-success rounded-pill px-3 py-2 me-2 mb-2"><i class="bi bi-bus-front"></i> Transporte Escolar</span>');
        if (colegio.servicios.comedor) badgesArr.push('<span class="badge bg-info rounded-pill px-3 py-2 me-2 mb-2"><i class="bi bi-cup-hot"></i> Comedor</span>');
        if (colegio.servicios.horario_ampliado) badgesArr.push('<span class="badge bg-warning text-dark rounded-pill px-3 py-2 me-2 mb-2"><i class="bi bi-clock-history"></i> Horario Ampliado</span>');
        if (colegio.servicios.gabinete_psicopedagogico) badgesArr.push('<span class="badge bg-primary rounded-pill px-3 py-2 me-2 mb-2"><i class="bi bi-person-hearts"></i> Gabinete Psicopedagógico</span>');
        const serviciosHTML = badgesArr.length > 0 ? badgesArr.join('') : '<p class="text-muted">Sin servicios adicionales.</p>';

        // UI/UX Mobile-First Additions
        let btnLlamarHTML = '';
        if (colegio.telefono) {
            btnLlamarHTML = `
                <div id="btn-llamar-container" class="position-fixed bottom-0 end-0 p-3 d-md-none" style="z-index: 1050;">
                    <a href="tel:${colegio.telefono.replace(/\s+/g, '')}" aria-label="Llamar al centro educativo" class="btn btn-success btn-lg rounded-pill shadow-lg d-flex align-items-center">
                        <span class="fs-4 me-2"><i class="bi bi-telephone-fill"></i></span> Llamar ahora
                    </a>
                </div>
            `;
            // Añadir al DOM general de la página en lugar del contenedor de la ficha
            const body = document.querySelector('body');
            const existingBtn = document.getElementById('btn-llamar-container');
            if (existingBtn) existingBtn.remove();
            body.insertAdjacentHTML('beforeend', btnLlamarHTML);
            // Padding dinámico para que no tape contenidos como las opiniones
            body.style.paddingBottom = "80px";
        }

        let horariosHTML = '';
        if (colegio.horarios) {
            horariosHTML = `
                <hr class="my-4">
                <div class="row">
                    <div class="col-12 mb-4">
                        <div class="card bg-light border-0 shadow-sm">
                            <div class="card-body">
                                <h3 class="card-title h5 text-primary mb-3">🕒 Horarios</h3>
                                <ul class="list-unstyled mb-0">
                                    <li class="mb-2"><strong>Secretaría:</strong> <span class="text-muted">${colegio.horarios.secretaria || 'No especificado'}</span></li>
                                    <li><strong>Lectivo:</strong> <span class="text-muted">${colegio.horarios.lectivo || 'No especificado'}</span></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        let mapaHTML = '';
        if (colegio.mapa_iframe) {
            mapaHTML = `
                <hr class="my-4">
                <h3 class="mb-3">📍 Ubicación en el Mapa</h3>
                <div class="ratio ratio-21x9 rounded overflow-hidden shadow-sm">
                    ${colegio.mapa_iframe}
                </div>
            `;
        }

        const fichaHTML = `
            <div class="card shadow-lg">
                <div class="card-body p-4 p-md-5">
                    
                    <div class="row g-4 align-items-center mb-4">
                        <div class="col-lg-5">
                            <img src="${colegio.imagen_principal}" class="img-fluid rounded shadow-sm" alt="Imagen de ${colegio.nombre}" loading="lazy" width="600" height="400" style="object-fit: cover;" onerror="this.onerror=null; this.src=\'/img/default-ferrol.jpg\';">
                        </div>
                        <div class="col-lg-7">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <span class="badge bg-primary fs-6">${colegio.tipo}</span>
                                <button class="btn btn-primary btn-sm btn-comparar btn-comparar-ficha" data-id="${colegio.id}" onclick="toggleComparar(${colegio.id})">
                                    + Añadir al comparador
                                </button>
                            </div>
                            <h1 class="card-title display-5">${colegio.nombre}</h1>
                            <h2 class="card-subtitle mb-3 text-muted">${colegio.direccion}</h2>
                        </div>
                    </div>

                    ${horariosHTML}

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
                                ${colegio.telefono ? `<li class="list-group-item"><strong>Teléfono:</strong> <a href="tel:${colegio.telefono}">${colegio.telefono}</a></li>` : ''}
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
                            <div class="d-flex flex-wrap">${serviciosHTML}</div>
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

                    ${mapaHTML}
                </div>
            </div>
        `;

        fichaContainer.innerHTML = fichaHTML;

        // Inyectar Schema.org JSON-LD
        inyectarSchemaOrg(colegio);

        // Inicializar sistema de opiniones
        inicializarOpiniones(colegio.id);

        // Actualizar botones si el script de comparador ya está cargado
        if (typeof actualizarBotonesComparador === 'function') {
            actualizarBotonesComparador();
        }
    }

    // =======================================================
    // == FUNCIÓN PARA GENERAR SCHEMA.ORG (JSON-LD) ==
    // =======================================================
    function inyectarSchemaOrg(colegio) {
        // Eliminar script anterior si existe
        const scriptPrevio = document.getElementById('schema-colegio');
        if (scriptPrevio) {
            scriptPrevio.remove();
        }

        // Mapear AmenityFeatures basados en los servicios
        let amenities = [];
        if (colegio.servicios) {
            if (colegio.servicios.comedor) {
                amenities.push({ "@type": "LocationFeatureSpecification", "name": "Comedor Escolar", "value": true });
            }
            if (colegio.servicios.transporte_escolar) {
                amenities.push({ "@type": "LocationFeatureSpecification", "name": "Transporte Escolar", "value": true });
            }
            if (colegio.servicios.horario_ampliado) {
                amenities.push({ "@type": "LocationFeatureSpecification", "name": "Horario Ampliado / Madrugadores", "value": true });
            }
            if (colegio.servicios.gabinete_psicopedagogico) {
                amenities.push({ "@type": "LocationFeatureSpecification", "name": "Gabinete Psicopedagógico", "value": true });
            }
        }

        const schemaJSON = {
            "@context": "https://schema.org",
            "@type": "School",
            "name": colegio.nombre,
            "description": colegio.descripcion_corta,
            "address": {
                "@type": "PostalAddress",
                "streetAddress": colegio.direccion,
                "addressLocality": "Ferrol",
                "addressRegion": "Galicia",
                "addressCountry": "ES"
            },
            "image": colegio.imagen_principal || null,
            "telephone": colegio.telefono || "", // Por si en el JSON en un futuro se añade telefono directo
            "url": window.location.href,
            "amenityFeature": amenities
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'schema-colegio';
        script.text = JSON.stringify(schemaJSON, null, 2);

        document.head.appendChild(script);
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
                        <img src="${colegio.imagen_principal}" class="card-img-top" alt="Fachada de ${colegio.nombre}" loading="lazy" width="400" height="250" style="object-fit: cover;" onerror="this.onerror=null; this.src=\'/img/default-ferrol.jpg\';">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">
                                <a href="/colegio/${colegio.slug}" class="text-decoration-none text-dark">${colegio.nombre}</a>
                            </h5>
                            <h6 class="card-subtitle mb-2 text-muted">${colegio.zona}</h6>
                            <p class="card-text">${colegio.descripcion_corta.substring(0, 90)}...</p>
                            <span class="badge bg-primary mb-2" style="width: fit-content;">${colegio.tipo}</span>
                            <div class="mt-auto pt-3 position-relative" style="z-index: 2;">
                                <button class="btn btn-outline-primary w-100 mb-2 btn-comparar" data-id="${colegio.id}" onclick="event.preventDefault(); event.stopPropagation(); toggleComparar(${colegio.id})">
                                    + Añadir al comparador
                                </button>
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

    // =======================================================
    // == SISTEMA LIGERO DE OPINIONES ==
    // =======================================================
    function inicializarOpiniones(colegioId) {
        document.getElementById('op-id-colegio').value = colegioId;
        cargarOpiniones(colegioId);

        document.getElementById('form-opinion').addEventListener('submit', function (e) {
            e.preventDefault();

            const btn = document.getElementById('btn-enviar-opinion');
            const msgContainer = document.getElementById('op-mensaje');
            btn.disabled = true;
            btn.innerHTML = 'Enviando...';
            msgContainer.innerHTML = '';

            const formData = new FormData(this);

            fetch('/guardar_opinion.php', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    btn.disabled = false;
                    btn.innerHTML = 'Publicar Opinión';

                    if (data.success) {
                        msgContainer.innerHTML = '<div class="alert alert-success mt-2">¡Gracias por tu opinión! Se ha publicado correctamente.</div>';
                        this.reset();
                        // Recargar opiniones
                        cargarOpiniones(colegioId);
                    } else {
                        msgContainer.innerHTML = `<div class="alert alert-danger mt-2">Error: ${data.message || 'No se pudo guardar la opinión.'}</div>`;
                    }
                })
                .catch(error => {
                    console.error("Error al enviar opinión:", error);
                    btn.disabled = false;
                    btn.innerHTML = 'Publicar Opinión';
                    msgContainer.innerHTML = '<div class="alert alert-danger mt-2">Hubo un error de conexión al enviar tu opinión.</div>';
                });
        });
    }

    function cargarOpiniones(colegioId) {
        const contenedor = document.getElementById('lista-opiniones');

        // Añadir cache-busting para evitar que traiga versiones cacheadas
        fetch(`/opiniones.json?v=${new Date().getTime()}`)
            .then(response => {
                if (!response.ok) throw new Error("Fichero opiniones.json no encontrado");
                return response.json();
            })
            .then(opinionesGlobales => {
                const opinionesColegio = opinionesGlobales.filter(op => op.id_colegio == colegioId);

                if (opinionesColegio.length === 0) {
                    contenedor.innerHTML = '<p class="text-muted text-center italic">Sé el primero en dejar una opinión sobre este colegio.</p>';
                    return;
                }

                let totalSuma = 0;
                let htmlContent = '';
                opinionesColegio.forEach(op => {
                    const val = parseInt(op.valoracion);
                    totalSuma += val;
                    const estrellas = '⭐'.repeat(val);
                    // Formatear fecha simple
                    const fechaObj = new Date(op.fecha);
                    const fechaFmt = `${fechaObj.getDate()}/${fechaObj.getMonth() + 1}/${fechaObj.getFullYear()}`;

                    htmlContent += `
                        <div class="card mb-3 shadow-sm border-0">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <h5 class="card-title fw-bold mb-0">${op.nombre}</h5>
                                    <small class="text-muted">${fechaFmt}</small>
                                </div>
                                <div class="mb-2">${estrellas}</div>
                                <p class="card-text mb-0 text-dark">${op.comentario}</p>
                            </div>
                        </div>
                    `;
                });

                contenedor.innerHTML = htmlContent;

                // Actualizar Schema JSON-LD con AggregateRating
                const promedio = (totalSuma / opinionesColegio.length).toFixed(1);
                actualizarSchemaConValoracion(promedio, opinionesColegio.length);
            })
            .catch(error => {
                console.log('Sin opiniones previas o archivo no creado aún.', error);
                contenedor.innerHTML = '<p class="text-muted text-center italic">Sé el primero en dejar una opinión sobre este colegio.</p>';
            });
    }

    function actualizarSchemaConValoracion(ratingValue, reviewCount) {
        const sc = document.getElementById('schema-colegio');
        if(sc) {
            let j = JSON.parse(sc.text);
            j.aggregateRating = {
                "@type": "AggregateRating",
                "ratingValue": parseFloat(ratingValue),
                "reviewCount": parseInt(reviewCount)
            };
            sc.remove();
            
            const nuevoScript = document.createElement('script');
            nuevoScript.type = 'application/ld+json';
            nuevoScript.id = 'schema-colegio';
            nuevoScript.text = JSON.stringify(j, null, 2);
            document.head.appendChild(nuevoScript);
        }
    }
});