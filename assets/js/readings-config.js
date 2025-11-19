// ===== DAILY READINGS CONFIGURATION =====

window.ReadingsConfig = {
    // API Configuration
    apis: {
        primary: 'https://api.usccb.org/bible/readings',
        fallback: [
            'https://universalis.com/api/readings',
            'https://catholic-api.org/readings'
        ]
    },
    
    // Update Schedule
    schedule: {
        updateTime: '00:01', // 12:01 AM
        checkInterval: 3600000, // Check every hour (in milliseconds)
        retryInterval: 300000 // Retry failed updates every 5 minutes
    },
    
    // Cache Settings
    cache: {
        enabled: true,
        duration: 86400000, // 24 hours in milliseconds
        key: 'olmq_daily_readings'
    },
    
    // Notification Settings
    notifications: {
        enabled: true,
        showSuccess: true,
        showErrors: false,
        duration: 5000 // 5 seconds
    },
    
    // Parish Specific Settings
    parish: {
        name: 'Our Lady Mother and Queen Catholic Church',
        location: 'Badore, Lagos',
        timezone: 'Africa/Lagos',
        language: 'en-US'
    },
    
    // Liturgical Calendar Settings
    liturgical: {
        calculateEaster: true,
        showLiturgicalSeason: true,
        showLiturgicalColor: true,
        useLocalCalendar: true
    },
    
    // Debug Settings
    debug: {
        enabled: false,
        logLevel: 'info', // 'error', 'warn', 'info', 'debug'
        showApiCalls: false
    }
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.ReadingsConfig;
}

console.log('Readings configuration loaded successfully!');