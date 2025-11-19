// ===== AUTOMATED DAILY READINGS SYSTEM =====

class DailyReadingsManager {
    constructor() {
        this.apiEndpoints = [
            'https://universalis.com/cgi-bin/dailyread.pl',
            'https://bible.usccb.org/bible/readings',
            'https://www.vaticannews.va/en/word-of-the-day.html'
        ];
        this.fallbackReadings = this.getFallbackReadings();
        this.lastUpdateDate = null;
        this.updateInterval = null;
        this.timezone = 'Africa/Lagos';
        
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
            
            // Get current date in Nigerian timezone
            const today = this.getNigerianDate().toDateString();
            const lastUpdate = localStorage.getItem('lastReadingsUpdate');
            
            if (lastUpdate === today) {
                console.log('Readings already updated today, loading from cache...');
                this.loadCachedReadings();
                return;
            }

            // Always load current readings for today
            const readings = await this.fetchTodaysReadings();
            
            if (readings) {
                this.displayReadings(readings);
                this.cacheReadings(readings, today);
                console.log('Readings updated successfully');
                this.showUpdateNotification('Daily readings updated!');
            } else {
                console.log('Using current date readings');
                this.loadCurrentDateReadings();
            }
            
        } catch (error) {
            console.error('Error loading daily readings:', error);
            this.loadCurrentDateReadings();
        }
    }

    async fetchTodaysReadings() {
        const today = this.getNigerianDate();
        const dateStr = today.toISOString().split('T')[0];
        
        try {
            // Try Universalis API (most reliable for international use)
            const universalisUrl = `https://universalis.com/${dateStr}/jsonpmass.js`;
            const response = await fetch(universalisUrl);
            
            if (response.ok) {
                const text = await response.text();
                const jsonMatch = text.match(/jsonpmass\((.+)\);/);
                if (jsonMatch) {
                    const data = JSON.parse(jsonMatch[1]);
                    return this.parseUniversalisData(data);
                }
            }
        } catch (error) {
            console.warn('Universalis API failed:', error);
        }
        
        return null;
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

    parseUniversalisData(data) {
        try {
            return {
                first: {
                    reference: data.first_reading?.long_citation || 'First Reading',
                    text: data.first_reading?.text || 'Reading will be updated shortly.'
                },
                psalm: {
                    reference: data.psalm?.long_citation || 'Responsorial Psalm',
                    response: data.psalm?.antiphon || 'Lord, hear our prayer.',
                    text: data.psalm?.text || 'Psalm text will be updated shortly.'
                },
                second: data.second_reading ? {
                    reference: data.second_reading.long_citation || 'Second Reading',
                    text: data.second_reading.text || 'Second reading text will be updated shortly.'
                } : null,
                gospel: {
                    reference: data.gospel?.long_citation || 'Gospel',
                    text: data.gospel?.text || 'Gospel text will be updated shortly.'
                },
                liturgicalSeason: data.season || this.getCurrentLiturgicalSeason(),
                liturgicalColor: data.colour || this.getLiturgicalColor(),
                saint: data.saint || this.getSaintOfTheDay()
            };
        } catch (error) {
            console.error('Error parsing Universalis data:', error);
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
        
        // Update saint of the day
        const today = this.getNigerianDate();
        const saintInfo = this.getSaintInfo(today);
        this.updateElement('saint-of-day', saintInfo.name);
        this.updateElement('saint-quote', saintInfo.quote);
        this.updateElement('saint-details', saintInfo.details);
        this.updateElement('saint-date-header', `Saint of the Day - ${today.toLocaleDateString('en-US', {month: 'long', day: 'numeric'})}`);
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

    getNigerianDate() {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const nigerianTime = new Date(utc + (1 * 3600000)); // UTC+1 for Nigeria
        return nigerianTime;
    }
    
    loadCurrentDateReadings() {
        const today = this.getNigerianDate();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
        const readingIndex = dayOfYear % this.fallbackReadings.length;
        
        const readings = {
            ...this.fallbackReadings[readingIndex],
            saint: this.getSaintOfTheDay(today)
        };
        
        this.displayReadings(readings);
        console.log('Loaded current date readings');
    }
    
    getSaintInfo(date = null) {
        const today = date || this.getNigerianDate();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        
        const saints = {
            '11-19': {
                name: 'Saint Raphael Kalinowski, Priest',
                quote: '"The most important thing is to do God\'s will with love and trust."',
                details: '— Carmelite Priest and Martyr (1835-1907)'
            },
            '11-20': {
                name: 'Saint Edmund the Martyr',
                quote: '"Christ is my life, and death is my gain."',
                details: '— King and Martyr (841-869)'
            },
            '11-21': {
                name: 'The Presentation of the Blessed Virgin Mary',
                quote: '"Behold, I am the handmaid of the Lord; let it be done unto me according to your word."',
                details: '— Feast of Our Lady\'s Presentation in the Temple'
            },
            '11-22': {
                name: 'Saint Cecilia, Virgin and Martyr',
                quote: '"Let your heart keep singing to the Lord."',
                details: '— Patron Saint of Musicians (3rd Century)'
            },
            '11-23': {
                name: 'Saint Clement I, Pope and Martyr',
                quote: '"Let us fix our eyes on the blood of Christ and realize how precious it is."',
                details: '— Fourth Pope of Rome (35-99 AD)'
            },
            '11-24': {
                name: 'Saint Andrew Dũng-Lạc and Companions, Martyrs',
                quote: '"I die for God, and it is a glorious thing to die for God."',
                details: '— Vietnamese Martyrs (1795-1862)'
            },
            '11-25': {
                name: 'Saint Catherine of Alexandria, Virgin and Martyr',
                quote: '"I have given myself completely to Jesus Christ."',
                details: '— Patron of Philosophers and Students (287-305)'
            },
            '12-1': {
                name: 'Saint Edmund Campion, Priest and Martyr',
                quote: '"In condemning us, you condemn all your own ancestors."',
                details: '— English Jesuit Martyr (1540-1581)'
            }
        };
        
        const key = `${month}-${day}`;
        return saints[key] || {
            name: 'Saints of the Day',
            quote: '"Pray for us, all holy men and women of God."',
            details: '— All Saints and Martyrs'
        };
    }
    
    getSaintOfTheDay(date = null) {
        const saintInfo = this.getSaintInfo(date);
        return saintInfo.name;
    }

    getFallbackReadings() {
        const today = this.getNigerianDate ? this.getNigerianDate() : new Date();
        const isAdvent = today.getMonth() === 11 && today.getDate() < 25;
        
        return [
            {
                first: {
                    reference: isAdvent ? "Isaiah 2:1-5" : "Isaiah 55:10-11",
                    text: isAdvent ? "The word that Isaiah, son of Amoz, saw concerning Judah and Jerusalem. In days to come, the mountain of the LORD's house shall be established as the highest mountain and raised above the hills." : "Thus says the LORD: Just as from the heavens the rain and snow come down and do not return there till they have watered the earth, making it fertile and fruitful, giving seed to the one who sows and bread to the one who eats, so shall my word be that goes forth from my mouth; my word shall not return to me void, but shall do my will, achieving the end for which I sent it."
                },
                psalm: {
                    reference: isAdvent ? "Psalm 122:1-9" : "Psalm 65:10, 11, 12-13, 14",
                    response: isAdvent ? "Let us go rejoicing to the house of the Lord." : "The seed that falls on good ground will yield a fruitful harvest.",
                    text: isAdvent ? "I rejoiced because they said to me, 'We will go up to the house of the LORD.' And now we have set foot within your gates, O Jerusalem." : "You have visited the land and watered it; greatly have you enriched it. God's watercourses are filled; you have prepared the grain."
                },
                gospel: {
                    reference: isAdvent ? "Matthew 24:37-44" : "Matthew 13:1-23",
                    text: isAdvent ? "Jesus said to his disciples: 'As it was in the days of Noah, so it will be at the coming of the Son of Man. Stay awake! For you do not know on which day your Lord will come.'" : "On that day, Jesus went out of the house and sat down by the sea. Such large crowds gathered around him that he got into a boat and sat down, and the whole crowd stood along the shore. And he spoke to them at length in parables, saying: 'A sower went out to sow...'"
                },
                liturgicalSeason: isAdvent ? "Advent" : "Ordinary Time",
                liturgicalColor: isAdvent ? "Purple" : "Green",
                saint: this.getSaintOfTheDay ? this.getSaintOfTheDay(today) : "Saints of the Day"
            }
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
        // Update at midnight Nigerian time
        const now = this.getNigerianDate();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 1, 0, 0); // 12:01 AM Nigerian time
        
        const msUntilMidnight = tomorrow.getTime() - now.getTime();
        
        setTimeout(() => {
            this.loadDailyReadings();
            
            // Set up daily interval
            this.updateInterval = setInterval(() => {
                this.loadDailyReadings();
            }, 24 * 60 * 60 * 1000); // Every 24 hours
            
        }, msUntilMidnight);
        
        console.log(`Next automatic update scheduled for: ${tomorrow.toLocaleString()} (Nigerian time)`);
    }

    startPeriodicUpdates() {
        // Check for updates every hour in case of network issues
        setInterval(() => {
            const lastUpdate = localStorage.getItem('lastReadingsUpdate');
            const today = this.getNigerianDate().toDateString();
            
            if (lastUpdate !== today) {
                console.log('Detected new day, updating readings...');
                this.loadDailyReadings();
            }
        }, 60 * 60 * 1000); // Every hour
        
        // Also check when page becomes visible (user returns to tab)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                const lastUpdate = localStorage.getItem('lastReadingsUpdate');
                const today = this.getNigerianDate().toDateString();
                
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