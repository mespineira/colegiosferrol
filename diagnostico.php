<?php
/**
 * diagnostico.php - Herramienta de Diagnóstico del Sistema de Analítica
 * 
 * Accede a esta página desde tu navegador (ej: https://colegiosferrol.es/diagnostico.php)
 * para comprobar si el servidor tiene la configuración y permisos adecuados.
 */

// Habilitar errores para diagnóstico
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Diagnóstico de Analítica | BitKids</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f1f5f9; padding: 2rem; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 2rem; max-width: 650px; margin: 0 auto; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3); }
        h1 { margin-top: 0; color: #6366f1; border-bottom: 2px solid #334155; padding-bottom: 1rem; }
        .status { padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem; font-weight: bold; }
        .success { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
        .danger { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
        .warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
        ul { padding-left: 1.2rem; }
        li { margin-bottom: 0.5rem; }
        pre { background: #0f172a; padding: 1rem; border-radius: 6px; overflow-x: auto; color: #a7f3d0; border: 1px solid #1e293b; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Diagnóstico del Servidor de Analítica</h1>
        
        <?php
        $errors = [];
        $warnings = [];
        $metrics_file = __DIR__ . '/metrics.json';
        $directory = __DIR__;

        // 1. Comprobar Versión de PHP
        $php_version = PHP_VERSION;
        if (version_compare($php_version, '7.0.0', '<')) {
            $errors[] = "La versión de PHP instalada es muy antigua ({$php_version}). Se recomienda PHP 7.0 o superior.";
        }

        // 2. Comprobar si el directorio del servidor permite escritura
        if (!is_writable($directory)) {
            $errors[] = "El directorio raíz de la analítica (<strong>{$directory}</strong>) no tiene permisos de escritura. PHP no podrá crear 'metrics.json'.";
        }

        // 3. Comprobar el archivo metrics.json si ya existe
        if (file_exists($metrics_file)) {
            if (!is_writable($metrics_file)) {
                $errors[] = "El archivo <strong>metrics.json</strong> existe pero no tiene permisos de escritura. Cambia sus permisos (CHMOD) a 644 o 666.";
            }
            
            // Comprobar si el archivo contiene JSON válido
            $content = file_get_contents($metrics_file);
            if (!empty($content)) {
                $json = json_decode($content, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    $warnings[] = "El archivo <strong>metrics.json</strong> existe pero no contiene un JSON válido (Error: " . json_last_error_msg() . "). Si es necesario, vacíalo o bórralo para que se cree de cero.";
                }
            }
        } else {
            $warnings[] = "El archivo <strong>metrics.json</strong> no existe aún. Se creará automáticamente con la primera visita registrada si los permisos de la carpeta son correctos.";
        }

        // Mostrar estado general
        if (count($errors) === 0) {
            echo "<div class='status success'>✔ ¡El servidor está listo! Todos los tests de configuración han pasado con éxito.</div>";
        } else {
            echo "<div class='status danger'>✘ Se han detectado problemas de configuración que impiden el funcionamiento.</div>";
        }
        ?>

        <h3>Detalles de la configuración de tu Hosting:</h3>
        <ul>
            <li><strong>Versión de PHP:</strong> <?php echo htmlspecialchars($php_version); ?></li>
            <li><strong>Directorio del script:</strong> <code><?php echo htmlspecialchars($directory); ?></code></li>
            <li><strong>Permisos del directorio:</strong> <code><?php echo substr(sprintf('%o', fileperms($directory)), -4); ?></code></li>
            <li><strong>Permisos del archivo metrics.json:</strong> 
                <code>
                    <?php 
                    if (file_exists($metrics_file)) {
                        echo substr(sprintf('%o', fileperms($metrics_file)), -4); 
                    } else {
                        echo "No creado todavía";
                    }
                    ?>
                </code>
            </li>
        </ul>

        <?php if (count($errors) > 0): ?>
            <h3 style="color: #f87171;">Errores Críticos a Corregir:</h3>
            <ul>
                <?php foreach ($errors as $err): ?>
                    <li><?php echo $err; ?></li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>

        <?php if (count($warnings) > 0): ?>
            <h3 style="color: #fbbf24;">Advertencias:</h3>
            <ul>
                <?php foreach ($warnings as $warn): ?>
                    <li><?php echo $warn; ?></li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>

        <h3>Prueba rápida del archivo de métricas:</h3>
        <p>A continuación se muestra una lectura de diagnóstico del contenido actual de <code>metrics.json</code>:</p>
        <pre><?php
            if (file_exists($metrics_file)) {
                $content = file_get_contents($metrics_file);
                if (empty($content)) {
                    echo "[El archivo está vacío]";
                } else {
                    echo htmlspecialchars($content);
                }
            } else {
                echo "[El archivo metrics.json aún no se ha creado]";
            }
        ?></pre>
    </div>
</body>
</html>
