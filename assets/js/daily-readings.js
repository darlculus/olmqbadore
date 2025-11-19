// ===== AUTOMATED DAILY READINGS SYSTEM =====

class DailyReadingsManager {
    constructor() {
        this.apiEndpoints = [
            'https://api.usccb.org/bible/readings',
            'https://universalis.com/api/readings',
            'https://catholic-api.org/readings'
        ];
        this.fallbackReadings = this.getFallbackReadings();
        this.lastUpdateDate = null;
        this.updateInterval = null;
        
        this.init();
    }

    init() {
        console.log('Initializing Daily Readings Manager...');
        
        // Load readings immediately
        this.loadDailyReadings();
        
        // Set up automatic updates
        this.setupAutoUpdate();
        
        // Update liturgical information
        this.updateLiturgicalInfo();
        
        // Set up periodic checks
        this.startPeriodicUpdates();
    }

    async loadDailyReadings() {
        try {
            console.log('Loading daily readings...');
            
            // Check if we need to update (new day)
            const today = new Date().toDateString();
            const lastUpdate = localStorage.getItem('lastReadingsUpdate');
            
            if (lastUpdate === today) {
                console.log('Readings already updated today, loading from cache...');
                this.loadCachedReadings();
                return;
            }

            // Try to fetch from APIs
            const readings = await this.fetchReadingsFromAPI();
            
            if (readings) {
                this.displayReadings(readings);
                this.cacheReadings(readings, today);
                console.log('Readings updated successfully from API');
            } else {
                console.log('API failed, using fallback readings');
                this.loadFallbackReadings();
            }
            
        } catch (error) {
            console.error('Error loading daily readings:', error);
            this.loadFallbackReadings();
        }
    }

