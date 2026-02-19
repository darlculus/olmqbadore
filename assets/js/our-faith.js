// ===== OUR FAITH PAGE JAVASCRIPT =====

// ===== UTILITY FUNCTIONS =====
function safeQuerySelector(selector) {
    try {
        return document.querySelector(selector);
    } catch (e) {
        console.warn(`Element not found: ${selector}`);
        return null;
    }
}

function safeQuerySelectorAll(selector) {
    try {
        return document.querySelectorAll(selector);
    } catch (e) {
        console.warn(`Elements not found: ${selector}`);
        return [];
    }
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    // Add notification styles if not present
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                padding: 20px;
                z-index: 10000;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                max-width: 350px;
                border-left: 4px solid #3498db;
            }
            .notification.show { transform: translateX(0); }
            .notification.success { border-left-color: #27ae60; }
            .notification.error { border-left-color: #e74c3c; }
            .notification.warning { border-left-color: #f39c12; }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 10px;
            }
            .notification-content i {
                font-size: 18px;
                color: #3498db;
            }
            .notification.success .notification-content i { color: #27ae60; }
            .notification.error .notification-content i { color: #e74c3c; }
            .notification.warning .notification-content i { color: #f39c12; }
            .notification-content span {
                color: #2c3e50;
                font-weight: 500;
                line-height: 1.4;
            }
            .notification-close {
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                color: #7f8c8d;
                font-size: 18px;
                cursor: pointer;
                transition: color 0.3s ease;
            }
            .notification-close:hover { color: #2c3e50; }
        `;
        document.head.appendChild(style);
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : type === 'warning' ? 'exclamation-triangle' : 'info'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto hide after 5 seconds
    setTimeout(() => hideNotification(notification), 5000);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => hideNotification(notification));
}

function hideNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// ===== NAVIGATION =====
function initNavigation() {
    const navToggle = safeQuerySelector('.nav-toggle');
    const navMenu = safeQuerySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        const toggleMenu = function(e) {
            e.preventDefault();
            e.stopPropagation();
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        };
        
        navToggle.addEventListener('click', toggleMenu);
        navToggle.addEventListener('touchstart', toggleMenu, { passive: false });
        
        // Close menu when clicking on links - IMPORTANT: Don't prevent default for external links
        const navLinks = safeQuerySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Only close menu, don't prevent navigation
                if (navMenu.classList.contains('active')) {
                    navToggle.classList.remove('active');
                    navMenu.classList.remove('active');
                    document.body.classList.remove('menu-open');
                }
                // Let the link navigate normally
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
    }
    
    // Update current date
    updateCurrentDate();
}

function updateCurrentDate() {
    const dateElement = safeQuerySelector('.current-date');
    if (dateElement) {
        const now = new Date();
        const options = { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric'
        };
        dateElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

// ===== LITURGICAL CALENDAR =====
function initLiturgicalCalendar() {
    updateLiturgicalSeason();
    loadDailyReadings();
}

// ===== CATHOLIC API INTEGRATION =====
const CATHOLIC_API_BASE = 'https://api.catholiccalendar.org/v1';
const USCCB_API_BASE = 'https://bible.usccb.org/api';

async function loadDailyReadings() {
    try {
        showLoadingState();
        
        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        
        // Try to fetch from Catholic Calendar API first
        await fetchFromCatholicAPI(dateString);
        
    } catch (error) {
        console.error('Error loading daily readings:', error);
        loadFallbackReadings();
    }
}

async function fetchFromCatholicAPI(dateString) {
    try {
        // Fetch liturgical information
        const liturgicalResponse = await fetch(`${CATHOLIC_API_BASE}/calendar/${dateString}`);
        
        if (liturgicalResponse.ok) {
            const liturgicalData = await liturgicalResponse.json();
            updateLiturgicalInfo(liturgicalData);
        }
        
        // Fetch readings from USCCB API
        await fetchUSCCBReadings(dateString);
        
    } catch (error) {
        console.error('Catholic API error:', error);
        // Try alternative API or fallback
        await fetchAlternativeReadings(dateString);
    }
}

async function fetchUSCCBReadings(dateString) {
    try {
        // Format date for USCCB API (they use different format)
        const date = new Date(dateString);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        const usccbDate = `${month}/${day}/${year}`;
        
        const response = await fetch(`${USCCB_API_BASE}/readings/${usccbDate}`);
        
        if (response.ok) {
            const data = await response.json();
            updateReadingsFromUSCCB(data);
        } else {
            throw new Error('USCCB API not available');
        }
        
    } catch (error) {
        console.error('USCCB API error:', error);
        await fetchAlternativeReadings(dateString);
    }
}

async function fetchAlternativeReadings(dateString) {
    try {
        // Use Vatican News API or other Catholic sources
        const response = await fetch(`https://www.vaticannews.va/en/word-of-the-day.json`);
        
        if (response.ok) {
            const data = await response.json();
            updateReadingsFromVatican(data);
        } else {
            throw new Error('Alternative API not available');
        }
        
    } catch (error) {
        console.error('Alternative API error:', error);
        loadFallbackReadings();
    }
}

function updateLiturgicalInfo(liturgicalData) {
    // Update liturgical season
    const seasonElement = safeQuerySelector('#liturgical-season');
    const weekElement = safeQuerySelector('#liturgical-week');
    const dateElement = safeQuerySelector('#liturgical-date');
    const dayElement = safeQuerySelector('#liturgical-day');
    const colorIndicator = safeQuerySelector('#liturgical-color-indicator');
    const colorName = safeQuerySelector('#liturgical-color-name');
    const seasonIcon = safeQuerySelector('#season-icon');
    
    if (liturgicalData) {
        if (seasonElement) seasonElement.textContent = liturgicalData.season || 'Ordinary Time';
        if (weekElement) weekElement.textContent = liturgicalData.week || 'Week 1';
        if (colorIndicator) colorIndicator.style.backgroundColor = getLiturgicalColor(liturgicalData.color);
        if (colorName) colorName.textContent = liturgicalData.color || 'Green';
        
        // Update season icon
        if (seasonIcon) {
            seasonIcon.className = `fas ${getLiturgicalIcon(liturgicalData.season)}`;
        }
    }
    
    // Update date display
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
        dayElement.textContent = getLiturgicalRank(liturgicalData);
    }
    
    // Apply liturgical color theme to the page
    applyLiturgicalTheme(liturgicalData?.color || 'green');
}

function updateReadingsFromUSCCB(data) {
    if (data.readings) {
        // First Reading
        if (data.readings.first_reading) {
            updateReading('first', data.readings.first_reading);
        }
        
        // Responsorial Psalm
        if (data.readings.psalm) {
            updatePsalm(data.readings.psalm);
        }
        
        // Second Reading (if available)
        if (data.readings.second_reading) {
            updateReading('second', data.readings.second_reading);
        }
        
        // Gospel
        if (data.readings.gospel) {
            updateReading('gospel', data.readings.gospel);
        }
    }
    
    hideLoadingState();
}

function updateReadingsFromVatican(data) {
    // Parse Vatican News format and update readings
    // This would need to be adapted based on their actual API structure
    hideLoadingState();
}

function updateReading(type, readingData) {
    const referenceElement = safeQuerySelector(`#${type}-reading-reference`);
    const textElement = safeQuerySelector(`#${type}-reading-text`);
    
    if (referenceElement && readingData.reference) {
        referenceElement.textContent = readingData.reference;
    }
    
    if (textElement && readingData.text) {
        textElement.innerHTML = formatReadingText(readingData.text);
    }
}

function updatePsalm(psalmData) {
    const referenceElement = safeQuerySelector('#psalm-reference');
    const responseElement = safeQuerySelector('#psalm-response');
    const textElement = safeQuerySelector('#psalm-text');
    
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

function formatReadingText(text) {
    // Format the reading text with proper styling
    return text
        .replace(/\n\n/g, '</p><p>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>') // Italics
        .replace(/\+([^+]+)\+/g, '<strong>$1</strong>'); // Bold
}

function formatPsalmText(text) {
    // Format psalm with response indicators
    return text
        .replace(/R\./g, '<strong class="psalm-response-indicator">R.</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');
}

function getLiturgicalColor(colorName) {
    const colors = {
        'green': '#228B22',
        'purple': '#8B4B9B',
        'violet': '#8B4B9B',
        'red': '#DC143C',
        'white': '#F8F8FF',
        'gold': '#FFD700',
        'rose': '#FF69B4',
        'black': '#2C2C2C'
    };
    
    return colors[colorName?.toLowerCase()] || colors.green;
}

function getLiturgicalIcon(season) {
    const icons = {
        'advent': 'fa-star',
        'christmas': 'fa-baby',
        'ordinary': 'fa-leaf',
        'lent': 'fa-cross',
        'easter': 'fa-sun',
        'pentecost': 'fa-dove'
    };
    
    return icons[season?.toLowerCase()] || 'fa-leaf';
}

function getLiturgicalRank(liturgicalData) {
    if (liturgicalData?.rank) {
        return liturgicalData.rank;
    }
    
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    if (dayOfWeek === 0) return 'Sunday';
    if (dayOfWeek === 6) return 'Saturday';
    return 'Weekday';
}

function applyLiturgicalTheme(color) {
    const root = document.documentElement;
    const themeColor = getLiturgicalColor(color);
    
    // Update CSS custom properties for liturgical theming
    root.style.setProperty('--liturgical-primary', themeColor);
    root.style.setProperty('--liturgical-light', `${themeColor}20`);
    root.style.setProperty('--liturgical-dark', adjustBrightness(themeColor, -20));
    
    // Update body class for liturgical season
    document.body.className = document.body.className.replace(/liturgical-\w+/g, '');
    document.body.classList.add(`liturgical-${color.toLowerCase()}`);
}

function adjustBrightness(hex, percent) {
    // Convert hex to RGB, adjust brightness, convert back
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

function showLoadingState() {
    const loadingElements = [
        '#first-reading-text',
        '#psalm-text', 
        '#second-reading-text',
        '#gospel-text',
        '#daily-reflection'
    ];
    
    loadingElements.forEach(selector => {
        const element = safeQuerySelector(selector);
        if (element) {
            element.innerHTML = '<div class="loading-spinner"></div><p>Loading...</p>';
        }
    });
}

function hideLoadingState() {
    // Remove loading spinners
    const spinners = safeQuerySelectorAll('.loading-spinner');
    spinners.forEach(spinner => spinner.remove());
}

function loadFallbackReadings() {
    // Load default readings when API is not available
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Sample readings for different days
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
            gospel: {
                reference: "Matthew 13:1-23",
                text: "On that day, Jesus went out of the house and sat down by the sea. Such large crowds gathered around him that he got into a boat and sat down, and the whole crowd stood along the shore. And he spoke to them at length in parables, saying: 'A sower went out to sow...'"
            }
        },
        // Add more days as needed
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
                reference: "John 3:16",
                text: "For God so loved the world that he gave his only Son, so that everyone who believes in him might not perish but might have eternal life."
            }
        }
    };
    
    const readings = fallbackReadings[dayOfWeek] || fallbackReadings.default;
    
    // Update readings
    updateReading('first', readings.first);
    updatePsalm(readings.psalm);
    if (readings.second) updateReading('second', readings.second);
    updateReading('gospel', readings.gospel);
    
    // Load reflection
    loadDailyReflection();
    
    hideLoadingState();
    
    showNotification('Using offline readings. Check your internet connection for latest updates.', 'warning');
}

// ===== DAILY REFLECTION MANAGEMENT =====
async function loadDailyReflection() {
    try {
        // Try to load from local JSON file first
        const response = await fetch('api/daily-reflections.json');
        
        if (response.ok) {
            const data = await response.json();
            const today = new Date().toISOString().split('T')[0];
            
            // Look for today's reflection
            let reflection = data.reflections[today];
            
            // If no reflection for today, use default
            if (!reflection) {
                reflection = data.reflections.default;
            }
            
            updateReflection(reflection.reflection, reflection.author);
        } else {
            loadFallbackReflection();
        }
    } catch (error) {
        console.error('Error loading reflection:', error);
        loadFallbackReflection();
    }
}

function loadFallbackReflection() {
    const fallbackReflections = [
        "Today, let us remember that God's word is like rain that waters the earth. Just as the earth needs water to bear fruit, our souls need God's word to grow in faith and love. Take time today to reflect on how God's word is working in your life.",
        
        "In today's Gospel, Jesus teaches us through parables. These simple stories contain profound truths about the Kingdom of God. Let us ask ourselves: What kind of soil is my heart? Am I ready to receive God's word and let it bear fruit in my life?",
        
        "The Lord is our shepherd, and we shall not want. In times of difficulty and uncertainty, we can find comfort in knowing that God guides us beside restful waters and refreshes our souls. Trust in His providence today.",
        
        "God's love for us is so great that He gave His only Son for our salvation. This incredible gift reminds us that we are precious in God's eyes. How can we share this love with others today?",
        
        "Prayer is our lifeline to God. In the midst of our busy lives, let us not forget to spend time in conversation with our Creator. Even a few moments of prayer can transform our day and bring us peace."
    ];
    
    const today = new Date();
    const reflectionIndex = today.getDate() % fallbackReflections.length;
    const reflection = fallbackReflections[reflectionIndex];
    
    updateReflection(reflection);
}

function updateReflection(reflectionText, author = 'Parish Reflection') {
    const reflectionElement = safeQuerySelector('#daily-reflection');
    const authorElement = safeQuerySelector('.reflection-author span');
    
    if (reflectionElement) {
        reflectionElement.textContent = reflectionText;
    }
    
    if (authorElement) {
        authorElement.textContent = `— ${author}`;
    }
}

// ===== READING CONTROLS =====
function initReadingControls() {
    // Audio controls
    const audioButtons = safeQuerySelectorAll('.audio-btn');
    audioButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const readingType = this.getAttribute('data-reading');
            playReading(readingType);
        });
    });
    
    // Expand controls
    const expandButtons = safeQuerySelectorAll('.expand-btn');
    expandButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const readingType = this.getAttribute('data-reading');
            expandReading(readingType);
        });
    });
    
    // Action buttons
    initActionButtons();
}

