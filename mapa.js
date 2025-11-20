document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar el mapa centrado en Ferrol
    // Coordenadas aprox de Ferrol: 43.4832, -8.2369
    var map = L.map('mapa-colegios').setView([43.485, -8.230], 13);

    // 2. Añadir la capa de OpenStreetMap (Gratis)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // 3. Cargar los colegios y poner chinchetas
    fetch('/colegios.json?v=' + new Date().getTime())
        .then(response => response.json())
        .then(colegios => {
            colegios.forEach(colegio => {
                // Solo añadir si tiene coordenadas válidas
                if (colegio.latitud && colegio.longitud) {
                    
                    // Crear marcador
                    var marker = L.marker([colegio.latitud, colegio.longitud]).addTo(map);
                    
                    // Crear el contenido del popup (Burbuja al hacer clic)
                    var popupContent = `
                        <div style="text-align:center;">
                            <strong style="font-size:1.1em;">${colegio.nombre}</strong><br>
                            <span style="color:#666; font-size:0.9em;">${colegio.tipo}</span><br>
                            <a href="/colegio/${colegio.slug}" style="display:inline-block; margin-top:5px; font-weight:bold;">Ver ficha</a>
                        </div>
                    `;

                    marker.bindPopup(popupContent);
                }
            });
        })
        .catch(error => {
            console.error('Error al cargar los colegios en el mapa:', error);
        });
});