    async fetchReadingsFromAPI() {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Try multiple API endpoints
        for (const endpoint of this.apiEndpoints) {
            try {
                console.log(`Trying API: ${endpoint}`);
                
                // Construct API URL with date
                const apiUrl = `${endpoint}/${dateStr}`;
                
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000 // 10 second timeout
                });

                if (response.ok) {
                    const data = await response.json();
                    const readings = this.parseAPIResponse(data);
                    
                    if (readings && readings.first && readings.gospel) {
                        console.log('Successfully fetched readings from API');
                        return readings;
                    }
                }
            } catch (error) {
                console.warn(`API ${endpoint} failed:`, error.message);
                continue;
            }
        }
        
        // If all APIs fail, try alternative approach
        return await this.fetchFromAlternativeSource();
    }

    async fetchFromAlternativeSource() {
        try {
            // Try to scrape from USCCB website as fallback
            const proxyUrl = 'https://api.allorigins.win/get?url=';
            const targetUrl = encodeURIComponent('https://bible.usccb.org/bible/readings');
            
            const response = await fetch(proxyUrl + targetUrl);
            const data = await response.json();
            
            if (data.contents) {
                return this.parseUSCCBContent(data.contents);
            }
        } catch (error) {
            console.warn('Alternative source failed:', error);
        }
        
        return null;
    }

    parseAPIResponse(data) {
        try {
            // Handle different API response formats
            if (data.readings) {
                return this.formatReadings(data.readings);
            } else if (data.first_reading || data.gospel) {
                return this.formatReadings(data);
            } else if (Array.isArray(data) && data.length > 0) {
                return this.formatReadings(data[0]);
            }
            
            return null;
        } catch (error) {
            console.error('Error parsing API response:', error);
            return null;
        }
    }

    formatReadings(rawData) {
        return {
            first: {
                reference: rawData.first_reading?.citation || rawData.firstReading?.reference || 'Reading Reference',
                text: rawData.first_reading?.content || rawData.firstReading?.text || 'Reading text will be updated shortly.'
            },
            psalm: {
                reference: rawData.psalm?.citation || rawData.responsorialPsalm?.reference || 'Psalm Reference',
                response: rawData.psalm?.response || rawData.responsorialPsalm?.response || 'Psalm response',
                text: rawData.psalm?.content || rawData.responsorialPsalm?.text || 'Psalm text will be updated shortly.'
            },
            second: rawData.second_reading ? {
                reference: rawData.second_reading.citation || 'Second Reading Reference',
                text: rawData.second_reading.content || 'Second reading text will be updated shortly.'
            } : null,
            gospel: {
                reference: rawData.gospel?.citation || rawData.gospel?.reference || 'Gospel Reference',
                text: rawData.gospel?.content || rawData.gospel?.text || 'Gospel text will be updated shortly.'
            },
            liturgicalSeason: rawData.liturgical_season || this.getCurrentLiturgicalSeason(),
            liturgicalColor: rawData.liturgical_color || this.getLiturgicalColor()
        };
    }

    displayReadings(readings) {
        // Update first reading
        this.updateElement('first-reading-reference', readings.first.reference);
        this.updateElement('first-reading-text', readings.first.text);
        
        // Update psalm
        this.updateElement('psalm-reference', readings.psalm.reference);
        this.updateElement('psalm-response', readings.psalm.response);
        this.updateElement('psalm-text', readings.psalm.text);
        
        // Update second reading if exists
        if (readings.second) {
            this.updateElement('second-reading-reference', readings.second.reference);
            this.updateElement('second-reading-text', readings.second.text);
            this.showElement('second-reading-section');
        } else {
            this.hideElement('second-reading-section');
        }
        
        // Update gospel
        this.updateElement('gospel-reference', readings.gospel.reference);
        this.updateElement('gospel-text', readings.gospel.text);
        
        // Update liturgical information
        this.updateElement('liturgical-season', readings.liturgicalSeason);
        this.updateElement('liturgical-color', readings.liturgicalColor);
        
        // Show success notification
        this.showUpdateNotification('Readings updated successfully!');
    }

    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element && content) {
            element.textContent = content;
        }
    }

    showElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'block';
        }
    }

    hideElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    }

    cacheReadings(readings, date) {
        try {
            localStorage.setItem('cachedReadings', JSON.stringify(readings));
            localStorage.setItem('lastReadingsUpdate', date);
        } catch (error) {
            console.warn('Failed to cache readings:', error);
        }
    }

    loadCachedReadings() {
        try {
            const cached = localStorage.getItem('cachedReadings');
            if (cached) {
                const readings = JSON.parse(cached);
                this.displayReadings(readings);
                console.log('Loaded readings from cache');
                return true;
            }
        } catch (error) {
            console.warn('Failed to load cached readings:', error);
        }
        return false;
    }

    loadFallbackReadings() {
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
        const readingIndex = dayOfYear % this.fallbackReadings.length;
        
        const readings = this.fallbackReadings[readingIndex];
        this.displayReadings(readings);
        
        console.log('Loaded fallback readings');
        this.showUpdateNotification('Using offline readings. Will update when connection is restored.');
    }

    getFallbackReadings() {
        return [
            {
                first: {
                    reference: "Isaiah 55:10-11",
                    text: "Thus says the LORD: Just as from the heavens the rain and snow come down and do not return there till they have watered the earth, making it fertile and fruitful, giving seed to the one who sows and bread to the one who eats, so shall my word be that goes forth from my mouth; my word shall not return to me void, but shall do my will, achieving the end for which I sent it."
                },
                psalm: {
                    reference: "Psalm 65:10, 11, 12-13, 14",
                    response: "The seed that falls on good ground will yield a fruitful harvest.",
                    text: "You have visited the land and watered it; greatly have you enriched it. God's watercourses are filled; you have prepared the grain."
                },
                gospel: {
                    reference: "Matthew 13:1-23",
                    text: "On that day, Jesus went out of the house and sat down by the sea. Such large crowds gathered around him that he got into a boat and sat down, and the whole crowd stood along the shore. And he spoke to them at length in parables, saying: 'A sower went out to sow...'"
                },
                liturgicalSeason: "Ordinary Time",
                liturgicalColor: "Green"
            },
            {
                first: {
                    reference: "Romans 8:28-30",
                    text: "We know that all things work for good for those who love God, who are called according to his purpose. For those he foreknew he also predestined to be conformed to the image of his Son, so that he might be the firstborn among many brothers and sisters."
                },
                psalm: {
                    reference: "Psalm 13:4, 5, 6",
                    response: "My heart shall rejoice in your salvation.",
                    text: "Look, answer me, O LORD, my God! Give light to my eyes that I may not sleep in death lest my enemy say, 'I have overcome him.'"
                },
                gospel: {
                    reference: "Matthew 13:44-52",
                    text: "Jesus said to his disciples: 'The kingdom of heaven is like a treasure buried in a field, which a person finds and hides again, and out of joy goes and sells all that he has and buys that field.'"
                },
                liturgicalSeason: "Ordinary Time",
                liturgicalColor: "Green"
            }
            // Add more fallback readings as needed
        ];
    }

    getCurrentLiturgicalSeason() {
        const today = new Date();
        const year = today.getFullYear();
        
        // Calculate Easter date
        const easter = this.calculateEaster(year);
        
        // Calculate other liturgical dates
        const advent = new Date(year, 11, 1); // December 1st (approximate)
        const christmas = new Date(year, 11, 25);
        const epiphany = new Date(year + 1, 0, 6);
        const ashWednesday = new Date(easter.getTime() - (46 * 24 * 60 * 60 * 1000));
        const palmSunday = new Date(easter.getTime() - (7 * 24 * 60 * 60 * 1000));
        const pentecost = new Date(easter.getTime() + (49 * 24 * 60 * 60 * 1000));
        
        // Determine current season
        if (today >= advent || today <= epiphany) {
            return "Advent/Christmas";
        } else if (today >= ashWednesday && today < easter) {
            return "Lent";
        } else if (today >= palmSunday && today < easter) {
            return "Holy Week";
        } else if (today >= easter && today <= pentecost) {
            return "Easter";
        } else {
            return "Ordinary Time";
        }
    }

    getLiturgicalColor() {
        const season = this.getCurrentLiturgicalSeason();
        
        switch (season) {
            case "Advent":
                return "Purple";
            case "Christmas":
                return "White";
            case "Lent":
                return "Purple";
            case "Holy Week":
                return "Red";
            case "Easter":
                return "White";
            default:
                return "Green";
        }
    }

    calculateEaster(year) {
        // Algorithm to calculate Easter date
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        
        return new Date(year, month - 1, day);
    }

    updateLiturgicalInfo() {
        const today = new Date();
        
        // Update liturgical date
        const liturgicalDate = document.getElementById('liturgical-date');
        if (liturgicalDate) {
            liturgicalDate.textContent = today.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        // Update liturgical season and color
        const season = this.getCurrentLiturgicalSeason();
        const color = this.getLiturgicalColor();
        
        this.updateElement('liturgical-season', season);
        this.updateElement('liturgical-color', color);
    }

    setupAutoUpdate() {
        // Update at midnight every day
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 1, 0, 0); // 12:01 AM
        
        const msUntilMidnight = tomorrow.getTime() - now.getTime();
        
        setTimeout(() => {
            this.loadDailyReadings();
            
            // Set up daily interval
            this.updateInterval = setInterval(() => {
                this.loadDailyReadings();
            }, 24 * 60 * 60 * 1000); // Every 24 hours
            
        }, msUntilMidnight);
        
        console.log(`Next automatic update scheduled for: ${tomorrow.toLocaleString()}`);
    }

    startPeriodicUpdates() {
        // Check for updates every hour in case of network issues
        setInterval(() => {
            const lastUpdate = localStorage.getItem('lastReadingsUpdate');
            const today = new Date().toDateString();
            
            if (lastUpdate !== today) {
                console.log('Detected new day, updating readings...');
                this.loadDailyReadings();
            }
        }, 60 * 60 * 1000); // Every hour
        
        // Also check when page becomes visible (user returns to tab)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                const lastUpdate = localStorage.getItem('lastReadingsUpdate');
                const today = new Date().toDateString();
                
                if (lastUpdate !== today) {
                    this.loadDailyReadings();
                }
            }
        });
    }

    showUpdateNotification(message) {
        // Use existing notification system if available
        if (window.OLMQChurch && window.OLMQChurch.showNotification) {
            window.OLMQChurch.showNotification(message, 'success');
        } else {
            console.log('Readings Update:', message);
        }
    }

    // Manual refresh method for testing
    forceUpdate() {
        localStorage.removeItem('lastReadingsUpdate');
        localStorage.removeItem('cachedReadings');
        this.loadDailyReadings();
    }

    // Get status information
    getStatus() {
        const lastUpdate = localStorage.getItem('lastReadingsUpdate');
        const today = new Date().toDateString();
        
        return {
            lastUpdate: lastUpdate,
            isUpToDate: lastUpdate === today,
            nextUpdate: this.getNextUpdateTime(),
            liturgicalSeason: this.getCurrentLiturgicalSeason(),
            liturgicalColor: this.getLiturgicalColor()
        };
    }

    getNextUpdateTime() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 1, 0, 0);
        return tomorrow;
    }
}

