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
        // Calcular dinámicamente servicios disponibles de conciliación para las FAQ
        let serviciosDisponibles = [];
        if (colegio.servicios.comedor) serviciosDisponibles.push("comedor escolar");
        if (colegio.servicios.transporte_escolar) serviciosDisponibles.push("transporte escolar");
        if (colegio.servicios.horario_ampliado) serviciosDisponibles.push("horario ampliado (servicio de madrugadores)");
        if (colegio.servicios.gabinete_psicopedagogico) serviciosDisponibles.push("gabinete psicopedagógico");

        let conciliacionText = "";
        if (serviciosDisponibles.length > 0) {
            conciliacionText = `El <strong>${colegio.nombre}</strong> facilita la conciliación de la vida laboral y familiar a través de los siguientes servicios: ${serviciosDisponibles.join(", ").replace(/,([^,]*)$/, " y$1")}.`;
        } else {
            conciliacionText = `Actualmente, el <strong>${colegio.nombre}</strong> no ha reportado servicios especiales de comedor, transporte o madrugadores. Te recomendamos contactar directamente con la secretaría del centro para consultar cualquier servicio complementario de conciliación.`;
        }

        // Actualizar el título y la metadescripción orientados al clic (SEO)
        document.title = `▷ ${colegio.nombre} (Ferrol): Opiniones, Horarios y Servicios`;
        
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', `¿Buscas información sobre ${colegio.nombre} en Ferrol? Descubre sus opiniones, horarios, servicios de comedor, transporte y actividades extraescolares para el curso 2026/2027.`);

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
                            <ul class="list-group mb-4">
                                <li class="list-group-item"><strong>Nivel Académico:</strong> ${colegio.informacion_general.nivel_academico}</li>
                                <li class="list-group-item"><strong>Niños por aula:</strong> ${colegio.informacion_general.ninos_por_aula || 'No especificado'}</li>
                                <li class="list-group-item"><strong>Idiomas:</strong> ${colegio.informacion_general.idiomas.join(', ')}</li>
                                ${colegio.telefono ? `<li class="list-group-item"><strong>Teléfono:</strong> <a href="tel:${colegio.telefono}">${colegio.telefono}</a></li>` : ''}
                            </ul>

                            <!-- Tarjeta de Conversión Cruzada (Recomendación Editorial) -->
                            <div class="card border-0 rounded-3 shadow-sm mb-4" style="background-color: #f9faff; border-left: 4px solid #41038f !important;">
                                <div class="card-body p-3">
                                    <div class="d-flex align-items-center justify-content-between mb-2">
                                        <span class="badge rounded-pill text-white px-2.5 py-1.5 d-inline-flex align-items-center" style="background-color: #41038f; font-size: 0.75rem; font-weight: 600;">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" class="bi bi-star-fill me-1" viewBox="0 0 16 16">
                                                <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                                            </svg>
                                            Extraescolar Recomendada
                                        </span>
                                        <img src="https://bitkids.es/wp-content/uploads/2024/09/cropped-LOGO-BITKIDS.png" alt="Logo BitKids" style="width: 30px; height: 30px; border-radius: 6px; object-fit: cover;" class="shadow-sm">
                                    </div>
                                    <h4 class="card-title h6 fw-bold text-dark mb-1">¿Buscas el complemento educativo ideal?</h4>
                                    <p class="card-text text-secondary mb-3" style="font-size: 0.85rem; line-height: 1.5;">
                                        Gran parte de los alumnos de los centros de Ferrol potencian su lógica y creatividad en <strong>BitKids</strong>, la academia de robótica y programación de referencia en la comarca. Reserva una Clase de Prueba Gratuita aquí.
                                    </p>
                                    <a href="https://bitkids.es" target="_blank" rel="noopener" class="btn text-white w-100 py-2 fw-bold" style="background-color: #508f02; border: none; border-radius: 6px; font-size: 0.8rem;">
                                        Clase de Prueba Gratuita
                                    </a>
                                </div>
                            </div>
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

                    <!-- ESTRATEGIA 4: Bloque FAQ Dinámico -->
                    <hr class="my-4">
                    <h3 class="mb-3 text-dark fw-bold h4">❓ Preguntas Frecuentes sobre ${colegio.nombre}</h3>
                    <div class="accordion shadow-sm mb-2" id="faqAccordion">
                        <div class="accordion-item border-0 rounded-3 overflow-hidden mb-2">
                            <h4 class="accordion-header" id="faqHeadingOne">
                                <button class="accordion-button collapsed fw-semibold text-dark bg-white" type="button" data-bs-toggle="collapse" data-bs-target="#faqCollapseOne" aria-expanded="false" aria-controls="faqCollapseOne">
                                    ¿Qué servicios de conciliación ofrece el ${colegio.nombre}?
                                </button>
                            </h4>
                            <div id="faqCollapseOne" class="accordion-collapse collapse" aria-labelledby="faqHeadingOne" data-bs-parent="#faqAccordion">
                                <div class="accordion-body bg-white text-secondary" style="font-size: 0.95rem; line-height: 1.6;">
                                    ${conciliacionText}
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item border-0 rounded-3 overflow-hidden">
                            <h4 class="accordion-header" id="faqHeadingTwo">
                                <button class="accordion-button collapsed fw-semibold text-dark bg-white" type="button" data-bs-toggle="collapse" data-bs-target="#faqCollapseTwo" aria-expanded="false" aria-controls="faqCollapseTwo">
                                    ¿Cómo solicitar plaza en el ${colegio.nombre} para el curso 2027?
                                </button>
                            </h4>
                            <div id="faqCollapseTwo" class="accordion-collapse collapse" aria-labelledby="faqHeadingTwo" data-bs-parent="#faqAccordion">
                                <div class="accordion-body bg-white text-secondary" style="font-size: 0.95rem; line-height: 1.6;">
                                    El proceso de solicitud de plaza en el <strong>${colegio.nombre}</strong> para el curso escolar 2027/2028 se gestiona principalmente a través de la aplicación oficial <em>'admisionalumnado'</em> de la Xunta de Galicia o entregando la documentación física en la secretaría del centro. El plazo de presentación de solicitudes suele abrirse anualmente durante el mes de marzo. Es fundamental estar atento a las fechas oficiales publicadas por la Consellería de Educación y aportar los documentos justificativos (padronamiento, rentas, etc.) para el baremo de puntos de admisión.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        fichaContainer.innerHTML = fichaHTML;

        // Inyectar Schema.org JSON-LD (RAG/GEO Optimization)
        generarSchemaColegio(colegio);
        generarSchemaFAQ(colegio);

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
    function generarSchemaColegio(datosColegio) {
        // 1. Prevención de Duplicados: Eliminar tag anterior si existía
        const scriptPrevio = document.getElementById('schema-colegio');
        if (scriptPrevio) {
            scriptPrevio.remove();
        }

        // 2. Extraer automáticamente el código postal de 5 dígitos de la dirección o usar valor por defecto
        const cpMatch = datosColegio.direccion ? datosColegio.direccion.match(/\b\d{5}\b/) : null;
        const postalCode = cpMatch ? cpMatch[0] : "1540X";

        // 2.5 Limpiar el streetAddress eliminando el código postal y la localidad/provincia redundantes
        let streetAddress = datosColegio.direccion || "";
        if (cpMatch) {
            const cpIndex = streetAddress.indexOf(cpMatch[0]);
            if (cpIndex !== -1) {
                streetAddress = streetAddress.substring(0, cpIndex).trim();
                if (streetAddress.endsWith(',')) {
                    streetAddress = streetAddress.slice(0, -1).trim();
                }
            }
        }

        // 3. Mapear AmenityFeatures basados en servicios opcionales del centro (si existen)
        let amenities = [];
        if (datosColegio.servicios) {
            if (datosColegio.servicios.comedor) {
                amenities.push({ "@type": "LocationFeatureSpecification", "name": "Comedor Escolar", "value": true });
            }
            if (datosColegio.servicios.transporte_escolar) {
                amenities.push({ "@type": "LocationFeatureSpecification", "name": "Transporte Escolar", "value": true });
            }
            if (datosColegio.servicios.horario_ampliado) {
                amenities.push({ "@type": "LocationFeatureSpecification", "name": "Horario Ampliado / Madrugadores", "value": true });
            }
            if (datosColegio.servicios.gabinete_psicopedagogico) {
                amenities.push({ "@type": "LocationFeatureSpecification", "name": "Gabinete Psicopedagógico", "value": true });
            }
        }

        // 4. Construir objeto base estructurado (@type: School)
        const schemaJSON = {
            "@context": "https://schema.org",
            "@type": "School",
            "name": datosColegio.nombre,
            "description": datosColegio.descripcion_corta,
            "address": {
                "@type": "PostalAddress",
                "streetAddress": streetAddress,
                "addressLocality": "Ferrol",
                "addressRegion": "A Coruña / Galicia",
                "postalCode": postalCode,
                "addressCountry": "ES"
            }
        };

        // 5. Tratamiento de Datos Vacíos: Añadir propiedades solo si están presentes y no están vacías
        
        // Imagen principal (URL absoluta de origen)
        if (datosColegio.imagen_principal && datosColegio.imagen_principal.trim() !== "") {
            schemaJSON.image = datosColegio.imagen_principal.startsWith("http")
                ? datosColegio.imagen_principal
                : `https://colegiosferrol.es${datosColegio.imagen_principal.startsWith("/") ? "" : "/"}${datosColegio.imagen_principal}`;
        }

        // Teléfono del centro (limpiar espacios y verificar existencia)
        if (datosColegio.telefono && datosColegio.telefono.trim() !== "") {
            schemaJSON.telephone = datosColegio.telefono.trim();
        }

        // Sitio web oficial (si no existe, se enlaza a la propia ficha en colegiosferrol.es)
        schemaJSON.url = (datosColegio.web && datosColegio.web.trim() !== "") 
            ? datosColegio.web.trim() 
            : window.location.href;

        // Inclusión de características/servicios si se han mapeado
        if (amenities.length > 0) {
            schemaJSON.amenityFeature = amenities;
        }

        // 6. Inyección Segura: Crear elemento de script e inyectar usando textContent para escapar caracteres especiales
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'schema-colegio';
        script.textContent = JSON.stringify(schemaJSON, null, 2);

        document.head.appendChild(script);
    }

    // =======================================================
    // == FUNCIÓN PARA GENERAR SCHEMA FAQPAGE (JSON-LD) ==
    // =======================================================
    function generarSchemaFAQ(colegio) {
        // 1. Prevención de Duplicados
        const scriptPrevio = document.getElementById('schema-faq');
        if (scriptPrevio) {
            scriptPrevio.remove();
        }

        // 2. Calcular dinámicamente servicios para la respuesta de conciliación
        let serviciosDisponibles = [];
        if (colegio.servicios.comedor) serviciosDisponibles.push("comedor escolar");
        if (colegio.servicios.transporte_escolar) serviciosDisponibles.push("transporte escolar");
        if (colegio.servicios.horario_ampliado) serviciosDisponibles.push("horario ampliado (servicio de madrugadores)");
        if (colegio.servicios.gabinete_psicopedagogico) serviciosDisponibles.push("gabinete psicopedagógico");

        let answerConciliacion = "";
        if (serviciosDisponibles.length > 0) {
            answerConciliacion = `El ${colegio.nombre} facilita la conciliación de la vida laboral y familiar a través de los siguientes servicios: ${serviciosDisponibles.join(", ").replace(/,([^,]*)$/, " y$1")}.`;
        } else {
            answerConciliacion = `Actualmente, el ${colegio.nombre} no ha reportado servicios especiales de comedor, transporte o madrugadores. Te recomendamos contactar directamente con la secretaría del centro para consultar cualquier servicio de conciliación.`;
        }

        const answerAdmision = `El proceso de solicitud de plaza en el ${colegio.nombre} para el curso escolar 2027/2028 se gestiona principalmente a través de la aplicación oficial 'admisionalumnado' de la Xunta de Galicia o entregando la documentación física en la secretaría del centro. El plazo de presentación de solicitudes suele abrirse anualmente durante el mes de marzo. Es fundamental estar atento a las fechas oficiales publicadas por la Consellería de Educación y aportar los documentos justificativos (padronamiento, rentas, etc.) para el baremo de puntos de admisión.`;

        // 3. Estructura JSON-LD FAQPage
        const schemaJSON = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": `¿Qué servicios de conciliación ofrece el ${colegio.nombre}?`,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": answerConciliacion
                    }
                },
                {
                    "@type": "Question",
                    "name": `¿Cómo solicitar plaza en el ${colegio.nombre} para el curso 2027?`,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": answerAdmision
                    }
                }
            ]
        };

        // 4. Inyección Segura con textContent
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'schema-faq';
        script.textContent = JSON.stringify(schemaJSON, null, 2);

        document.head.appendChild(script);
    }

    // =======================================================
    // == FUNCIÓN PARA MOSTRAR COLEGIOS SIMILARES (Centros Cercanos) ==
    // =======================================================
    function renderSimilar(todosLosColegios, colegioActual) {
        const similarContainer = document.getElementById('colegios-similares-container');
        if (!similarContainer) return;

        // 1. Filtrar de la misma zona excluyendo al colegio actual
        let recomendados = todosLosColegios.filter(c => c.zona === colegioActual.zona && c.id !== colegioActual.id);
        
        // Barajar para rotar el link juice y ofrecer dinamismo
        recomendados.sort(() => 0.5 - Math.random());
        
        // 2. Si la zona tiene menos de 3 colegios, rellenamos con colegios del mismo "tipo"
        if (recomendados.length < 3) {
            const idsElegidos = new Set(recomendados.map(c => c.id));
            idsElegidos.add(colegioActual.id);
            
            let relleno = todosLosColegios.filter(c => c.tipo === colegioActual.tipo && !idsElegidos.has(c.id));
            relleno.sort(() => 0.5 - Math.random());
            
            const necesarios = 3 - recomendados.length;
            recomendados = recomendados.concat(relleno.slice(0, necesarios));
        } else {
            recomendados = recomendados.slice(0, 3);
        }

        if (recomendados.length === 0) {
            similarContainer.style.display = 'none';
            return;
        }

        let htmlSimilares = `<h3 class="mb-4 text-dark fw-bold h4">📍 Otros colegios que te pueden interesar en la zona de ${colegioActual.zona}</h3><div class="row g-4">`;

        recomendados.forEach(colegio => {
            htmlSimilares += `
                <div class="col-lg-4 col-md-6 col-12">
                    <div class="card h-100 border-0 shadow-sm overflow-hidden" style="transition: transform 0.2s;">
                        <div class="row g-0 h-100">
                            <div class="col-4">
                                <img src="${colegio.imagen_principal}" class="img-fluid h-100" style="object-fit: cover; min-height: 120px;" alt="${colegio.nombre}" onerror="this.onerror=null; this.src=\'/img/default-ferrol.jpg\';">
                            </div>
                            <div class="col-8 d-flex align-items-center">
                                <div class="card-body py-3 px-3 position-relative">
                                    <span class="badge bg-light text-primary border rounded-pill mb-1.5" style="font-size: 0.7rem;">${colegio.tipo}</span>
                                    <h4 class="h6 fw-bold mb-1">
                                        <a href="/colegio/${colegio.slug}" class="text-decoration-none text-dark stretched-link">${colegio.nombre}</a>
                                    </h4>
                                    <p class="text-muted mb-0 small"><i class="bi bi-geo-alt-fill text-danger fs-8"></i> ${colegio.zona}</p>
                                </div>
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