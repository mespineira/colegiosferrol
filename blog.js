document.addEventListener('DOMContentLoaded', () => {
    const listadoContainer = document.getElementById('listado-noticias');
    const sinNoticias = document.getElementById('sin-noticias');
    
    fetch('noticias.json?v=' + new Date().getTime())
        .then(response => response.json())
        .then(data => {
            // Ordenamos por fecha (de más nueva a más vieja)
            const noticiasOrdenadas = data.sort((a, b) => {
                return new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion);
            });
            
            renderNoticias(noticiasOrdenadas);
        })
        .catch(error => {
            console.error('Error al cargar las noticias:', error);
            listadoContainer.innerHTML = '<p class="text-danger">No se pudieron cargar los datos del blog.</p>';
        });

    function renderNoticias(noticias) {
        listadoContainer.innerHTML = '';
        if (noticias.length === 0) {
            sinNoticias.style.display = 'block';
        } else {
            sinNoticias.style.display = 'none';
        }

        noticias.forEach(noticia => {
            // Usamos la misma estructura de "card" que ya tienes
            const card = `
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 shadow-sm card-colegio">
                        <img src="${noticia.imagen_destacada_url}" class="card-img-top" alt="${noticia.titulo}">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${noticia.titulo}</h5>
                            <p class="card-text">${noticia.descripcion_corta}</p>
                            <div class="mt-auto pt-3">
                                <a href="${noticia.slug_seo}" class="btn btn-primary w-100">Leer más</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            listadoContainer.innerHTML += card;
        });
    }
});