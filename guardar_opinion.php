<?php
header('Content-Type: application/json');

// Permitir peticiones desde el mismo origen (útil si se despliega en subdominios o entornos locales de prueba)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Seguimiento Anti-Spam: Si el honeypot ha sido rellenado, detenemos y enviamos falso positivo
    if (!empty($_POST['_website_url_verify'])) {
        echo json_encode(['success' => true]);
        exit;
    }

    $id_colegio = $_POST['id_colegio'] ?? '';
    $nombre = strip_tags($_POST['nombre'] ?? 'Anónimo');
    $valoracion = (int)($_POST['valoracion'] ?? 5);
    $comentario = strip_tags($_POST['comentario'] ?? '');
    
    // Básica validación
    if (empty($id_colegio) || empty($comentario)) {
        echo json_encode(['success' => false, 'message' => 'Faltan campos obligatorios.']);
        exit;
    }

    $archivo = 'opiniones.json';
    $opiniones = [];
    
    // Leer si existe
    if (file_exists($archivo)) {
        $contenido = file_get_contents($archivo);
        if ($contenido) {
            $opiniones = json_decode($contenido, true) ?: [];
        }
    }
    
    $nuevaOpinion = [
        'id_opinion' => uniqid('op_'),
        'id_colegio' => $id_colegio,
        'nombre' => $nombre,
        'valoracion' => $valoracion,
        'comentario' => $comentario,
        'fecha' => date('Y-m-d H:i:s')
    ];
    
    // Añadir al principio del array para que salgan primero las más nuevas (o al final, depende cómo se rendericen)
    array_unshift($opiniones, $nuevaOpinion);
    
    // Guardar
    if (file_put_contents($archivo, json_encode($opiniones, JSON_PRETTY_PRINT))) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al guardar la opinión en el servidor. Revise permisos de escritura (chmod 666 opiniones.json).']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Método no soportado.']);
}
?>