function playReading(readingType) {
    const textElement = safeQuerySelector(`#${readingType}-reading-text, #${readingType}-text`);
    if (!textElement) return;
    
    const text = textElement.textContent;
    
    if ('speechSynthesis' in window) {
        // Stop any current speech
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        speechSynthesis.speak(utterance);
        
        showNotification(`Playing ${readingType} reading`, 'info');
    } else {
        showNotification('Text-to-speech not supported in your browser', 'error');
    }
}

function expandReading(readingType) {
    const readingCard = safeQuerySelector(`.${readingType}-reading, .${readingType}`);
    if (!readingCard) return;
    
    readingCard.classList.toggle('expanded');
    
    const expandBtn = readingCard.querySelector('.expand-btn i');
    if (expandBtn) {
        expandBtn.classList.toggle('fa-expand');
        expandBtn.classList.toggle('fa-compress');
    }
}

function initActionButtons() {
    // Read All Readings button
    const readAllBtn = safeQuerySelector('#read-all-btn');
    if (readAllBtn) {
        readAllBtn.addEventListener('click', readAllReadings);
    }
    
    // Download PDF button
    const downloadBtn = safeQuerySelector('#download-readings-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadReadingsPDF);
    }
    
    // Share Readings button
    const shareBtn = safeQuerySelector('#share-readings-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', shareReadings);
    }
}

