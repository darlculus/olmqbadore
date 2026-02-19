<?php
date_default_timezone_set('Africa/Lagos');
$today = date('Y-m-d');

// Force refresh readings
$apiUrl = "http://localhost/api/daily-readings.php?date=$today";
$response = file_get_contents($apiUrl);

echo "Daily readings updated for $today\n";
?>