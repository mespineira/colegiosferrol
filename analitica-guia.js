/**
 * analitica-guia.js - Rastreador de Analítica Ligero y Privado (Privacy-First)
 * 
 * Este script recopila métricas básicas de uso de forma completamente anónima
 * y sin guardar información personal del usuario. Se envía al cerrar o cambiar
 * de pestaña mediante fetch(keepalive) o sendBeacon de forma silenciosa.
 */
(function () {
    'use strict';

    var TRACKER_URL = '/track.php';

    // Evitar inicializar si ya existe una instancia del rastreador
    if (window.__privacyTrackerInitialized) return;
    window.__privacyTrackerInitialized = true;

    var startTime = Date.now();
    var clicksBitkids = 0;
    var clicksTel = 0;

    // 1. Obtener o Generar ID de Usuario Único (Anónimo, persistido en localStorage)
    var uid = localStorage.getItem('analytics_uid');
    if (!uid) {
        uid = 'u_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('analytics_uid', uid);
    }

    // 2. Control de Sesión (sessionStorage)
    var isNewSession = false;
    var sid = sessionStorage.getItem('analytics_sid');
    if (!sid) {
        sid = 's_' + Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('analytics_sid', sid);
        sessionStorage.setItem('analytics_page_views', '1');
        sessionStorage.setItem('analytics_referrer', getSimplifiedReferrer());
        isNewSession = true;
    } else {
        var pvs = parseInt(sessionStorage.getItem('analytics_page_views') || '0', 10);
        pvs++;
        sessionStorage.setItem('analytics_page_views', pvs.toString());
    }

    // 3. Corrección de Rebote en el Cliente (para páginas subsiguientes en la misma sesión)
    // Si es la página 2 o posterior, y en la página anterior se marcó como posible rebote
    // (porque duró menos de 15s y fue la única página entonces), enviamos una corrección inmediata.
    if (sessionStorage.getItem('analytics_bounce_sent') === 'true') {
        sessionStorage.setItem('analytics_bounce_sent', 'false');
        sendPayload({
            isBounceCorrection: true
        });
    }

    // 4. Registrar Clics en Enlaces Especiales (bitkids.es y tel:)
    document.addEventListener('click', function (event) {
        var anchor = event.target.closest('a');
        if (anchor && anchor.href) {
            var href = anchor.href;
            if (href.indexOf('bitkids.es') !== -1) {
                clicksBitkids++;
            } else if (href.indexOf('tel:') === 0) {
                clicksTel++;
            }
        }
    }, true); // Usamos fase de captura para asegurar que el evento se detecta

    // 5. Enviar Datos en la Salida (visibilitychange o pagehide)
    // visibilitychange es el evento estándar más robusto en navegadores modernos y móviles.
    var eventSent = false;
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') {
            sendAnalyticsEvent();
        }
    });

    // Fallback para navegadores antiguos o flujos específicos
    window.addEventListener('pagehide', function () {
        sendAnalyticsEvent();
    });

    /**
     * Envía las métricas acumuladas de la página actual
     */
    function sendAnalyticsEvent() {
        if (eventSent) return;
        eventSent = true;

        var duration = Math.round((Date.now() - startTime) / 1000);
        var totalSessionPages = parseInt(sessionStorage.getItem('analytics_page_views') || '1', 10);
        
        // Regla de rebote: Solo 1 página vista en la sesión y menos de 15 segundos de permanencia
        var isBounce = (totalSessionPages === 1 && duration < 15);

        // Guardamos el estado de rebote para corregirlo en la siguiente página si la hubiera
        if (isBounce) {
            sessionStorage.setItem('analytics_bounce_sent', 'true');
        } else {
            sessionStorage.setItem('analytics_bounce_sent', 'false');
        }

        var payload = {
            uid: uid,
            isNewSession: isNewSession,
            referrer: sessionStorage.getItem('analytics_referrer') || 'Directo',
            path: window.location.pathname,
            device: isMobileDevice() ? 'mobile' : 'desktop',
            duration: duration,
            clicks_bitkids: clicksBitkids,
            clicks_tel: clicksTel,
            isBounce: isBounce
        };

        sendPayload(payload);
    }

    /**
     * Envía datos JSON al backend usando la API preferida por el navegador
     */
    function sendPayload(payload) {
        var body = JSON.stringify(payload);

        // Intentar usar navigator.sendBeacon primero (el estándar ideal para descargas/cierre de página)
        if (navigator.sendBeacon) {
            try {
                var blob = new Blob([body], { type: 'application/json' });
                if (navigator.sendBeacon(TRACKER_URL, blob)) {
                    return;
                }
            } catch (e) {
                // Si falla por alguna razón (ej. restricciones de seguridad), hacer fallback a fetch
            }
        }

        // Fallback a fetch con keepalive activado para asegurar que la petición finalice al cerrar la pestaña
        if (window.fetch) {
            fetch(TRACKER_URL, {
                method: 'POST',
                body: body,
                headers: {
                    'Content-Type': 'application/json'
                },
                keepalive: true
            }).catch(function (err) {
                // Silencioso, no queremos romper la UX del usuario
            });
        }
    }

    /**
     * Simplifica el referente (document.referrer) en categorías
     */
    function getSimplifiedReferrer() {
        var ref = document.referrer;
        if (!ref) return 'Directo';

        try {
            var url = new URL(ref);
            var hostname = url.hostname.toLowerCase();
            var currentHost = window.location.hostname.toLowerCase();

            // Si proviene de nuestro propio dominio o subdominio es Directo
            if (hostname === currentHost || hostname.indexOf('.' + currentHost) !== -1) {
                return 'Directo';
            }

            // Motores de Búsqueda
            if (hostname.indexOf('google.') !== -1 || 
                hostname.indexOf('bing.com') !== -1 || 
                hostname.indexOf('yahoo.com') !== -1 || 
                hostname.indexOf('duckduckgo.com') !== -1 ||
                hostname.indexOf('yandex.') !== -1) {
                return 'Google';
            }

            // Redes Sociales principales
            if (hostname.indexOf('t.co') !== -1 || 
                hostname.indexOf('twitter.com') !== -1 || 
                hostname.indexOf('x.com') !== -1 || 
                hostname.indexOf('facebook.com') !== -1 || 
                hostname.indexOf('instagram.com') !== -1 || 
                hostname.indexOf('linkedin.com') !== -1 || 
                hostname.indexOf('pinterest.com') !== -1 || 
                hostname.indexOf('tiktok.com') !== -1) {
                return 'Redes Sociales';
            }

            // Otros sitios referidos
            return 'Otros';
        } catch (e) {
            return 'Otros';
        }
    }

    /**
     * Detecta si es un dispositivo móvil
     */
    function isMobileDevice() {
        var userAgent = navigator.userAgent || navigator.vendor || window.opera;
        // Comprobar tanto patrones del UA como el tamaño inicial de pantalla
        var checkUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        var checkWidth = window.innerWidth <= 768;
        return checkUA || checkWidth;
    }
})();