function readAllReadings() {
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        
        const readings = [
            { type: 'first', element: '#first-reading-text' },
            { type: 'psalm', element: '#psalm-text' },
            { type: 'second', element: '#second-reading-text' },
            { type: 'gospel', element: '#gospel-text' }
        ];
        
        let currentIndex = 0;
        
        function readNext() {
            if (currentIndex < readings.length) {
                const reading = readings[currentIndex];
                const element = safeQuerySelector(reading.element);
                
                if (element && element.textContent.trim()) {
                    const utterance = new SpeechSynthesisUtterance(element.textContent);
                    utterance.rate = 0.8;
                    utterance.pitch = 1;
                    utterance.volume = 1;
                    
                    utterance.onend = () => {
                        currentIndex++;
                        setTimeout(readNext, 1000); // Pause between readings
                    };
                    
                    speechSynthesis.speak(utterance);
                    showNotification(`Reading ${reading.type} reading...`, 'info');
                } else {
                    currentIndex++;
                    readNext();
                }
            } else {
                showNotification('Finished reading all readings', 'success');
            }
        }
        
        readNext();
    } else {
        showNotification('Text-to-speech not supported in your browser', 'error');
    }
}

function downloadReadingsPDF() {
    // This would require a PDF generation library like jsPDF
    showNotification('PDF download feature coming soon!', 'info');
}

function shareReadings() {
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const shareText = `Daily Catholic Readings for ${today} - Our Lady Mother and Queen Catholic Church, Badore`;
    const shareUrl = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: shareText,
            url: shareUrl
        }).then(() => {
            showNotification('Readings shared successfully!', 'success');
        }).catch(() => {
            fallbackShare(shareText, shareUrl);
        });
    } else {
        fallbackShare(shareText, shareUrl);
    }
}

function fallbackShare(text, url) {
    // Copy to clipboard
    const shareContent = `${text}\n${url}`;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(shareContent).then(() => {
            showNotification('Link copied to clipboard!', 'success');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Link copied to clipboard!', 'success');
    }
}

function updateLiturgicalSeason() {
    const seasonElement = safeQuerySelector('.season-details h3');
    const seasonDescription = safeQuerySelector('.season-details p');
    const colorIndicator = safeQuerySelector('.color-indicator');
    const liturgicalColor = safeQuerySelector('.liturgical-color span');
    
    if (!seasonElement) return;
    
    const today = new Date();
    const season = getCurrentLiturgicalSeason(today);
    
    seasonElement.textContent = season.name;
    if (seasonDescription) seasonDescription.textContent = season.description;
    if (colorIndicator) colorIndicator.style.background = season.color;
    if (liturgicalColor) liturgicalColor.textContent = season.colorName;
}

function getCurrentLiturgicalSeason(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Simplified liturgical calendar logic
    if ((month === 12 && day >= 25) || (month === 1 && day <= 6)) {
        return {
            name: 'Christmas Season',
            description: 'Celebrating the birth of Jesus Christ',
            color: '#FFD700',
            colorName: 'Gold'
        };
    } else if (month >= 3 && month <= 5) {
        return {
            name: 'Lenten Season',
            description: 'A time of prayer, fasting, and almsgiving',
            color: '#8B4B9B',
            colorName: 'Purple'
        };
    } else if (month >= 6 && month <= 8) {
        return {
            name: 'Ordinary Time',
            description: 'Growing in faith and discipleship',
            color: '#228B22',
            colorName: 'Green'
        };
    } else {
        return {
            name: 'Ordinary Time',
            description: 'Growing in faith and discipleship',
            color: '#228B22',
            colorName: 'Green'
        };
    }
}

function loadDailyReadings() {
    // Simulate loading daily readings
    const readings = [
        {
            type: 'first-reading',
            title: 'First Reading',
            reference: 'Isaiah 55:10-11',
            text: 'For just as from the heavens the rain and snow come down and do not return there till they have watered the earth, making it fertile and fruitful, giving seed to the one who sows and bread to the one who eats, so shall my word be that goes forth from my mouth; my word shall not return to me void, but shall do my will, achieving the end for which I sent it.',
            fullText: 'Thus says the LORD: Just as from the heavens the rain and snow come down and do not return there till they have watered the earth, making it fertile and fruitful, giving seed to the one who sows and bread to the one who eats, so shall my word be that goes forth from my mouth; my word shall not return to me void, but shall do my will, achieving the end for which I sent it.'
        },
        {
            type: 'psalm',
            title: 'Responsorial Psalm',
            reference: 'Psalm 65:10-14',
            text: 'The seed that falls on good ground will yield a fruitful harvest.',
            fullText: 'You have visited the land and watered it; greatly have you enriched it. God\'s watercourses are filled; you have prepared the grain. Thus have you prepared the land: drenching its furrows, breaking up its clods, softening it with showers, blessing its yield.'
        },
        {
            type: 'second-reading',
            title: 'Second Reading',
            reference: 'Romans 8:18-23',
            text: 'I consider that the sufferings of this present time are as nothing compared with the glory to be revealed for us.',
            fullText: 'Brothers and sisters: I consider that the sufferings of this present time are as nothing compared with the glory to be revealed for us. For creation awaits with eager expectation the revelation of the children of God; for creation was made subject to futility, not of its own accord but because of the one who subjected it, in hope that creation itself would be set free from slavery to corruption and share in the glorious freedom of the children of God.'
        },
        {
            type: 'gospel',
            title: 'Gospel',
            reference: 'Matthew 13:1-23',
            text: 'A sower went out to sow. And as he sowed, some seed fell on the path...',
            fullText: 'On that day, Jesus went out of the house and sat down by the sea. Such large crowds gathered around him that he got into a boat and sat down, and the whole crowd stood along the shore. And he spoke to them at length in parables, saying: "A sower went out to sow. And as he sowed, some seed fell on the path, and birds came and ate it up. Some fell on rocky ground, where it had little soil. It sprang up at once because the soil was not deep, and when the sun rose it was scorched, and it withered for lack of roots."'
        }
    ];
    
    populateReadings(readings);
}

function populateReadings(readings) {
    readings.forEach(reading => {
        const card = safeQuerySelector(`.reading-card.${reading.type}`);
        if (card) {
            const titleElement = card.querySelector('.reading-title h3');
            const referenceElement = card.querySelector('.reading-reference');
            const textElement = card.querySelector('.reading-text');
            
            if (titleElement) titleElement.textContent = reading.title;
            if (referenceElement) referenceElement.textContent = reading.reference;
            if (textElement) textElement.textContent = reading.text;
            
            // Store full text for modal
            card.dataset.fullText = reading.fullText;
            card.dataset.reference = reading.reference;
            card.dataset.title = reading.title;
        }
    });
}

// ===== FAITH TOPICS FILTERING =====
function initFaithTopicsFilter() {
    const filterButtons = safeQuerySelectorAll('.filter-btn');
    const topicCards = safeQuerySelectorAll('.faith-topic-card');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            const filter = button.dataset.filter;
            
            topicCards.forEach(card => {
                const category = card.dataset.category;
                
                if (filter === 'all' || category === filter) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });
}

// ===== MODAL FUNCTIONALITY =====
function openModal(modalId) {
    const modal = safeQuerySelector(`#${modalId}`);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus trap
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }
}

