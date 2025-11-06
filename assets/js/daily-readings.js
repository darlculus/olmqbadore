// ===== DAILY READINGS INTEGRATION =====
// Catholic Liturgical Calendar API Integration for OLMQ Church

// ===== API ENDPOINTS =====
const CATHOLIC_APIS = {
    // Primary API - Our PHP proxy that handles multiple sources
    primary: 'api/readings-proxy.php',
    
    // Direct USCCB API (may have CORS issues)
    usccb: 'https://bible.usccb.org/api/readings',
    
    // Catholic Mass Readings API (GitHub)
    catholicMass: 'https://api.catholicmassreadings.com/readings',
    
    // Universalis API (alternative)
    universalis: 'https://universalis.com/cgi-bin/readings.pl'
};

// ===== LITURGICAL COLORS =====
const LITURGICAL_COLORS = {
    'green': '#228B22',
    'purple': '#8B4B9B',
    'violet': '#8B4B9B', 
    'red': '#DC143C',
    'white': '#F8F8FF',
    'gold': '#FFD700',
    'rose': '#FF69B4',
    'black': '#2C2C2C'
};

// ===== LITURGICAL SEASONS =====
const LITURGICAL_SEASONS = {
    'advent': { icon: 'fa-star', color: 'purple' },
    'christmas': { icon: 'fa-baby', color: 'white' },
    'ordinary': { icon: 'fa-leaf', color: 'green' },
    'lent': { icon: 'fa-cross', color: 'purple' },
    'easter': { icon: 'fa-sun', color: 'white' },
    'pentecost': { icon: 'fa-dove', color: 'red' }
};

// ===== MAIN INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('Daily Readings: Initializing...');
    initializeDailyReadings();
});

async function initializeDailyReadings() {
    try {
        // Show loading state
        showReadingsLoading();
        
        // Get today's date
        const today = new Date();
        const dateString = formatDateForAPI(today);
        
        console.log('Daily Readings: Loading for date:', dateString);
        
        // Load liturgical information and readings
        await loadLiturgicalData(dateString);
        await loadDailyReadingsData(dateString);
        
        // Initialize reading controls
        initializeReadingControls();
        
        console.log('Daily Readings: Initialization complete');
        
    } catch (error) {
        console.error('Daily Readings: Initialization failed:', error);
        loadFallbackReadings();
    }
}

// ===== LITURGICAL DATA LOADING =====
async function loadLiturgicalData(dateString) {
    try {
        // Try Church Calendar API first
        const response = await fetch(`${CATHOLIC_APIS.primary}?date=${dateString}`);
        
        if (response.ok) {
            const data = await response.json();
            updateLiturgicalDisplay(data);
            return;
        }
        
        // If primary fails, use fallback liturgical data
        loadFallbackLiturgicalData();
        
    } catch (error) {
        console.error('Liturgical API Error:', error);
        loadFallbackLiturgicalData();
    }
}

function updateLiturgicalDisplay(liturgicalData) {
    // Update liturgical season
    const seasonElement = document.querySelector('#liturgical-season');
    const weekElement = document.querySelector('#liturgical-week');
    const colorIndicator = document.querySelector('#liturgical-color-indicator');
    const colorName = document.querySelector('#liturgical-color-name');
    const seasonIcon = document.querySelector('#season-icon');
    
    if (liturgicalData) {
        const season = liturgicalData.season || 'ordinary';
        const color = (liturgicalData.color || liturgicalData.colour || 'green');
        
        if (seasonElement) seasonElement.textContent = capitalizeFirst(season);
        if (weekElement) weekElement.textContent = liturgicalData.week || 'Week 1';
        if (colorIndicator) colorIndicator.style.backgroundColor = LITURGICAL_COLORS[color.toLowerCase()];
        if (colorName) colorName.textContent = capitalizeFirst(color);
        
        // Update season icon
        if (seasonIcon && LITURGICAL_SEASONS[season.toLowerCase()]) {
            seasonIcon.className = `fas ${LITURGICAL_SEASONS[season.toLowerCase()].icon}`;
        }
        
        // Apply liturgical theme
        applyLiturgicalTheme(color);
    }
    
    // Update date display
    updateDateDisplay();
}

function loadFallbackLiturgicalData() {
    const today = new Date();
    const season = getCurrentLiturgicalSeason(today);
    const color = LITURGICAL_SEASONS[season].color;
    
    updateLiturgicalDisplay({
        season: season,
        colour: color,
        week: `Week ${Math.ceil(today.getDate() / 7)}`
    });
}

