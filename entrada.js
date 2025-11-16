document.addEventListener('DOMContentLoaded', () => {
    const fichaContainer = document.getElementById('ficha-noticia');

    // 1. Obtener el 'slug' de la URL (igual que en colegio.js)
    const path = window.location.pathname; // Esto funciona (ej: /blog/nombre-noticia)
    const noticiaSlug = path.substring(path.lastIndexOf('/') + 1);

    if (!noticiaSlug) {
        fichaContainer.innerHTML = '<p class="alert alert-danger">Error: No se ha especificado ninguna noticia.</p>';
        return;
    }

    // 2. Cargar los datos y encontrar la noticia correcta (RUTA CORREGIDA)
    fetch('/noticias.json?v=' + new Date().getTime()) // <-- RUTA CORREGIDA
        .then(response => response.json())
        .then(noticias => {
            const noticia = noticias.find(n => n.slug_seo === noticiaSlug);

            if (noticia) {
                renderFicha(noticia);
            } else {
                fichaContainer.innerHTML = '<p class="alert alert-warning">No se ha encontrado la noticia especificada.</p>';
                document.title = 'Noticia no encontrada | Blog Colegios Ferrol';
            }
        })
        .catch(error => {
            console.error('Error al cargar la ficha de la noticia:', error);
            fichaContainer.innerHTML = '<p class="alert alert-danger">No se pudo cargar la información.</p>';
        });

    // 3. Función para pintar la ficha completa en el HTML
    function renderFicha(noticia) {
        // Actualizar el título y la metadescripción (importante para SEO)
        document.title = `${noticia.titulo} | Blog Colegios Ferrol`;
        document.querySelector('meta[name="description"]').setAttribute('content', noticia.meta_descripcion_seo);

        // Formatear fecha (opcional pero recomendado)
        const fecha = new Date(noticia.fecha_publicacion).toLocaleDateString('es-ES', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        const fichaHTML = `
            <div class="row justify-content-center">
                <div class="col-lg-10">
                    <div class="card shadow-lg">
                        <img src="${noticia.imagen_destacada_url}" class="card-img-top" alt="${noticia.titulo}">
                        <div class="card-body p-4 p-md-5">
                            <h1 class="card-title display-5">${noticia.titulo}</h1>
                            <h2 class="card-subtitle mb-3 text-muted">Publicado el ${fecha}</h2>
                            
                            <hr class="my-4">

                            <div class="entrada-contenido">
                                ${noticia.contenido_html}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        fichaContainer.innerHTML = fichaHTML;
    }
});