function closeModal(modalId) {
    const modal = safeQuerySelector(`#${modalId}`);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function openReadingModal(readingCard) {
    const modal = safeQuerySelector('#reading-modal');
    if (!modal || !readingCard) return;
    
    const title = readingCard.dataset.title;
    const reference = readingCard.dataset.reference;
    const fullText = readingCard.dataset.fullText;
    
    const modalTitle = modal.querySelector('.modal-header h3');
    const modalSubtitle = modal.querySelector('.modal-subtitle');
    const modalContent = modal.querySelector('.reading-full-content');
    
    if (modalTitle) modalTitle.textContent = title;
    if (modalSubtitle) modalSubtitle.textContent = reference;
    if (modalContent) modalContent.textContent = fullText;
    
    openModal('reading-modal');
}

function openFaithModal(topicType) {
    const modal = safeQuerySelector('#faith-modal');
    if (!modal) return;
    
    const faithContent = getFaithContent(topicType);
    
    const modalTitle = modal.querySelector('.modal-header h3');
    const modalSubtitle = modal.querySelector('.modal-subtitle');
    const modalBody = modal.querySelector('.faith-content');
    
    if (modalTitle) modalTitle.textContent = faithContent.title;
    if (modalSubtitle) modalSubtitle.textContent = faithContent.subtitle;
    if (modalBody) modalBody.innerHTML = faithContent.content;
    
    openModal('faith-modal');
}

function getFaithContent(topicType) {
    const content = {
        trinity: {
            title: 'The Holy Trinity',
            subtitle: 'One God in Three Persons',
            content: `
                <div class="content-section">
                    <h4>Understanding the Trinity</h4>
                    <p>The Trinity is the central mystery of Christian faith and life. It is the mystery of God in himself. It is therefore the source of all the other mysteries of faith, the light that enlightens them.</p>
                    
                    <div class="scripture-quote">
                        <p>"Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit."</p>
                        <cite>Matthew 28:19</cite>
                    </div>
                    
                    <div class="trinity-persons">
                        <div class="person-card">
                            <div class="person-icon">
                                <i class="fas fa-crown"></i>
                            </div>
                            <h5>God the Father</h5>
                            <p>The first person of the Trinity, the Creator and source of all life.</p>
                        </div>
                                                <div class="person-card">
                            <div class="person-icon">
                                <i class="fas fa-cross"></i>
                            </div>
                            <h5>God the Son</h5>
                            <p>Jesus Christ, the second person of the Trinity, our Savior and Redeemer.</p>
                        </div>
                        <div class="person-card">
                            <div class="person-icon">
                                <i class="fas fa-dove"></i>
                            </div>
                            <h5>God the Holy Spirit</h5>
                            <p>The third person of the Trinity, our Advocate and Sanctifier.</p>
                        </div>
                    </div>
                </div>
                
                <div class="content-section">
                    <h4>The Mystery of Three in One</h4>
                    <p>The Trinity is One. We do not confess three Gods, but one God in three persons, the "consubstantial Trinity". The divine persons do not share the one divinity among themselves but each of them is God whole and entire.</p>
                    
                    <p>The divine persons are really distinct from one another. "God is one but not solitary." "Father", "Son", "Holy Spirit" are not simply names designating modalities of the divine being, for they are really distinct from one another.</p>
                </div>
            `
        },
        sacraments: {
            title: 'The Seven Sacraments',
            subtitle: 'Signs of God\'s Grace',
            content: `
                <div class="content-section">
                    <h4>What are Sacraments?</h4>
                    <p>The sacraments are efficacious signs of grace, instituted by Christ and entrusted to the Church, by which divine life is dispensed to us. The visible rites by which the sacraments are celebrated signify and make present the graces proper to each sacrament.</p>
                    
                    <div class="scripture-quote">
                        <p>"He took bread, and when he had given thanks, he broke it and gave it to them, saying, 'This is my body, which is given for you. Do this in remembrance of me.'"</p>
                        <cite>Luke 22:19</cite>
                    </div>
                </div>
                
                <div class="content-section">
                    <h4>The Seven Sacraments</h4>
                    <div class="sacraments-grid">
                        <div class="sacrament-item">
                            <div class="sacrament-icon">
                                <i class="fas fa-water"></i>
                            </div>
                            <h5>Baptism</h5>
                            <p>The gateway to life in the Spirit and the door to the other sacraments.</p>
                        </div>
                        <div class="sacrament-item">
                            <div class="sacrament-icon">
                                <i class="fas fa-hands"></i>
                            </div>
                            <h5>Confirmation</h5>
                            <p>Completes baptismal grace and strengthens us with the Holy Spirit.</p>
                        </div>
                        <div class="sacrament-item">
                            <div class="sacrament-icon">
                                <i class="fas fa-bread-slice"></i>
                            </div>
                            <h5>Eucharist</h5>
                            <p>The source and summit of Christian life, the Body and Blood of Christ.</p>
                        </div>
                        <div class="sacrament-item">
                            <div class="sacrament-icon">
                                <i class="fas fa-cross"></i>
                            </div>
                            <h5>Penance</h5>
                            <p>Reconciliation with God and the Church through confession.</p>
                        </div>
                        <div class="sacrament-item">
                            <div class="sacrament-icon">
                                <i class="fas fa-hand-holding-medical"></i>
                            </div>
                            <h5>Anointing of the Sick</h5>
                            <p>Spiritual and sometimes physical healing for the seriously ill.</p>
                        </div>
                        <div class="sacrament-item">
                            <div class="sacrament-icon">
                                <i class="fas fa-church"></i>
                            </div>
                            <h5>Holy Orders</h5>
                            <p>Ordination to serve as deacon, priest, or bishop.</p>
                        </div>
                        <div class="sacrament-item">
                            <div class="sacrament-icon">
                                <i class="fas fa-ring"></i>
                            </div>
                            <h5>Matrimony</h5>
                            <p>The covenant between a man and woman in Christ.</p>
                        </div>
                    </div>
                </div>
                
                <div class="content-section">
                    <h4>Categories of Sacraments</h4>
                    <div class="sacrament-categories">
                        <div class="category-card">
                            <h5>Sacraments of Initiation</h5>
                            <p>Baptism, Confirmation, and Eucharist - the foundation of Christian life.</p>
                        </div>
                        <div class="category-card">
                            <h5>Sacraments of Healing</h5>
                            <p>Penance and Anointing of the Sick - God's mercy and healing.</p>
                        </div>
                        <div class="category-card">
                            <h5>Sacraments of Service</h5>
                            <p>Holy Orders and Matrimony - service to communion and mission.</p>
                        </div>
                    </div>
                </div>
            `
        },
        prayer: {
            title: 'Catholic Prayer',
            subtitle: 'Conversation with God',
            content: `
                <div class="content-section">
                    <h4>What is Prayer?</h4>
                    <p>Prayer is the raising of one's mind and heart to God or the requesting of good things from God. It is a vital and personal relationship with the living and true God. Prayer is Christian insofar as it is communion with Christ and extends throughout the Church.</p>
                    
                    <div class="scripture-quote">
                        <p>"Ask and it will be given to you; seek and you will find; knock and the door will be opened to you."</p>
                        <cite>Matthew 7:7</cite>
                    </div>
                </div>
                
                <div class="content-section">
                    <h4>The Lord's Prayer</h4>
                    <p>Jesus taught us how to pray with the Our Father, the perfect prayer that contains all we need.</p>
                    
                    <div class="prayer-text">
                        <p>Our Father, who art in heaven,<br>
                        hallowed be thy name;<br>
                        thy kingdom come,<br>
                        thy will be done<br>
                        on earth as it is in heaven.<br>
                        Give us this day our daily bread,<br>
                        and forgive us our trespasses,<br>
                        as we forgive those who trespass against us;<br>
                        and lead us not into temptation,<br>
                        but deliver us from evil. Amen.</p>
                    </div>
                </div>
                
                <div class="content-section">
                    <h4>Types of Prayer</h4>
                    <div class="sacrament-categories">
                        <div class="category-card">
                            <h5>Adoration</h5>
                            <p>Acknowledging God as Creator and Savior, Lord and Master of everything.</p>
                        </div>
                        <div class="category-card">
                            <h5>Petition</h5>
                            <p>Asking God for what we need, beginning with forgiveness.</p>
                        </div>
                        <div class="category-card">
                            <h5>Intercession</h5>
                            <p>Praying on behalf of others, following Christ's example.</p>
                        </div>
                        <div class="category-card">
                            <h5>Thanksgiving</h5>
                            <p>Giving thanks to God for all His blessings and gifts.</p>
                        </div>
                        <div class="category-card">
                            <h5>Praise</h5>
                            <p>Glorifying God for who He is, not for what He has done.</p>
                        </div>
                    </div>
                </div>
            `
        },
        scripture: {
            title: 'Sacred Scripture',
            subtitle: 'The Word of God',
            content: `
                <div class="content-section">
                    <h4>What is Sacred Scripture?</h4>
                    <p>Sacred Scripture is the speech of God as it is put down in writing under the breath of the Holy Spirit. Sacred Tradition transmits in its entirety the Word of God which has been entrusted to the apostles by Christ the Lord and the Holy Spirit.</p>
                    
                    <div class="scripture-quote">
                        <p>"All Scripture is inspired by God and is useful for teaching, for refutation, for correction, and for training in righteousness."</p>
                        <cite>2 Timothy 3:16</cite>
                    </div>
                </div>
                
                <div class="content-section">
                    <h4>The Canon of Scripture</h4>
                    <p>The Catholic Bible contains 73 books: 46 in the Old Testament and 27 in the New Testament. These books were written under the inspiration of the Holy Spirit and are recognized by the Church as the authentic Word of God.</p>
                    
                    <div class="sacrament-categories">
                        <div class="category-card">
                            <h5>Old Testament</h5>
                            <p>46 books that prepare for the coming of Christ, including the Law, Prophets, and Writings.</p>
                        </div>
                        <div class="category-card">
                            <h5>New Testament</h5>
                            <p>27 books that reveal Christ and the early Church, including the Gospels and Epistles.</p>
                        </div>
                    </div>
                </div>
                
                <div class="content-section">
                    <h4>Reading Scripture</h4>
                    <p>The Church encourages all Catholics to read Scripture regularly. The Bible should be read with the guidance of the Church's teaching authority and in the context of Sacred Tradition.</p>
                </div>
            `
        }
    };
    
    return content[topicType] || {
        title: 'Faith Topic',
        subtitle: 'Learn about our Catholic faith',
        content: '<p>Content not available.</p>'
    };
}

// ===== AUDIO FUNCTIONALITY =====
function initAudioFeatures() {
    const audioButtons = safeQuerySelectorAll('.audio-btn');
    
    audioButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const readingCard = button.closest('.reading-card');
            const text = readingCard.querySelector('.reading-text').textContent;
            
            if ('speechSynthesis' in window) {
                // Stop any current speech
                speechSynthesis.cancel();
                
                // Create new utterance
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.8;
                utterance.pitch = 1;
                utterance.volume = 1;
                
                // Update button state
                button.innerHTML = '<i class="fas fa-stop"></i>';
                button.classList.add('playing');
                
                utterance.onend = () => {
                    button.innerHTML = '<i class="fas fa-volume-up"></i>';
                    button.classList.remove('playing');
                };
                
                utterance.onerror = () => {
                    button.innerHTML = '<i class="fas fa-volume-up"></i>';
                    button.classList.remove('playing');
                    showNotification('Audio playback failed', 'error');
                };
                
                speechSynthesis.speak(utterance);
            } else {
                showNotification('Audio not supported in this browser', 'warning');
            }
        });
    });
}

