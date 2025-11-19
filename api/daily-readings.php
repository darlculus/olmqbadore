<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
date_default_timezone_set('Africa/Lagos');

$date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
$dayOffset = isset($_GET['theday']) ? (int)$_GET['theday'] : 0;

if ($dayOffset !== 0) {
    $date = date('Y-m-d', strtotime("$dayOffset days"));
}

// Try Roman Missal API first
$readings = fetchFromRomanMissal($date);

if (!$readings) {
    $readings = getFallbackReadings($date);
}

echo json_encode($readings);

function fetchFromRomanMissal($date) {
    $url = "https://api.romanmissal.org/v2/readings?date=$date&country=ng";
    
    $context = stream_context_create([
        'http' => [
            'timeout' => 10,
            'user_agent' => 'OLMQ Church Website'
        ]
    ]);
    
    $response = @file_get_contents($url, false, $context);
    
    if ($response) {
        $data = json_decode($response, true);
        if (isset($data['readings'])) {
            return formatReadings($data, $date);
        }
    }
    
    return null;
}

function formatReadings($data, $date) {
    $readings = $data['readings'];
    
    return [
        'date' => $date,
        'first' => [
            'reference' => $readings['first']['citation'] ?? $readings['first_reading']['citation'] ?? 'First Reading',
            'text' => $readings['first']['content'] ?? $readings['first_reading']['content'] ?? 'Reading content'
        ],
        'psalm' => [
            'reference' => $readings['psalm']['citation'] ?? $readings['responsorial']['citation'] ?? 'Responsorial Psalm',
            'response' => $readings['psalm']['response'] ?? $readings['responsorial']['response'] ?? 'Lord, hear our prayer.',
            'text' => $readings['psalm']['content'] ?? $readings['responsorial']['content'] ?? 'Psalm content'
        ],
        'second' => isset($readings['second_reading']) ? [
            'reference' => $readings['second_reading']['citation'] ?? 'Second Reading',
            'text' => $readings['second_reading']['content'] ?? 'Second reading content'
        ] : null,
        'gospel' => [
            'reference' => $readings['gospel']['citation'] ?? 'Gospel',
            'text' => $readings['gospel']['content'] ?? 'Gospel content'
        ],
        'liturgical' => [
            'season' => 'Ordinary Time',
            'color' => 'Green',
            'week' => 'Week 33'
        ],
        'saint' => getSaintOfDay($date)
    ];
}

function getFallbackReadings($date) {
    if ($date === '2024-11-19') {
        return [
            'date' => $date,
            'first' => [
                'reference' => '2 Maccabees 6:18-31',
                'text' => 'Eleazar, one of the foremost scribes, a man of advanced age and noble appearance, was being forced to open his mouth to eat pork. But preferring a glorious death to a life of defilement, he spat out the meat and went forward of his own accord to the instrument of torture.'
            ],
            'psalm' => [
                'reference' => 'Psalm 3:2-3, 4-5, 6-7',
                'response' => 'The Lord upholds me.',
                'text' => 'O LORD, how many are my adversaries! Many rise up against me! Many are saying of me, "There is no salvation for him in God."'
            ],
            'second' => null,
            'gospel' => [
                'reference' => 'Luke 19:1-10',
                'text' => 'Jesus came to Jericho and intended to pass through the town. Now a man there named Zacchaeus, who was a chief tax collector and also a wealthy man, was seeking to see who Jesus was.'
            ],
            'liturgical' => [
                'season' => 'Ordinary Time',
                'color' => 'Green',
                'week' => 'Week 33'
            ],
            'saint' => [
                'name' => 'Saint Raphael Kalinowski, Priest',
                'quote' => 'The most important thing is to do God\'s will with love and trust.',
                'details' => 'Carmelite Priest and Martyr (1835-1907)'
            ]
        ];
    }
    
    return [
        'date' => $date,
        'first' => [
            'reference' => 'Isaiah 55:10-11',
            'text' => 'Thus says the LORD: Just as from the heavens the rain and snow come down and do not return there till they have watered the earth.'
        ],
        'psalm' => [
            'reference' => 'Psalm 65:10, 11, 12-13, 14',
            'response' => 'The seed that falls on good ground will yield a fruitful harvest.',
            'text' => 'You have visited the land and watered it; greatly have you enriched it.'
        ],
        'second' => null,
        'gospel' => [
            'reference' => 'Matthew 13:1-23',
            'text' => 'On that day, Jesus went out of the house and sat down by the sea.'
        ],
        'liturgical' => [
            'season' => 'Ordinary Time',
            'color' => 'Green',
            'week' => 'Week 1'
        ],
        'saint' => getSaintOfDay($date)
    ];
}

function getSaintOfDay($date) {
    $month = date('n', strtotime($date));
    $day = date('j', strtotime($date));
    
    $saints = [
        '11-19' => [
            'name' => 'Saint Raphael Kalinowski, Priest',
            'quote' => 'The most important thing is to do God\'s will with love and trust.',
            'details' => 'Carmelite Priest and Martyr (1835-1907)'
        ]
    ];
    
    $key = "$month-$day";
    return $saints[$key] ?? [
        'name' => 'Saints of the Day',
        'quote' => 'Pray for us, all holy men and women of God.',
        'details' => 'All Saints and Martyrs'
    ];
}
?>