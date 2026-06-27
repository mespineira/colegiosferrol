# Guía de Colegios en Ferrol (colegiosferrol.es)

Bienvenido al repositorio de **Guía de Colegios en Ferrol**, una plataforma web diseñada para ayudar a las familias de Ferrol y comarca a encontrar y comparar de manera rápida y sencilla los mejores centros educativos (públicos, concertados y privados) para sus hijos. Además, el proyecto incluye un agregador de noticias y contenido educativo relevante para la comunidad local.

## 🎯 Objetivo del Proyecto

El objetivo principal de esta web es centralizar en un único lugar, de forma clara y accesible, toda la información de interés sobre la oferta educativa en Ferrol. Se ha diseñado priorizando la **velocidad de carga**, la **experiencia de usuario (UX)** y el enfoque **mobile-first**, evitando el uso de sistemas de gestión de contenidos (CMS) pesados. Esto permite un despliegue rápido y un rendimiento excelente en cualquier tipo de alojamiento web.

## ✨ Características Principales

- **Directorio Completo:** Listado exhaustivo de colegios públicos, concertados y privados en Ferrol.
- **Sistema de Filtrado Dinámico:** Permite a los usuarios acotar su búsqueda en tiempo real según:
  - Tipo de centro (Público, Concertado, Privado).
  - Servicios adicionales (Transporte escolar, Comedor).
  - Niveles educativos impartidos (ESO, Bachillerato).
- **Fichas Detalladas por Colegio:** Cada centro cuenta con una página específica (`colegio.html`) que muestra su información completa, incluyendo proyecto educativo, servicios, instalaciones y datos de contacto.
- **Vista en Mapa:** Integración de mapa (`mapa.html`) para visualizar la ubicación geográfica de todos los centros de un vistazo.
- **Blog / Agregador de Noticias:** Sección dedicada a la publicación de noticias, becas, cursos y actualidad sobre educación y formación (`blog.html` y `entrada.html`), con generador de datos estructurados (JSON-LD) para un mejor posicionamiento SEO.
- **Optimización SEO y Performance:** Estructura de archivos plana, uso mínimo de dependencias externas y recursos minificados para garantizar tiempos de respuesta casi instantáneos.
- **Gestor de Consentimiento:** Banner de aceptación/rechazo de cookies integrado para el cumplimiento de normativas GDPR.

## 🛠️ Stack Tecnológico

El proyecto se sustenta en unas bases tecnológicas puras y ligeras, sin depender de bases de datos tradicionales ni lenguajes de backend complejos:

- **HTML5:** Marcado semántico y accesible.
- **CSS3 & Bootstrap 5:** Estilos personalizados (`estilos-bitkids.css`) combinados con el sistema de grid y componentes de Bootstrap 5 para garantizar un diseño 100% *responsive*.
- **JavaScript Vanilla (ES6+):** Lógica del lado del cliente para el consumo de datos, renderizado dinámico de tarjetas HTML y filtrado instantáneo. Sin frameworks JS pesados (como React o Angular) para mantener la ligereza.
- **JSON (Data Base Local):** 
  - `colegios.json`: Contiene la base de datos completa de los centros educativos.
  - `noticias.json`: Contiene los artículos y actualidad del blog.

## 📂 Arquitectura de Archivos

La estructura del proyecto es directa e intuitiva:

```text
/
├── index.html                 # Página principal con el buscador general.
├── mapa.html / mapa.js        # Página con visualización geográfica de los centros.
├── colegio.html / colegio.js  # Plantilla para la ficha individual de un colegio.
├── colegios-*.html            # Landing pages específicas para posicionamiento (ej. Públicos, Concertados).
├── blog.html / blog.js        # Índice general del blog y noticias.
├── entrada.html / entrada.js  # Plantilla para el detalle de un artículo del blog.
├── colegios.json              # Datos maestros de todos los colegios.
├── noticias.json              # Datos maestros de todas las noticias.
├── estilos-bitkids.css        # Hoja de estilos principal y personalizada.
├── sitemap.xml                # Mapa del sitio para indexación en motores de búsqueda.
├── aviso-legal.html           # Página de Aviso Legal.
├── politica-de-cookies.html   # Página de Política de Cookies.
├── politica-de-privacidad.html# Página de Política de Privacidad.
├── .htaccess                  # Configuración de servidor Apache (redirecciones, caché, etc.).
└── img/                       # Directorio de recursos gráficos e imágenes.
```

## 🚀 Cómo Levantar el Entorno de Desarrollo

Debido a que el proyecto utiliza la API `fetch()` de JavaScript para cargar los datos locales desde los archivos `colegios.json` y `noticias.json`, **es necesario servir los archivos a través de un servidor web local** para evitar bloqueos por políticas de CORS en el navegador.

**Opciones para ejecutarlo localmente:**

1. **Vía VS Code:** Instala la extensión **Live Server**, haz clic derecho en `index.html` y selecciona "Open with Live Server".
2. **Vía Python 3:** Abre tu terminal en el directorio del proyecto y ejecuta:
   ```bash
   python -m http.server 8000
   ```
   Luego, visita `http://localhost:8000` en tu navegador.
3. **Vía Node.js:** Si tienes Node instalado, usa `npx http-server`:
   ```bash
   npx http-server . -p 8000
   ```

## 📈 SEO y Rendimiento

El proyecto ha sido concebido desde su inicio con el posicionamiento en buscadores (SEO) en mente:
- Renderizado de etiquetas `<title>` y `<meta description>` optimizadas por URL.
- Implementación de datos estructurados (`Schema.org/NewsArticle`) en las noticias del blog para enriquecer los resultados en Google.
- Velocidad de carga extremadamente rápida, lo cual es un factor determinante para el Core Web Vitals de Google.

---

*Proyecto desarrollado para ofrecer un valor real a la comunidad educativa de Ferrol.*