// ===== READING EXPANSION =====
function initReadingExpansion() {
    const expandButtons = safeQuerySelectorAll('.expand-btn');
    
    expandButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const readingCard = button.closest('.reading-card');
            const readingText = readingCard.querySelector('.reading-text');
            
            if (readingText.classList.contains('preview')) {
                // Expand
                readingText.classList.remove('preview');
                button.innerHTML = '<i class="fas fa-compress"></i>';
                button.title = 'Collapse';
            } else {
                // Collapse
                readingText.classList.add('preview');
                button.innerHTML = '<i class="fas fa-expand"></i>';
                button.title = 'Expand';
            }
        });
    });
}

// ===== LOAD MORE FUNCTIONALITY =====
function initLoadMore() {
    const loadMoreBtn = safeQuerySelector('.load-more-btn');
    
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            // Simulate loading more content
            const originalText = loadMoreBtn.innerHTML;
            loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Loading...</span>';
            loadMoreBtn.disabled = true;
            
            setTimeout(() => {
                // Add more faith topics (simulated)
                addMoreFaithTopics();
                
                // Reset button
                loadMoreBtn.innerHTML = originalText;
                loadMoreBtn.disabled = false;
                
                showNotification('More topics loaded successfully!', 'success');
            }, 2000);
        });
    }
}

