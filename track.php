<?php
/**
 * track.php - Receptor de Analítica Ligero y Seguro (Privacy-First)
 *
 * Ingesta los datos en formato JSON enviados por el rastreador,
 * los procesa y actualiza el archivo centralizado metrics.json.
 * Utiliza bloqueo exclusivo (flock) para evitar colisiones en concurrencia.
 */

// Evitar mostrar errores PHP en el output para no corromper la respuesta JSON
ini_set('display_errors', 0);
error_reporting(0);

// Configuración de cabeceras de respuesta
header('Content-Type: application/json; charset=utf-8');

// =========================================================================
// CONFIGURACIÓN DE SEGURIDAD (CORS Whitelist)
// =========================================================================
$allowed_domains = [
    'colegiosferrol.es',
    'bitkids.es'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Si no hay HTTP_ORIGIN, intentamos extraer el dominio desde el REFERER
if (empty($origin) && !empty($_SERVER['HTTP_REFERER'])) {
    $origin = $_SERVER['HTTP_REFERER'];
}

$is_allowed = false;
$parsed_domain = '';

if (!empty($origin)) {
    $parsed_url = parse_url($origin);
    $host = $parsed_url['host'] ?? '';
    
    // Normalizar a minúsculas y quitar prefijo 'www.'
    $parsed_domain = preg_replace('/^www\./', '', strtolower($host));
    
    // Permitir si está en el listado o si es entorno de desarrollo local
    if (in_array($parsed_domain, $allowed_domains) || $parsed_domain === 'localhost' || $parsed_domain === '127.0.0.1') {
        $is_allowed = true;
    }
}

// Enviar cabeceras CORS dinámicas basadas en la validación
if ($is_allowed) {
    header("Access-Control-Allow-Origin: " . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
} else {
    // Si no está permitido y no es una petición local, denegar con un 403
    if (!empty($origin)) {
        http_response_code(403);
        echo json_encode(['error' => 'Dominio no autorizado para reportar métricas.']);
        exit;
    }
    // En caso de llamada directa sin headers de origen/referer (ej. pruebas manuales),
    // usamos el dominio por defecto del servidor central.
    $parsed_domain = 'colegiosferrol.es';
}

// Manejar pre-flight de CORS (solicitudes OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Validar que el método sea POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido. Solo se acepta POST.']);
    exit;
}

// Limitar el tamaño máximo del payload (ej: 5KB) para evitar abusos de espacio en disco
$max_payload_size = 5120; // 5 KB
$content_length = intval($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($content_length > $max_payload_size) {
    http_response_code(413);
    echo json_encode(['error' => 'El tamaño del payload excede el límite permitido.']);
    exit;
}

// Leer cuerpo de la petición (JSON)
$raw_input = file_get_contents('php://input');
$payload = json_decode($raw_input, true);

if (!$payload || !is_array($payload)) {
    http_response_code(400);
    echo json_encode(['error' => 'Datos inválidos. Se requiere JSON bien formado.']);
    exit;
}

// Ubicación del archivo de almacenamiento
$metrics_file = __DIR__ . '/metrics.json';
$today = date('Y-m-d');

// Abrir archivo (crear si no existe) para lectura y escritura
$fp = fopen($metrics_file, 'c+');
if (!$fp) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al abrir el almacenamiento de métricas.']);
    exit;
}

// Limpiar la caché de estado de archivos de PHP para filesize() correcto bajo concurrencia
clearstatcache(true, $metrics_file);

// Adquirir bloqueo exclusivo (LOCK_EX) para evitar condiciones de carrera (Race Conditions)
if (flock($fp, LOCK_EX)) {
    // Leer el archivo completo
    $file_size = filesize($metrics_file);
    $data = [];
    if ($file_size > 0) {
        rewind($fp);
        $content = fread($fp, $file_size);
        $data = json_decode($content, true);
        if (!is_array($data)) {
            $data = [];
        }
    }

    // Inicializar estructura para el día de hoy si no existe
    if (!isset($data[$today])) {
        $data[$today] = [];
    }

    // Inicializar estructura para el dominio si no existe
    if (!isset($data[$today][$parsed_domain])) {
        $data[$today][$parsed_domain] = [
            'pageviews' => 0,
            'sessions' => 0,
            'users' => 0,
            'bounces' => 0,
            'total_duration' => 0,
            'devices' => [
                'desktop' => 0,
                'mobile' => 0
            ],
            'referrers' => [
                'Directo' => 0,
                'Google' => 0,
                'Redes Sociales' => 0,
                'Otros' => 0
            ],
            'pages' => [],
            'clicks_bitkids' => 0,
            'clicks_tel' => 0,
            'uids' => [] // Registro de usuarios únicos temporal para el día de hoy
        ];
    }

    $domain_data = &$data[$today][$parsed_domain];

    // Procesar según el tipo de payload
    if (isset($payload['isBounceCorrection']) && $payload['isBounceCorrection'] === true) {
        // CORRECCIÓN DE REBOTE
        // Si el usuario navegó a otra página en la misma sesión, se decrementa el rebote anterior
        if ($domain_data['bounces'] > 0) {
            $domain_data['bounces']--;
        }
    } else {
        // REPORTE DE PÁGINA VISTA ESTÁNDAR
        $domain_data['pageviews']++;

        // Incrementar sesiones e inicializar referente si es nueva sesión
        if (isset($payload['isNewSession']) && $payload['isNewSession'] === true) {
            $domain_data['sessions']++;
            
            $ref = $payload['referrer'] ?? 'Otros';
            // Validar que el referente calce con las categorías para evitar inyecciones de datos extraños
            $valid_referrers = ['Directo', 'Google', 'Redes Sociales', 'Otros'];
            if (!in_array($ref, $valid_referrers)) {
                $ref = 'Otros';
            }
            $domain_data['referrers'][$ref]++;
        }

        // Deduplicar usuarios únicos por día usando el UID temporal
        $uid = preg_replace('/[^a-zA-Z0-9_]/', '', $payload['uid'] ?? '');
        if (!empty($uid)) {
            if (!isset($domain_data['uids'])) {
                $domain_data['uids'] = [];
            }
            if (!in_array($uid, $domain_data['uids'])) {
                $domain_data['uids'][] = $uid;
                $domain_data['users']++;
            }
        }

        // Registrar Rebote inicial
        if (isset($payload['isBounce']) && $payload['isBounce'] === true) {
            $domain_data['bounces']++;
        }

        // Sumar duración (tiempo de permanencia en segundos)
        $duration = intval($payload['duration'] ?? 0);
        if ($duration > 0 && $duration < 86400) { // Límite de seguridad de 24 horas por página
            $domain_data['total_duration'] += $duration;
        }

        // Registrar Tipo de Dispositivo
        $device = ($payload['device'] ?? '') === 'mobile' ? 'mobile' : 'desktop';
        $domain_data['devices'][$device]++;

        // Registrar Página Visitada (Normalizando ruta)
        $path = $payload['path'] ?? '/';
        // Sanitizar la ruta para evitar caracteres no deseados en las llaves del JSON
        $path = htmlspecialchars(strip_tags($path), ENT_QUOTES, 'UTF-8');
        // Limitar la longitud de la página para evitar desbordamientos
        if (strlen($path) > 255) {
            $path = substr($path, 0, 255);
        }
        if (!isset($domain_data['pages'][$path])) {
            $domain_data['pages'][$path] = 0;
        }
        $domain_data['pages'][$path]++;

        // Registrar Clics Adicionales
        $clicks_bitkids = intval($payload['clicks_bitkids'] ?? 0);
        if ($clicks_bitkids > 0 && $clicks_bitkids < 1000) {
            $domain_data['clicks_bitkids'] += $clicks_bitkids;
        }

        $clicks_tel = intval($payload['clicks_tel'] ?? 0);
        if ($clicks_tel > 0 && $clicks_tel < 1000) {
            $domain_data['clicks_tel'] += $clicks_tel;
        }
    }

    // =========================================================================
    // OPTIMIZACIÓN Y PRIVACIDAD (Limpieza de UIDs de días anteriores)
    // =========================================================================
    // Recorremos los días guardados para eliminar el listado de UIDs de días ya pasados.
    // Esto mantiene el archivo metrics.json súper liviano y elimina IDs persistentes.
    foreach ($data as $day => &$domains_list) {
        if ($day !== $today) {
            foreach ($domains_list as $dom => &$metrics) {
                if (isset($metrics['uids'])) {
                    unset($metrics['uids']);
                }
            }
        }
    }

    // Truncar el archivo a 0 bytes y rebobinar puntero para escribir el nuevo contenido
    ftruncate($fp, 0);
    rewind($fp);

    // Escribir los datos actualizados como JSON
    fwrite($fp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    // Asegurar el vaciado del buffer de salida antes de liberar el bloqueo
    fflush($fp);
    
    // Liberar bloqueo exclusivo
    flock($fp, LOCK_UN);
    
    echo json_encode(['status' => 'success']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'No se pudo bloquear el archivo de métricas.']);
}

fclose($fp);
