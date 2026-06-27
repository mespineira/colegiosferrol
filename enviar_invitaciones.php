<?php
header('Content-Type: text/html; charset=utf-8');

/**
 * Script de Automatización de Invitaciones Masivas.
 * Exclusivo para administradores. Recorre todos los colegios y despacha emails con links personalizados.
 */

// ¡ADVERTENCIA! Solo debiera ejecutarse en un entorno protegido (o comentar el exit; para usarlo)
// Para ejecutarlo de verdad, retira o comenta la pŕoxima línea.
die("<strong>[Seguridad]</strong> Script bloqueado por defecto. Edita <code>enviar_invitaciones.php</code> en la línea 10 para rehabilitar los envíos masivos.");

$archivoJson = 'colegios.json';

if (!file_exists($archivoJson)) {
    die("No se encontró la base de datos de colegios colegios.json");
}

$data = json_decode(file_get_contents($archivoJson), true);

if (!$data) {
    die("El archivo colegios.json arroja un parseo nulo o corrupto.");
}

$dominoRaiz = "https://colegiosferrol.es";

echo "<h2>Panel de Reparto de Autoría - Colegios Ferrol</h2>";
echo "<p>Inicio de la campaña masiva a directores y secretarías. Leyendo ". count($data) ." colegios...</p>";
echo "<ul>";

$enviadosExitosa = 0;
$omitidos = 0;

foreach ($data as $co) {
    if (!empty($co['email'])) {
        $emailDestino = $co['email'];
        $nombreColegio = htmlspecialchars($co['nombre']);
        $idUrl = urlencode($co['id']);
        
        $linkGestoria = $dominoRaiz . "/gestionar-centro.html?id=" . $idUrl;
        
        $asunto = "Asuma el control en línea de la ficha de su centro - Colegios Ferrol";
        
        $cuerpoHtml = "
        <html>
        <body style='font-family: Arial, sans-serif; color:#333; line-height:1.6;'>
            <p>Estimado equipo directivo y secretaría de <strong>{$nombreColegio}</strong>,</p>
            <p>Nos dirigimos a ustedes desde Guía Colegios de Ferrol para invitarles formalmente a auditar y actualizar la información visible de su centro educativo de cara a la campaña de escolarización del próximo curso.</p>
            <p>Nuestro principal motor es asegurar que las familias cuenten con datos completamente fieles sobre los servicios (Horarios extendidos, transporte, comedor) y los proyectos educativos que imparten día a día.</p>
            <p>Hemos habilitado un panel de autogestión dinámico para que puedan editar su propia ficha pública rápida y directamente. Cualquier alteración será transferida a nuestro sistema para su revisión y activación veloz.</p>
            
            <p style='margin: 30px 0;'>
                <a href='{$linkGestoria}' style='background-color:#0d6efd; color:#ffffff; text-decoration:none; padding:12px 25px; border-radius:5px; font-weight:bold; font-size:15px;'>
                    Acceder a la Ficha de Autogestión del Centro
                </a>
            </p>
            
            <p>Para su comodidad técnica, el acceso permanecerá cifrado a este enlace único asignado con el ID de su colegio.</p>
            <br>
            <p>Atentamente,<br><strong>Administración - ColegiosFerrol.es</strong></p>
        </body>
        </html>
        ";

        $cabeceras = "MIME-Version: 1.0" . "\r\n";
        $cabeceras .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $cabeceras .= "From: <admin@colegiosferrol.es>" . "\r\n";

        // Dispatch (el @ suprime los fallos feos si el servidor local no tiene exim o sendmail)
        $resultadoEnvio = @mail($emailDestino, $asunto, $cuerpoHtml, $cabeceras);
        
        if ($resultadoEnvio) {
            echo "<li><span style='color:green'>[ENVIADO]</span> {$nombreColegio} - <em>{$emailDestino}</em></li>";
            $enviadosExitosa++;
        } else {
            echo "<li><span style='color:red'>[ERROR SMTP]</span> {$nombreColegio} - Falló la pasarela en el servidor.</li>";
        }
        
        // Pausa de cortesía para no colapsar la cola SMTP ni ser tachado de SPAM (básico bulk mail)
        sleep(1); 
        
    } else {
        echo "<li><span style='color:gray'>[SALTADO]</span> {$co['nombre']} - <em>No tiene definido un campo 'email'</em></li>";
        $omitidos++;
    }
}

echo "</ul>";
echo "<hr>";
echo "<p><strong>Campaña Finalizada.</strong> Correos despachados: {$enviadosExitosa} | Correos omitidos: {$omitidos} (Se requiere agregar campo email al JSON)</p>";
?>