function addMoreFaithTopics() {
    const topicsGrid = safeQuerySelector('.faith-topics-grid');
    if (!topicsGrid) return;
    
    const newTopics = [
        {
            category: 'doctrine',
            title: 'The Incarnation',
            description: 'Understanding how Jesus is both fully God and fully man.',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            readingTime: '8 min',
            difficulty: 'Intermediate'
        },
        {
            category: 'saints',
            title: 'Communion of Saints',
            description: 'The spiritual solidarity between the faithful on earth, in purgatory, and in heaven.',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            readingTime: '6 min',
            difficulty: 'Beginner'
        }
    ];
    
    newTopics.forEach(topic => {
        const topicCard = createTopicCard(topic);
        topicsGrid.appendChild(topicCard);
        
        // Animate in
                setTimeout(() => {
            topicCard.style.opacity = '1';
            topicCard.style.transform = 'translateY(0)';
        }, 100);
    });
}

function createTopicCard(topic) {
    const card = document.createElement('div');
    card.className = 'faith-topic-card';
    card.dataset.category = topic.category;
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.3s ease';
    
    card.innerHTML = `
        <div class="topic-image">
            <img src="${topic.image}" alt="${topic.title}" loading="lazy">
            <div class="topic-overlay">
                <div class="topic-badges">
                    <span class="difficulty-badge ${topic.difficulty.toLowerCase()}">${topic.difficulty}</span>
                    <span class="time-badge">
                        <i class="fas fa-clock"></i>
                        ${topic.readingTime}
                    </span>
                </div>
            </div>
        </div>
        <div class="topic-content">
            <h3>${topic.title}</h3>
            <p>${topic.description}</p>
            <button class="topic-btn" onclick="openFaithModal('${topic.category}')">
                <span>Learn More</span>
                <i class="fas fa-arrow-right"></i>
            </button>
        </div>
    `;
    
    return card;
}

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
            }
        });
    }, observerOptions);
    
    // Observe all elements with data-aos attribute
    const animatedElements = safeQuerySelectorAll('[data-aos]');
    animatedElements.forEach(el => observer.observe(el));
}

// ===== SMOOTH SCROLLING =====
function initSmoothScrolling() {
    const scrollLinks = safeQuerySelectorAll('a[href^="#"]');
    
    scrollLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href === '#') return;
            
            const target = safeQuerySelector(href);
            if (target) {
                e.preventDefault();
                const offsetTop = target.offsetTop - 80; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===== MODAL EVENT LISTENERS =====
function initModalEvents() {
    // Reading card click handlers
    const readingCards = safeQuerySelectorAll('.reading-card');
    readingCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't open modal if clicking on buttons
            if (e.target.closest('.reading-actions')) return;
            openReadingModal(card);
        });
    });
    
    // Faith topic card click handlers
    const topicCards = safeQuerySelectorAll('.faith-topic-card');
    topicCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't open modal if clicking on buttons
            if (e.target.closest('.topic-btn')) return;
            const category = card.dataset.category;
            openFaithModal(category);
        });
    });
    
    // Close modal when clicking outside
    const modals = safeQuerySelectorAll('.faith-modal, .reading-modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModal = safeQuerySelector('.faith-modal.active, .reading-modal.active');
            if (activeModal) {
                closeModal(activeModal.id);
            }
        }
    });
    
    // Modal control buttons
    const readingControls = safeQuerySelectorAll('.control-btn');
    readingControls.forEach(button => {
        button.addEventListener('click', (e) => {
            const action = button.dataset.action;
            const modal = button.closest('.reading-modal');
            const content = modal.querySelector('.reading-full-content');
            
            switch (action) {
                case 'read-aloud':
                    readAloud(content.textContent);
                    break;
                case 'bookmark':
                    bookmarkReading(modal);
                    break;
                case 'share':
                    shareReading(modal);
                    break;
                case 'print':
                    printReading(modal);
                    break;
            }
        });
    });
}

// ===== READING MODAL CONTROLS =====
function readAloud(text) {
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        speechSynthesis.speak(utterance);
        showNotification('Reading aloud started', 'info');
    } else {
        showNotification('Speech synthesis not supported', 'error');
    }
}

function bookmarkReading(modal) {
    const title = modal.querySelector('.modal-header h3').textContent;
    const reference = modal.querySelector('.modal-subtitle').textContent;
    
    // Store in localStorage
    const bookmarks = JSON.parse(localStorage.getItem('faithBookmarks') || '[]');
    const bookmark = {
        id: Date.now(),
        title,
        reference,
        date: new Date().toISOString()
    };
    
    bookmarks.push(bookmark);
    localStorage.setItem('faithBookmarks', JSON.stringify(bookmarks));
    
    showNotification('Reading bookmarked successfully!', 'success');
}

