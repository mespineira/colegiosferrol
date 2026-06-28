document.addEventListener('DOMContentLoaded', () => {
    const listadoContainer = document.getElementById('lista-colegios-zona');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorContainer = document.getElementById('error-zona');
    const tituloZona = document.getElementById('titulo-zona');
    const descripcionZona = document.getElementById('descripcion-zona');

    // 1. Helper para slugificar strings de forma consistente
    function slugify(text) {
        return text.toString().toLowerCase()
            .normalize("NFD") // Separa los diacríticos de las letras base
            .replace(/[\u0300-\u036f]/g, "") // Elimina los acentos y diacríticos
            .replace(/\s+/g, '-') // Reemplaza espacios por guiones
            .replace(/[^\w\-]+/g, '') // Elimina caracteres especiales que no sean letras, números o guiones
            .replace(/\-\-+/g, '-') // Colapsa múltiples guiones seguidos
            .replace(/^-+/, '') // Quita guiones iniciales
            .replace(/-+$/, ''); // Quita guiones finales
    }

    // 2. Obtener el parámetro 'slug' de la query string (?slug=canido)
    const urlParams = new URLSearchParams(window.location.search);
    const zoneSlug = urlParams.get('slug');

    if (!zoneSlug) {
        showError();
        return;
    }

    // 3. Realizar fetch al archivo JSON de datos
    fetch('/colegios.json?v=' + new Date().getTime())
        .then(response => {
            if (!response.ok) throw new Error('Error al cargar colegios.json');
            return response.json();
        })
        .then(colegios => {
            // Filtrar centros que coincidan con la zona slugificada
            const colegiosFiltrados = colegios.filter(c => slugify(c.zona) === zoneSlug);

            if (colegiosFiltrados.length === 0) {
                showError();
                return;
            }

            // Nombre real de la zona a partir del primer resultado encontrado
            const nombreRealZona = colegiosFiltrados[0].zona;
            
            // Actualizar textos dinámicos
            tituloZona.textContent = `Colegios en ${nombreRealZona}`;
            descripcionZona.textContent = `Listado completo de centros públicos y concertados de educación infantil, primaria y secundaria en la zona de ${nombreRealZona}, Ferrol.`;

            // Actualizar metadatos dinámicamente para SEO/GEO
            document.title = `▷ Colegios en ${nombreRealZona} (Ferrol) | Guía 2026`;
            let metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                metaDesc.setAttribute('content', `¿Buscas colegio en la zona de ${nombreRealZona}? Compara los mejores centros educativos en Ferrol. Opiniones, comedor, transporte y fichas detalladas.`);
            }

            // Renderizar listado de colegios en el DOM
            renderListado(colegiosFiltrados);
        })
        .catch(error => {
            console.error('Error cargando colegios de la zona:', error);
            showError();
        });

    function renderListado(lista) {
        listadoContainer.innerHTML = '';
        
        lista.forEach(colegio => {
            const card = `
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 shadow-sm card-colegio">
                        <a href="/colegio/${colegio.slug}">
                            <img src="${colegio.imagen_principal}" class="card-img-top" alt="Colegio ${colegio.nombre}" loading="lazy" width="400" height="250" style="object-fit: cover;" onerror="this.onerror=null; this.src=\'/img/default-ferrol.jpg\';">
                        </a>
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">
                                <a href="/colegio/${colegio.slug}" class="text-decoration-none text-dark stretched-link">${colegio.nombre}</a>
                            </h5>
                            <h6 class="card-subtitle mb-2 text-muted">${colegio.zona}</h6>
                            <p class="card-text">${colegio.descripcion_corta}</p>
                            <div>
                                <span class="badge bg-primary">${colegio.tipo}</span>
                                ${colegio.servicios.transporte_escolar ? '<span class="badge bg-success">🚌 Transporte</span>' : ''}
                                ${colegio.servicios.comedor ? '<span class="badge bg-info">🍽️ Comedor</span>' : ''}
                            </div>
                            <div class="mt-auto pt-3">
                                <a href="/colegio/${colegio.slug}" class="btn btn-primary w-100">Ver ficha completa</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            listadoContainer.innerHTML += card;
        });

        // Ocultar spinner y mostrar lista
        loadingSpinner.classList.add('d-none');
        listadoContainer.classList.remove('d-none');
    }

    function showError() {
        loadingSpinner.classList.add('d-none');
        errorContainer.classList.remove('d-none');
    }
});
