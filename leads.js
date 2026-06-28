/**
 * leads.js - Captador de Leads Unificado para la Red de Portales
 * 
 * Este script intercepta los formularios de solicitud de información o de
 * contacto, añade metadatos de origen de forma invisible (web_origen, fecha_registro)
 * y los envía de forma asíncrona mediante un POST JSON a un Webhook central.
 */
document.addEventListener('DOMContentLoaded', () => {
    const leadForms = document.querySelectorAll('form[data-lead-capture="true"]');
    
    leadForms.forEach(form => {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            // Obtener elementos de retroalimentación
            const submitBtn = form.querySelector('[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Enviar';
            const feedbackContainer = form.querySelector('.lead-feedback') || createFeedbackContainer(form);
            
            // Estado de carga en el UI
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Procesando...';
            }
            feedbackContainer.innerHTML = '';
            
            // Recopilar datos nativos del formulario
            const formData = new FormData(form);
            const payload = {};
            formData.forEach((value, key) => {
                payload[key] = value;
            });
            
            // Inyectar metadatos invisibles de rastreo y red
            payload['web_origen'] = window.location.hostname;
            payload['fecha_registro'] = new Date().toISOString();
            payload['url_captura'] = window.location.href;
            
            // Extraer parámetros UTM si existen en la URL para atribuir el canal del lead
            const urlParams = new URLSearchParams(window.location.search);
            const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
            utmParams.forEach(param => {
                if (urlParams.has(param)) {
                    payload[param] = urlParams.get(param);
                }
            });
            
            // Endpoint del Webhook Centralizado
            const webhookUrl = form.getAttribute('action') || 'https://webhook.colegiosferrol.es/v1/leads';
            
            try {
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                
                const result = await response.json();
                
                if (response.ok && result.success !== false) {
                    feedbackContainer.className = 'lead-feedback alert alert-success mt-3';
                    feedbackContainer.innerHTML = '<strong>¡Solicitud enviada con éxito!</strong> Nos pondremos en contacto contigo lo antes posible.';
                    form.reset();
                } else {
                    throw new Error(result.message || 'Error en la respuesta del servidor');
                }
            } catch (error) {
                console.error('Error al enviar el lead:', error);
                feedbackContainer.className = 'lead-feedback alert alert-danger mt-3';
                feedbackContainer.innerHTML = '<strong>Error al enviar la solicitud.</strong> Por favor, inténtelo de nuevo o escriba directamente a info@colegiosferrol.es.';
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            }
        });
    });
    
    // Función auxiliar para inyectar contenedor de avisos dinámicamente si no existe
    function createFeedbackContainer(form) {
        const div = document.createElement('div');
        div.className = 'lead-feedback';
        form.appendChild(div);
        return div;
    }
});