function shareReading(modal) {
    const title = modal.querySelector('.modal-header h3').textContent;
    const reference = modal.querySelector('.modal-subtitle').textContent;
    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: `${title} - ${reference}`,
            text: `Check out this reading from Our Lady Mother and Queen Catholic Church`,
            url: url
        }).then(() => {
            showNotification('Reading shared successfully!', 'success');
        }).catch(() => {
            fallbackShare(title, reference, url);
        });
    } else {
        fallbackShare(title, reference, url);
    }
}

function fallbackShare(title, reference, url) {
    const shareText = `${title} - ${reference}\n${url}`;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification('Link copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Unable to copy link', 'error');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareText;
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            showNotification('Link copied to clipboard!', 'success');
        } catch (err) {
            showNotification('Unable to copy link', 'error');
        }
        
        document.body.removeChild(textArea);
    }
}

function printReading(modal) {
    const title = modal.querySelector('.modal-header h3').textContent;
    const reference = modal.querySelector('.modal-subtitle').textContent;
    const content = modal.querySelector('.reading-full-content').textContent;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title} - ${reference}</title>
            <style>
                body { font-family: Georgia, serif; line-height: 1.6; margin: 40px; }
                h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
                h2 { color: #3498db; margin-top: 30px; }
                p { margin-bottom: 15px; }
                .header { text-align: center; margin-bottom: 40px; }
                .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #7f8c8d; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${title}</h1>
                <h2>${reference}</h2>
            </div>
            <div class="content">
                <p>${content}</p>
            </div>
            <div class="footer">
                <p>Our Lady Mother and Queen Catholic Church, Badore</p>
                <p>Printed on ${new Date().toLocaleDateString()}</p>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

// ===== NAVBAR SCROLL EFFECT =====
function initNavbarScroll() {
    const navbar = safeQuerySelector('.navbar');
    if (!navbar) return;
    
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Hide/show navbar on scroll
        if (currentScrollY > lastScrollY && currentScrollY > 200) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScrollY = currentScrollY;
    });
}

// ===== SEARCH FUNCTIONALITY =====
function initSearch() {
    const searchInput = safeQuerySelector('.search-input');
    const searchResults = safeQuerySelector('.search-results');
    
    if (searchInput) {
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                hideSearchResults();
                return;
            }
            
            searchTimeout = setTimeout(() => {
                performSearch(query);
            }, 300);
        });
        
        // Hide results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                hideSearchResults();
            }
        });
    }
}

function performSearch(query) {
    // Simulate search results
    const results = [
        {
            type: 'topic',
            title: 'The Holy Trinity',
            description: 'Understanding the three persons of God',
            url: '#trinity'
        },
        {
            type: 'reading',
            title: 'Gospel of Matthew',
            description: 'Today\'s Gospel reading',
            url: '#gospel'
        },
        {
            type: 'prayer',
            title: 'Our Father',
            description: 'The Lord\'s Prayer',
            url: '#prayer'
        }
    ].filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
    );
    
    displaySearchResults(results);
}

function displaySearchResults(results) {
    const searchResults = safeQuerySelector('.search-results');
    if (!searchResults) return;
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No results found</div>';
    } else {
        searchResults.innerHTML = results.map(result => `
            <div class="search-result-item" onclick="handleSearchResult('${result.url}')">
                <div class="result-type">${result.type}</div>
                <div class="result-title">${result.title}</div>
                <div class="result-description">${result.description}</div>
            </div>
        `).join('');
    }
    
    searchResults.style.display = 'block';
}

function hideSearchResults() {
    const searchResults = safeQuerySelector('.search-results');
    if (searchResults) {
        searchResults.style.display = 'none';
    }
}

function handleSearchResult(url) {
    hideSearchResults();
    
    if (url.startsWith('#')) {
        const target = safeQuerySelector(url);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    } else {
        window.location.href = url;
    }
}

// ===== ACCESSIBILITY ENHANCEMENTS =====
function initAccessibility() {
    // Skip to content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: #3498db;
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 10000;
        transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', () => {
        skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add main content ID if not present
    const heroSection = safeQuerySelector('.faith-hero');
    if (heroSection && !document.getElementById('main-content')) {
        heroSection.id = 'main-content';
    }
    
    // Improve button accessibility
    const buttons = safeQuerySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    buttons.forEach(button => {
        if (!button.textContent.trim()) {
            const icon = button.querySelector('i');
            if (icon) {
                const iconClass = icon.className;
                let label = 'Button';
                
                if (iconClass.includes('fa-volume-up')) label = 'Play audio';
                else if (iconClass.includes('fa-expand')) label = 'Expand text';
                else if (iconClass.includes('fa-bookmark')) label = 'Bookmark';
                else if (iconClass.includes('fa-share')) label = 'Share';
                                else if (iconClass.includes('fa-print')) label = 'Print';
                else if (iconClass.includes('fa-times')) label = 'Close';
                
                button.setAttribute('aria-label', label);
            }
        }
    });
    
    // Add ARIA labels to interactive elements
    const readingCards = safeQuerySelectorAll('.reading-card');
    readingCards.forEach((card, index) => {
        const title = card.querySelector('.reading-title h3')?.textContent || `Reading ${index + 1}`;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Open ${title} in modal`);
        card.setAttribute('tabindex', '0');
        
        // Add keyboard navigation
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openReadingModal(card);
            }
        });
    });
    
    // Add ARIA labels to faith topic cards
    const topicCards = safeQuerySelectorAll('.faith-topic-card');
    topicCards.forEach((card, index) => {
        const title = card.querySelector('h3')?.textContent || `Topic ${index + 1}`;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Learn about ${title}`);
        card.setAttribute('tabindex', '0');
        
        // Add keyboard navigation
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const category = card.dataset.category;
                openFaithModal(category);
            }
        });
    });
}

// ===== PERFORMANCE OPTIMIZATIONS =====
function initPerformanceOptimizations() {
    // Lazy load images
    const images = safeQuerySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
    
    // Debounce scroll events
    let scrollTimeout;
    const originalScrollHandler = window.onscroll;
    
    window.onscroll = function() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (originalScrollHandler) originalScrollHandler();
        }, 16); // ~60fps
    };
    
    // Preload critical resources
    preloadCriticalResources();
}

function preloadCriticalResources() {
    // Preload modal content
    const criticalModals = ['faith-modal', 'reading-modal'];
    criticalModals.forEach(modalId => {
        const modal = safeQuerySelector(`#${modalId}`);
        if (modal) {
            // Force browser to parse modal content
            modal.style.display = 'none';
            modal.style.display = '';
        }
    });
}

