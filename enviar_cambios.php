<?php
header('Content-Type: application/json');

// Recibir stream JSON
$rawData = file_get_contents("php://input");
$data = json_decode($rawData, true);

if (!$data || empty($data['nombre'])) {
    echo json_encode(['success' => false, 'message' => 'Cuerpo JSON ausente o estructura no válida.']);
    exit;
}

// Configuración de Email de Administración
$admin_email = "admin@colegiosferrol.es";

// Limpieza para Subject
$nombreColegio = htmlspecialchars($data['nombre']);

$asunto = "[Actualización de Centro] Ficha editada por director: " . $nombreColegio;

$jsonFormateado = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

$mensajeHtml = "
<html>
<head>
  <title>Actualización de Ficha JSON</title>
</head>
<body style='font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;'>

  <div style='background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);'>
      <h2 style='color: #0d6efd;'>Actualización de Datos: {$nombreColegio}</h2>
      <p style='font-size: 16px; color: #333;'>El colegio <strong>{$nombreColegio}</strong> ha enviado una actualización a su ficha a través del portal de autogestión.</p>
      
      <p style='color: #666; font-size: 14px;'>Por favor, copia todo el siguiente bloque de código y reemplázalo en tu archivo <code>colegios.json</code> donde corresponda a su respectivo ID.</p>
      
      <div style='background-color: #272822; color: #f8f8f2; padding: 15px; border-radius: 5px; overflow-x: auto;'>
          <pre style='margin: 0; font-family: Consolas, monospace; font-size: 13px;'>{$jsonFormateado}</pre>
      </div>

      <p style='font-size: 12px; color: #999; margin-top: 30px;'>* Generado automáticamente desde el Panel de Directores de Colegios Ferrol.</p>
  </div>

</body>
</html>
";

$cabeceras = "MIME-Version: 1.0" . "\r\n";
$cabeceras .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$cabeceras .= "From: <noreply@colegiosferrol.es>" . "\r\n";

// En PHP nativo mail() retorna boolean
$enviado = mail($admin_email, $asunto, $mensajeHtml, $cabeceras);

if ($enviado) {
    echo json_encode(['success' => true]);
} else {
    // Es posible que el servidor dev no tenga puerto SMTP configurado. Envolvemos con un success true si la política es fall-back para dev.
    echo json_encode(['success' => false, 'message' => 'Disculpe, el servidor de correo se encuentra temporalmente inoperativo. Pruebe más tarde.']);
}
?>