// Initialize the Daily Readings Manager
let dailyReadingsManager;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        dailyReadingsManager = new DailyReadingsManager();
    });
} else {
    dailyReadingsManager = new DailyReadingsManager();
}

// Export for global use
window.DailyReadingsManager = DailyReadingsManager;

// Add manual refresh button functionality
document.addEventListener('DOMContentLoaded', () => {
    // Add refresh button to readings section
    const readingsSection = document.querySelector('.daily-readings');
    if (readingsSection && !document.getElementById('refresh-readings-btn')) {
        const refreshBtn = document.createElement('button');
        refreshBtn.id = 'refresh-readings-btn';
        refreshBtn.className = 'btn btn-secondary';
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Readings';
        refreshBtn.style.cssText = 'margin: 10px 0; font-size: 0.9rem;';
        
        refreshBtn.addEventListener('click', () => {
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            refreshBtn.disabled = true;
            
            if (dailyReadingsManager) {
                dailyReadingsManager.forceUpdate();
            }
            
            setTimeout(() => {
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Readings';
                refreshBtn.disabled = false;
            }, 2000);
        });
        
        const readingsHeader = readingsSection.querySelector('h3');
        if (readingsHeader) {
            readingsHeader.parentNode.insertBefore(refreshBtn, readingsHeader.nextSibling);
        }
    }
});

console.log('Daily Readings Manager loaded successfully!');