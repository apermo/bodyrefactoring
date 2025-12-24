<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 

$files = glob("schedule-*.json");
$schedules = [];

foreach ($files as $file) {
    if (preg_match('/schedule-(\d{4}-\d{2}-\d{2})\.json/', $file, $matches)) {
        $schedules[] = [
            'date' => $matches[1],
            'file' => $file
        ];
    }
}

usort($schedules, function($a, $b) {
    return strcmp($a['date'], $b['date']);
});

echo json_encode($schedules);