function getCurrentLiturgicalSeason(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Simple liturgical season calculation
    if (month === 12 && day >= 1 || month === 1 && day <= 6) return 'advent';
    if (month === 1 && day >= 7 || month === 2) return 'christmas';
    if (month >= 3 && month <= 5) return 'lent';
    if (month >= 6 && month <= 8) return 'easter';
    return 'ordinary';
}

// ===== DAILY READINGS DATA LOADING =====
async function loadDailyReadingsData(dateString) {
    try {
        // Try our PHP proxy first (handles multiple sources)
        const success = await loadFromProxy(dateString);
        if (!success) {
            // Fallback to direct API calls
            await loadUSCCBReadings(dateString) || 
            await loadCatholicMassReadings(dateString) ||
            loadFallbackReadings();
        }
        
    } catch (error) {
        console.error('Readings API Error:', error);
        loadFallbackReadings();
    }
}

async function loadFromProxy(dateString) {
    try {
        const response = await fetch(`${CATHOLIC_APIS.primary}?date=${dateString}`);
        
        if (response.ok) {
            const data = await response.json();
            updateReadingsFromProxy(data);
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('Proxy API Error:', error);
        return false;
    }
}

function updateReadingsFromProxy(data) {
    if (data && data.readings) {
        // Update liturgical information
        if (data.liturgical) {
            updateLiturgicalDisplay(data.liturgical);
        }
        
        // First Reading
        if (data.readings.first) {
            updateReading('first', data.readings.first);
        }
        
        // Responsorial Psalm
        if (data.readings.psalm) {
            updatePsalm(data.readings.psalm);
        }
        
        // Second Reading (if available)
        if (data.readings.second) {
            updateReading('second', data.readings.second);
        }
        
        // Gospel
        if (data.readings.gospel) {
            updateReading('gospel', data.readings.gospel);
            
            // Gospel Acclamation
            if (data.readings.gospel.acclamation) {
                updateGospelAcclamation(data.readings.gospel.acclamation);
            }
        }
    }
    
    hideReadingsLoading();
}

async function loadUSCCBReadings(dateString) {
    try {
        // Format date for USCCB API (MM/DD/YYYY)
        const date = new Date(dateString);
        const usccbDate = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
        
        const response = await fetch(`${CATHOLIC_APIS.usccb}/${usccbDate}`);
        
        if (response.ok) {
            const data = await response.json();
            updateReadingsFromUSCCB(data);
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('USCCB API Error:', error);
        return false;
    }
}

async function loadCatholicMassReadings(dateString) {
    try {
        const response = await fetch(`${CATHOLIC_APIS.catholicMass}/${dateString}`);
        
        if (response.ok) {
            const data = await response.json();
            updateReadingsFromCatholicMass(data);
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('Catholic Mass Readings API Error:', error);
        return false;
    }
}

function updateReadingsFromCatholicMass(data) {
    // This would need to be adapted based on the actual API structure
    // For now, use fallback
    loadFallbackReadings();
}

function updateReadingsFromUSCCB(data) {
    if (data && data.readings) {
        // First Reading
        if (data.readings.first_reading) {
            updateReading('first', {
                reference: data.readings.first_reading.citation,
                text: data.readings.first_reading.content
            });
        }
        
        // Responsorial Psalm
        if (data.readings.psalm) {
            updatePsalm({
                reference: data.readings.psalm.citation,
                response: data.readings.psalm.refrain,
                text: data.readings.psalm.content
            });
        }
        
        // Second Reading (if available)
        if (data.readings.second_reading) {
            updateReading('second', {
                reference: data.readings.second_reading.citation,
                text: data.readings.second_reading.content
            });
        }
        
        // Gospel
        if (data.readings.gospel) {
            updateReading('gospel', {
                reference: data.readings.gospel.citation,
                text: data.readings.gospel.content
            });
            
            // Gospel Acclamation
            if (data.readings.gospel.acclamation) {
                updateGospelAcclamation(data.readings.gospel.acclamation);
            }
        }
    }
    
    hideReadingsLoading();
}

// ===== FALLBACK READINGS =====
function loadFallbackReadings() {
    console.log('Daily Readings: Loading fallback readings');
    
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Get readings based on day of week
    const readings = getFallbackReadingsByDay(dayOfWeek);
    
    // Update display
    updateReading('first', readings.first);
    updatePsalm(readings.psalm);
    if (readings.second) updateReading('second', readings.second);
    updateReading('gospel', readings.gospel);
    
    hideReadingsLoading();
}

function getFallbackReadingsByDay(dayOfWeek) {
    const fallbackReadings = {
        0: { // Sunday
            first: {
                reference: "Isaiah 55:10-11",
                text: "Thus says the LORD: Just as from the heavens the rain and snow come down and do not return there till they have watered the earth, making it fertile and fruitful, giving seed to the one who sows and bread to the one who eats, so shall my word be that goes forth from my mouth; my word shall not return to me void, but shall do my will, achieving the end for which I sent it."
            },
            psalm: {
                reference: "Psalm 65:10, 11, 12-13, 14",
                response: "The seed that falls on good ground will yield a fruitful harvest.",
                text: "You have visited the land and watered it; greatly have you enriched it. God's watercourses are filled; you have prepared the grain. R. Thus have you prepared the land: drenching its furrows, breaking up its clods, Softening it with showers, blessing its yield. R. You have crowned the year with your bounty, and your paths overflow with a rich harvest; The untilled meadows overflow with it, and rejoicing clothes the hills. R."
            },
            second: {
                reference: "Romans 8:18-23",
                text: "Brothers and sisters: I consider that the sufferings of this present time are as nothing compared with the glory to be revealed for us. For creation awaits with eager expectation the revelation of the children of God..."
            },
            gospel: {
                reference: "Matthew 13:1-23",
                text: "On that day, Jesus went out of the house and sat down by the sea. Such large crowds gathered around him that he got into a boat and sat down, and the whole crowd stood along the shore. And he spoke to them at length in parables, saying: 'A sower went out to sow. And as he sowed, some seed fell on the path, and birds came and ate it up...'"
            }
        },
        1: { // Monday
            first: {
                reference: "1 Kings 19:9, 11-13",
                text: "At the mountain of God, Horeb, Elijah came to a cave where he took shelter. Then the LORD said to him, 'Go outside and stand on the mountain before the LORD; the LORD will be passing by...'"
            },
            psalm: {
                reference: "Psalm 85:9, 10, 11-12, 13-14",
                response: "Lord, let us see your kindness, and grant us your salvation.",
                text: "I will hear what God proclaims; the LORD—for he proclaims peace to his people. Near indeed is his salvation to those who fear him, glory dwelling in our land. R."
            },
            gospel: {
                reference: "Matthew 14:22-36",
                text: "After he had fed the people, Jesus made the disciples get into a boat and precede him to the other side, while he dismissed the crowds. After doing so, he went up on the mountain by himself to pray..."
            }
        },
        // Add more days as needed...
        default: {
            first: {
                reference: "Romans 8:28",
                text: "We know that all things work for good for those who love God, who are called according to his purpose."
            },
            psalm: {
                reference: "Psalm 23",
                response: "The Lord is my shepherd; there is nothing I shall want.",
                text: "The LORD is my shepherd; I shall not want. In verdant pastures he gives me repose; beside restful waters he leads me; he refreshes my soul. R."
            },
            gospel: {
                reference: "John 3:16-17",
                text: "God so loved the world that he gave his only Son, so that everyone who believes in him might not perish but might have eternal life. For God did not send his Son into the world to condemn the world, but that the world might be saved through him."
            }
        }
    };
    
    return fallbackReadings[dayOfWeek] || fallbackReadings.default;
}

// ===== READING DISPLAY FUNCTIONS =====
function updateReading(type, readingData) {
    const referenceElement = document.querySelector(`#${type}-reading-reference`);
    const textElement = document.querySelector(`#${type}-reading-text`);
    
    if (referenceElement && readingData.reference) {
        referenceElement.textContent = readingData.reference;
    }
    
    if (textElement && readingData.text) {
        textElement.innerHTML = formatReadingText(readingData.text);
    }
}

function updatePsalm(psalmData) {
    const referenceElement = document.querySelector('#psalm-reference');
    const responseElement = document.querySelector('#psalm-response');
    const textElement = document.querySelector('#psalm-text');
    
    if (referenceElement && psalmData.reference) {
        referenceElement.textContent = psalmData.reference;
    }
    
    if (responseElement && psalmData.response) {
        responseElement.innerHTML = `<strong>R. ${psalmData.response}</strong>`;
    }
    
    if (textElement && psalmData.text) {
        textElement.innerHTML = formatPsalmText(psalmData.text);
    }
}

function updateGospelAcclamation(acclamationText) {
    const acclamationElement = document.querySelector('#gospel-acclamation-text');
    if (acclamationElement && acclamationText) {
        acclamationElement.textContent = acclamationText;
    }
}

function formatReadingText(text) {
    return text
        .replace(/\n\n/g, '</p><p>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\+([^+]+)\+/g, '<strong>$1</strong>');
}

function formatPsalmText(text) {
    return text
        .replace(/R\./g, '<strong class="psalm-response-indicator">R.</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');
}

// ===== LITURGICAL THEMING =====
function applyLiturgicalTheme(color) {
    const root = document.documentElement;
    const themeColor = LITURGICAL_COLORS[color.toLowerCase()] || LITURGICAL_COLORS.green;
    
    // Update CSS custom properties
    root.style.setProperty('--liturgical-primary', themeColor);
    root.style.setProperty('--liturgical-light', `${themeColor}20`);
    root.style.setProperty('--liturgical-dark', adjustBrightness(themeColor, -20));
    root.style.setProperty('--liturgical-color', themeColor);
    
    // Update body class
    document.body.className = document.body.className.replace(/liturgical-\w+/g, '');
    document.body.classList.add(`liturgical-${color.toLowerCase()}`);
    
    // Update liturgical season data attribute
    document.body.setAttribute('data-liturgical-season', color.toLowerCase());
}

function adjustBrightness(hex, percent) {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

// ===== READING CONTROLS =====
function initializeReadingControls() {
    // Audio buttons
    const audioButtons = document.querySelectorAll('.audio-btn');
    audioButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const readingType = this.getAttribute('data-reading');
            playReading(readingType);
        });
    });
    
    // Expand buttons
    const expandButtons = document.querySelectorAll('.expand-btn');
    expandButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const readingType = this.getAttribute('data-reading');
            toggleReadingExpansion(readingType);
        });
    });
    
    // Action buttons
    const actionButtons = document.querySelectorAll('.action-btn:not([href])');
    actionButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
        });
    });
}

