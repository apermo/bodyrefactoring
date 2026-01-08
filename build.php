<?php
/**
 * Netlify Build Script
 * Converts PHP files to static HTML for preview deployments
 */

echo "Building static site for Netlify...\n";

// Create dist directory
if (!file_exists('dist')) {
    mkdir('dist', 0755, true);
}

// Get version from composer.json
$composerJson = json_decode(file_get_contents('composer.json'), true);
$version = $composerJson['version'] ?? '0.0.0';
define('APP_VERSION', $version);

// Function to get asset URL with cache buster
function asset($path) {
    // For Netlify builds, use build timestamp as version
    $timestamp = time();
    return $path . '?v=' . $timestamp;
}

// Read index.php
$indexPhp = file_get_contents('index.php');

// Find the first closing php tag and remove everything before it
$firstCloseTag = strpos($indexPhp, '?>');
if ($firstCloseTag !== false) {
    $indexPhp = substr($indexPhp, $firstCloseTag + 2);
}

// Replace APP_VERSION
$indexPhp = str_replace('<?php echo APP_VERSION; ?>', $version, $indexPhp);

// Replace asset() calls with simple string replacement
$indexPhp = str_replace(
    ['<?php echo asset( \'assets/css/styles.css\' ); ?>', '<?php echo asset( \'assets/js/app.js\' ); ?>'],
    ['assets/css/styles.css?v=' . time(), 'assets/js/app.js?v=' . time()],
    $indexPhp
);

// Write to dist/index.html
file_put_contents('dist/index.html', $indexPhp);
echo "✓ Created dist/index.html\n";

// Copy assets directory
echo "Copying assets...\n";
copyDirectory('assets', 'dist/assets');
echo "✓ Copied assets/\n";

// Copy trainings directory
echo "Copying trainings...\n";
copyDirectory('trainings', 'dist/trainings');
echo "✓ Copied trainings/\n";

// Copy schedule editor
if (file_exists('schedule-editor.php')) {
    // For schedule editor, create a simple static version that loads from relative path
    $editorContent = file_get_contents('schedule-editor.php');
    $editorContent = preg_replace('/<\?php[\s\S]*?\?>/m', '', $editorContent);
    $editorContent = str_replace('<?php echo APP_VERSION; ?>', $version, $editorContent);
    file_put_contents('dist/schedule-editor.html', $editorContent);
    echo "✓ Created dist/schedule-editor.html\n";
}

echo "\n✅ Build complete! Site ready in dist/\n";

/**
 * Recursively copy directory
 */
function copyDirectory($src, $dst) {
    $dir = opendir($src);
    @mkdir($dst, 0755, true);

    while (false !== ($file = readdir($dir))) {
        if (($file != '.') && ($file != '..')) {
            if (is_dir($src . '/' . $file)) {
                copyDirectory($src . '/' . $file, $dst . '/' . $file);
            } else {
                copy($src . '/' . $file, $dst . '/' . $file);
            }
        }
    }

    closedir($dir);
}

