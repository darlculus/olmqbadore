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
    // Get actual readings based on date
    $readings = getDailyReadings($date);
    
    if ($readings) {
        return $readings;
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

function getDailyReadings($date) {
    // Readings database for November 2024 - Week 33 Ordinary Time
    $readings = [
        '2024-11-19' => [ // Tuesday, Week 33
            'first' => [
                'reference' => 'Revelation 14:14-19',
                'text' => 'I, John, looked and there was a white cloud, and sitting on the cloud one who looked like a son of man, with a gold crown on his head and a sharp sickle in his hand.'
            ],
            'psalm' => [
                'reference' => 'Psalm 96:10, 11-12, 13',
                'response' => 'The Lord comes to judge the earth.',
                'text' => 'Say among the nations: The LORD is king. He has made the world firm, not to be moved; he governs the peoples with equity.'
            ],
            'gospel' => [
                'reference' => 'Luke 21:5-11',
                'text' => 'While some people were speaking about how the temple was adorned with costly stones and votive offerings, Jesus said, "All that you see here-- the days will come when there will not be left a stone upon another stone that will not be thrown down."'
            ]
        ],
        '2024-11-20' => [ // Wednesday, Week 33
            'first' => [
                'reference' => 'Revelation 15:1-4',
                'text' => 'I, John, saw in heaven another sign, great and awe-inspiring: seven angels with the seven last plagues, for through them the fury of God is accomplished.'
            ],
            'psalm' => [
                'reference' => 'Psalm 98:1, 2-3ab, 7-8, 9',
                'response' => 'The Lord comes to judge the earth.',
                'text' => 'Sing to the LORD a new song, for he has done wondrous deeds; His right hand has won victory for him, his holy arm.'
            ],
            'gospel' => [
                'reference' => 'Luke 21:12-19',
                'text' => 'Jesus said to the crowd: "They will seize and persecute you, they will hand you over to the synagogues and to prisons, and they will have you led before kings and governors because of my name."'
            ]
        ]
    ];
    
    if (isset($readings[$date])) {
        return [
            'date' => $date,
            'first' => $readings[$date]['first'],
            'psalm' => $readings[$date]['psalm'],
            'second' => null,
            'gospel' => $readings[$date]['gospel'],
            'liturgical' => [
                'season' => 'Ordinary Time',
                'color' => 'Green',
                'week' => 'Week 33'
            ],
            'saint' => getSaintOfDay($date)
        ];
    }
    
    return null;
}

function getSaintOfDay($date) {
    $month = date('n', strtotime($date));
    $day = date('j', strtotime($date));
    
    $saints = [
        '11-19' => [
            'name' => 'Saint Raphael Kalinowski, Priest',
            'quote' => 'The most important thing is to do God\'s will with love and trust.',
            'details' => 'Carmelite Priest and Martyr (1835-1907)'
        ],
        '11-20' => [
            'name' => 'Saint Edmund the Martyr',
            'quote' => 'Christ is my life, and death is my gain.',
            'details' => 'King and Martyr (841-869)'
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