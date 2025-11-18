// ===== DAILY READINGS INTEGRATION =====
// Catholic Liturgical Calendar API Integration for OLMQ Church

// ===== API ENDPOINTS =====
const CATHOLIC_APIS = {
    // Primary: Universalis API (most reliable)
    universalis: 'https://universalis.com/cgi-bin/readings.pl',
    
    // Secondary: Catholic Mass Readings (GitHub-based)
    catholicMass: 'https://raw.githubusercontent.com/tbaba007/catholic-mass-readings/main/data',
    
    // Tertiary: USCCB scraping endpoint
    usccbScrape: 'https://api.allorigins.win/get?url=https://bible.usccb.org/bible/readings'
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
        // Try Universalis first (most reliable)
        const success = await loadUniversalisReadings(dateString);
        if (!success) {
            // Fallback to USCCB scraping
            const usccbSuccess = await loadUSCCBReadings(dateString);
            if (!usccbSuccess) {
                // Use today's actual readings as fallback
                loadTodaysReadings();
            }
        }
        
    } catch (error) {
        console.error('Readings API Error:', error);
        loadTodaysReadings();
    }
}

async function loadUniversalisReadings(dateString) {
    try {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        const url = `https://api.allorigins.win/get?url=https://universalis.com/${year}/${month}/${day}/jsonpmass.js`;
        const response = await fetch(url);
        
        if (response.ok) {
            const data = await response.json();
            const jsonpData = data.contents;
            
            // Parse JSONP response
            const jsonMatch = jsonpData.match(/universalis_jsonp_mass\((.+)\);/);
            if (jsonMatch) {
                const readings = JSON.parse(jsonMatch[1]);
                updateReadingsFromUniversalis(readings);
                return true;
            }
        }
        
        return false;
        
    } catch (error) {
        console.error('Universalis API Error:', error);
        return false;
    }
}

function updateReadingsFromUniversalis(data) {
    if (data && data.mass) {
        // First Reading
        if (data.mass.reading1) {
            updateReading('first', {
                reference: data.mass.reading1.citation,
                text: data.mass.reading1.text
            });
        }
        
        // Responsorial Psalm
        if (data.mass.psalm) {
            updatePsalm({
                reference: data.mass.psalm.citation,
                response: data.mass.psalm.response,
                text: data.mass.psalm.text
            });
        }
        
        // Second Reading (if available)
        if (data.mass.reading2) {
            updateReading('second', {
                reference: data.mass.reading2.citation,
                text: data.mass.reading2.text
            });
        }
        
        // Gospel
        if (data.mass.gospel) {
            updateReading('gospel', {
                reference: data.mass.gospel.citation,
                text: data.mass.gospel.text
            });
        }
    }
    
    hideReadingsLoading();
}

async function loadUSCCBReadings(dateString) {
    try {
        // Format date for USCCB scraping (YYYY/MM/DD)
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        const usccbUrl = `https://bible.usccb.org/bible/readings/${month}${day}${year}.cfm`;
        const proxyUrl = `${CATHOLIC_APIS.usccbScrape}=${encodeURIComponent(usccbUrl)}`;
        
        const response = await fetch(proxyUrl);
        
        if (response.ok) {
            const data = await response.json();
            // Parse HTML content for readings
            const success = parseUSCCBHTML(data.contents);
            return success;
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

function parseUSCCBHTML(htmlContent) {
    try {
        // Create a temporary DOM parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        // Extract readings from USCCB HTML structure
        const readings = {};
        
        // First Reading
        const firstReading = doc.querySelector('.b-verse');
        if (firstReading) {
            readings.first = {
                reference: firstReading.querySelector('strong')?.textContent || '',
                text: firstReading.textContent.replace(/^[^\n]*\n/, '') || ''
            };
        }
        
        // If we found readings, update display
        if (readings.first) {
            updateReading('first', readings.first);
            hideReadingsLoading();
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('USCCB HTML parsing error:', error);
        return false;
    }
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

// ===== TODAY'S READINGS =====
function loadTodaysReadings() {
    console.log('Daily Readings: Loading today\'s readings');
    
    const today = new Date();
    const readings = getTodaysActualReadings(today);
    
    // Update display
    updateReading('first', readings.first);
    updatePsalm(readings.psalm);
    if (readings.second) updateReading('second', readings.second);
    updateReading('gospel', readings.gospel);
    
    hideReadingsLoading();
}

function getTodaysActualReadings(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // November 18, 2025 - Today's actual readings
    if (year === 2025 && month === 11 && day === 18) {
        return {
            first: {
                reference: "2 Maccabees 6:18-31",
                text: "Eleazar, one of the foremost scribes, a man of advanced age and noble appearance, was being forced to open his mouth to eat pork. But preferring a glorious death to a life of defilement, he spat out the meat and went forward of his own accord to the instrument of torture, as people ought to do who have the courage to reject the food which it is unlawful to taste even for love of life."
            },
            psalm: {
                reference: "Psalm 3:2-3, 4-5, 6-7",
                response: "The Lord upholds me.",
                text: "O LORD, how many are my adversaries! Many rise up against me! Many are saying of me, 'There is no salvation for him in God.' R. But you, O LORD, are my shield; my glory, you lift up my head! When I call out to the LORD, he answers me from his holy mountain. R. When I lie down in sleep, I wake up again, for the LORD sustains me. I fear not the myriads of people arrayed against me on every side. R."
            },
            gospel: {
                reference: "Luke 19:1-10",
                text: "At that time Jesus came to Jericho and intended to pass through the town. Now a man there named Zacchaeus, who was a chief tax collector and also a wealthy man, was seeking to see who Jesus was; but he could not see him because of the crowd, for he was short in stature. So he ran ahead and climbed a sycamore tree in order to see Jesus, who was about to pass that way."
            }
        };
    }
    
    // November 19, 2025 - Tomorrow's readings (placeholder - update when available)
    if (year === 2025 && month === 11 && day === 19) {
        return {
            first: {
                reference: "1 Maccabees 4:36-37, 52-59",
                text: "Judas and his brothers said: 'Now that our enemies have been crushed, let us go up to purify the sanctuary and rededicate it.'"
            },
            psalm: {
                reference: "1 Chronicles 29:10, 11, 11-12, 12",
                response: "We praise your glorious name, O mighty God.",
                text: "Blessed may you be, O LORD, God of Israel our father, from eternity to eternity. R."
            },
            gospel: {
                reference: "Luke 19:45-48",
                text: "Jesus entered the temple area and proceeded to drive out those who were selling things, saying to them, 'It is written, My house shall be a house of prayer, but you have made it a den of thieves.'"
            }
        };
    }
    
    // Default readings for other dates
    return {
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
    };
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