function playReading(readingType) {
    const textElement = document.querySelector(`#${readingType}-reading-text, #${readingType}-text`);
    if (!textElement) return;
    
    const text = textElement.textContent;
    if ('speechSynthesis' in window) {
        // Stop any current speech
        speechSynthesis.cancel();
        
        // Create new utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        // Speak the text
        speechSynthesis.speak(utterance);
        
        // Update button state
        const button = document.querySelector(`[data-reading="${readingType}"]`);
        if (button) {
            button.innerHTML = '<i class="fas fa-stop"></i>';
            utterance.onend = () => {
                button.innerHTML = '<i class="fas fa-play"></i>';
            };
        }
    } else {
        alert('Text-to-speech is not supported in your browser.');
    }
}

function toggleReadingExpansion(readingType) {
    const readingCard = document.querySelector(`.reading-card.${readingType}-reading, .reading-card.${readingType}`);
    if (readingCard) {
        readingCard.classList.toggle('expanded');
        
        // Scroll to the reading if expanded
        if (readingCard.classList.contains('expanded')) {
            readingCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

// ===== UTILITY FUNCTIONS =====
function formatDateForAPI(date) {
    return date.toISOString().split('T')[0];
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function updateDateDisplay() {
    const dateElement = document.querySelector('#liturgical-date');
    const dayElement = document.querySelector('#liturgical-day');
    
    const today = new Date();
    
    if (dateElement) {
        dateElement.textContent = today.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    if (dayElement) {
        const dayOfWeek = today.getDay();
        if (dayOfWeek === 0) {
            dayElement.textContent = 'Sunday';
        } else if (dayOfWeek === 6) {
            dayElement.textContent = 'Saturday';
        } else {
            dayElement.textContent = 'Weekday';
        }
    }
}

function showReadingsLoading() {
    const loadingElements = [
        '#first-reading-text',
        '#psalm-text',
        '#second-reading-text', 
        '#gospel-text'
    ];
    
    loadingElements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.innerHTML = '<div class="loading-spinner"></div><p>Loading today\'s reading...</p>';
        }
    });
}

function hideReadingsLoading() {
    const spinners = document.querySelectorAll('.loading-spinner');
    spinners.forEach(spinner => {
        if (spinner.parentNode) {
            spinner.parentNode.removeChild(spinner);
        }
    });
}

// ===== AUTO-REFRESH =====
// Refresh readings at midnight
function scheduleReadingsRefresh() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
        console.log('Daily Readings: Auto-refreshing for new day');
        initializeDailyReadings();
        
        // Set up daily refresh
        setInterval(initializeDailyReadings, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
}

// Start auto-refresh scheduling
scheduleReadingsRefresh();

console.log('Daily Readings: Script loaded successfully');