// ===== LOCAL STORAGE MANAGEMENT =====
function initLocalStorage() {
    // Load user preferences
    loadUserPreferences();
    
    // Save preferences on change
    document.addEventListener('change', saveUserPreferences);
}

function loadUserPreferences() {
    const preferences = JSON.parse(localStorage.getItem('faithPreferences') || '{}');
    
    // Apply saved filter
    if (preferences.activeFilter) {
        const filterBtn = safeQuerySelector(`[data-filter="${preferences.activeFilter}"]`);
        if (filterBtn) {
            filterBtn.click();
        }
    }
    
    // Apply saved reading preferences
    if (preferences.readingSpeed) {
        // Apply reading speed for text-to-speech
        window.speechRate = preferences.readingSpeed;
    }
}

function saveUserPreferences() {
    const preferences = {
        activeFilter: safeQuerySelector('.filter-btn.active')?.dataset.filter || 'all',
        readingSpeed: window.speechRate || 0.8,
        lastVisit: new Date().toISOString()
    };
    
    localStorage.setItem('faithPreferences', JSON.stringify(preferences));
}

// ===== BOOKMARKS MANAGEMENT =====
function initBookmarks() {
    loadBookmarks();
    
    // Add bookmark button to reading modals if not present
    const readingModals = safeQuerySelectorAll('.reading-modal');
    readingModals.forEach(modal => {
        const bookmarkBtn = modal.querySelector('[data-action="bookmark"]');
        if (bookmarkBtn) {
            updateBookmarkButton(bookmarkBtn, modal);
        }
    });
}

function loadBookmarks() {
    const bookmarks = JSON.parse(localStorage.getItem('faithBookmarks') || '[]');
    
    // Display bookmarks if there's a bookmarks section
    const bookmarksContainer = safeQuerySelector('.bookmarks-container');
    if (bookmarksContainer && bookmarks.length > 0) {
        displayBookmarks(bookmarks);
    }
}

function displayBookmarks(bookmarks) {
    const bookmarksContainer = safeQuerySelector('.bookmarks-container');
    if (!bookmarksContainer) return;
    
    bookmarksContainer.innerHTML = `
        <h4>Your Bookmarks</h4>
        <div class="bookmarks-list">
            ${bookmarks.map(bookmark => `
                <div class="bookmark-item" data-id="${bookmark.id}">
                    <div class="bookmark-content">
                        <h5>${bookmark.title}</h5>
                        <p>${bookmark.reference}</p>
                        <small>Saved on ${new Date(bookmark.date).toLocaleDateString()}</small>
                    </div>
                    <button class="remove-bookmark" onclick="removeBookmark(${bookmark.id})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

function removeBookmark(bookmarkId) {
    const bookmarks = JSON.parse(localStorage.getItem('faithBookmarks') || '[]');
    const updatedBookmarks = bookmarks.filter(bookmark => bookmark.id !== bookmarkId);
    
    localStorage.setItem('faithBookmarks', JSON.stringify(updatedBookmarks));
    
    // Remove from DOM
    const bookmarkElement = safeQuerySelector(`[data-id="${bookmarkId}"]`);
    if (bookmarkElement) {
        bookmarkElement.remove();
    }
    
    showNotification('Bookmark removed', 'info');
}

function updateBookmarkButton(button, modal) {
    const title = modal.querySelector('.modal-header h3')?.textContent;
    const bookmarks = JSON.parse(localStorage.getItem('faithBookmarks') || '[]');
    const isBookmarked = bookmarks.some(bookmark => bookmark.title === title);
    
    if (isBookmarked) {
        button.classList.add('bookmarked');
        button.innerHTML = '<i class="fas fa-bookmark"></i>';
        button.title = 'Remove bookmark';
    } else {
        button.classList.remove('bookmarked');
        button.innerHTML = '<i class="far fa-bookmark"></i>';
        button.title = 'Add bookmark';
    }
}

// ===== OFFLINE SUPPORT =====
function initOfflineSupport() {
    // Check if service worker is supported
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }
    
    // Handle online/offline status
    window.addEventListener('online', () => {
        showNotification('Connection restored', 'success');
        syncOfflineData();
    });
    
    window.addEventListener('offline', () => {
        showNotification('You are now offline. Some features may be limited.', 'warning');
    });
}

function syncOfflineData() {
    // Sync any offline data when connection is restored
    const offlineActions = JSON.parse(localStorage.getItem('offlineActions') || '[]');
    
    if (offlineActions.length > 0) {
        // Process offline actions
        offlineActions.forEach(action => {
            // Handle different types of offline actions
            console.log('Processing offline action:', action);
        });
        
        // Clear offline actions
        localStorage.removeItem('offlineActions');
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    try {
        initNavigation();
        initLiturgicalCalendar();
        initReadingControls(); // New function for reading controls
        initFaithTopicsFilter();
        initAudioFeatures();
        initReadingExpansion();
        initLoadMore();
        initAOS();
        initSmoothScrolling();
        initModalEvents();
        initNavbarScroll();
        initSearch();
        initAccessibility();
        initPerformanceOptimizations();
        initLocalStorage();
        initBookmarks();
        initOfflineSupport();
        
        console.log('Our Faith page initialized successfully');
    } catch (error) {
        console.error('Error initializing Our Faith page:', error);
        showNotification('Some features may not work properly. Please refresh the page.', 'error');
    }
});

// ===== GLOBAL FUNCTIONS (for HTML onclick handlers) =====
window.openModal = openModal;
window.closeModal = closeModal;
window.openReadingModal = openReadingModal;
window.openFaithModal = openFaithModal;
window.showNotification = showNotification;
window.removeBookmark = removeBookmark;
window.handleSearchResult = handleSearchResult;

// ===== ERROR HANDLING =====
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.error);
    showNotification('An error occurred. Please refresh the page and try again.', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled Promise Rejection:', e.reason);
    showNotification('An error occurred while loading content.', 'error');
});

// ===== ANALYTICS (if needed) =====
function trackEvent(eventName, eventData = {}) {
    // Track user interactions for analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, eventData);
    }
    
    // Or use other analytics services
    console.log('Event tracked:', eventName, eventData);
}

// Track important user interactions
document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-track]');
    if (target) {
        const eventName = target.dataset.track;
        const eventData = {
            element: target.tagName.toLowerCase(),
            text: target.textContent.trim().substring(0, 50)
        };
        trackEvent(eventName, eventData);
    }
});

// ===== THEME SUPPORT =====
function initThemeSupport() {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Listen for theme toggle if theme switcher exists
    const themeToggle = safeQuerySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Listen for system theme changes
    if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            }
        });
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    showNotification(`Switched to ${newTheme} theme`, 'info');
}

// Initialize theme support
initThemeSupport();

