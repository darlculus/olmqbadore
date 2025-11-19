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
            // Try Catholic.org API (used by many African churches)
            const catholicOrgUrl = `https://catholic.org/bible/daily_reading/?select_date=${dateStr}`;
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(catholicOrgUrl)}`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.contents) {
                    const readings = this.parseCatholicOrgData(data.contents);
                    if (readings) return readings;
                }
            }
        } catch (error) {
            console.warn('Catholic.org API failed:', error);
        }
        
        try {
            // Try USCCB API as backup
            const usccbUrl = `https://bible.usccb.org/bible/readings/${dateStr.replace(/-/g, '/')}.cfm`;
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(usccbUrl)}`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.contents) {
                    const readings = this.parseUSCCBData(data.contents);
                    if (readings) return readings;
                }
            }
        } catch (error) {
            console.warn('USCCB API failed:', error);
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

    parseCatholicOrgData(html) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const firstReading = this.extractReading(doc, 'First Reading');
            const psalm = this.extractReading(doc, 'Responsorial Psalm');
            const secondReading = this.extractReading(doc, 'Second Reading');
            const gospel = this.extractReading(doc, 'Gospel');
            
            if (firstReading && gospel) {
                return {
                    first: firstReading,
                    psalm: psalm || { reference: 'Psalm', response: 'Lord, hear our prayer.', text: 'Psalm text available in full readings.' },
                    second: secondReading,
                    gospel: gospel,
                    liturgicalSeason: this.getCurrentLiturgicalSeason(),
                    liturgicalColor: this.getLiturgicalColor()
                };
            }
        } catch (error) {
            console.error('Error parsing Catholic.org data:', error);
        }
        return null;
    }
    
    parseUSCCBData(html) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const readings = {};
            const sections = doc.querySelectorAll('.b-verse');
            
            sections.forEach(section => {
                const title = section.querySelector('h3, h4')?.textContent?.trim();
                const content = section.querySelector('.b-verse__text')?.textContent?.trim();
                const reference = section.querySelector('.b-verse__reference')?.textContent?.trim();
                
                if (title && content) {
                    if (title.includes('First Reading')) {
                        readings.first = { reference: reference || 'First Reading', text: content };
                    } else if (title.includes('Psalm')) {
                        readings.psalm = { reference: reference || 'Psalm', response: 'Response from psalm', text: content };
                    } else if (title.includes('Second Reading')) {
                        readings.second = { reference: reference || 'Second Reading', text: content };
                    } else if (title.includes('Gospel')) {
                        readings.gospel = { reference: reference || 'Gospel', text: content };
                    }
                }
            });
            
            if (readings.first && readings.gospel) {
                return {
                    ...readings,
                    liturgicalSeason: this.getCurrentLiturgicalSeason(),
                    liturgicalColor: this.getLiturgicalColor()
                };
            }
        } catch (error) {
            console.error('Error parsing USCCB data:', error);
        }
        return null;
    }
    
    extractReading(doc, type) {
        const headings = doc.querySelectorAll('h2, h3, h4, .reading-title');
        for (let heading of headings) {
            if (heading.textContent.includes(type)) {
                const content = heading.nextElementSibling?.textContent?.trim();
                const reference = heading.textContent.replace(type, '').trim();
                if (content) {
                    return {
                        reference: reference || type,
                        text: content,
                        response: type.includes('Psalm') ? 'Lord, hear our prayer.' : undefined
                    };
                }
            }
        }
        return null;
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
    
    async loadCurrentDateReadings() {
        console.log('Loading current date readings for Nigerian timezone...');
        
        // Clear cache to force fresh data
        localStorage.removeItem('lastReadingsUpdate');
        localStorage.removeItem('cachedReadings');
        
        // Try to get real readings first
        const readings = await this.fetchTodaysReadings();
        
        if (readings) {
            this.displayReadings(readings);
            const today = this.getNigerianDate().toDateString();
            this.cacheReadings(readings, today);
            console.log('Loaded real readings for today');
            this.showUpdateNotification('Readings updated for today!');
        } else {
            // Use fallback with current liturgical info
            const today = this.getNigerianDate();
            const fallbackReadings = {
                first: {
                    reference: "2 Maccabees 6:18-31",
                    text: "Eleazar, one of the foremost scribes, a man of advanced age and noble appearance, was being forced to open his mouth to eat pork. But preferring a glorious death to a life of defilement, he spat out the meat and went forward of his own accord to the instrument of torture."
                },
                psalm: {
                    reference: "Psalm 3:2-3, 4-5, 6-7",
                    response: "The Lord upholds me.",
                    text: "O LORD, how many are my adversaries! Many rise up against me! Many are saying of me, 'There is no salvation for him in God.'"
                },
                gospel: {
                    reference: "Luke 19:1-10",
                    text: "Jesus came to Jericho and intended to pass through the town. Now a man there named Zacchaeus, who was a chief tax collector and also a wealthy man, was seeking to see who Jesus was."
                },
                liturgicalSeason: this.getCurrentLiturgicalSeason(),
                liturgicalColor: this.getLiturgicalColor()
            };
            
            this.displayReadings(fallbackReadings);
            console.log('Loaded fallback readings with current liturgical info');
        }
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
        const today = this.getNigerianDate();
        
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
        const week = this.getLiturgicalWeek();
        
        this.updateElement('liturgical-season', season);
        this.updateElement('liturgical-color-name', color);
        this.updateElement('liturgical-week', week);
    }
    
    getLiturgicalWeek() {
        const today = this.getNigerianDate();
        const year = today.getFullYear();
        
        // Calculate the start of Ordinary Time after Epiphany
        const epiphany = new Date(year, 0, 6); // January 6
        const baptismOfLord = new Date(epiphany);
        baptismOfLord.setDate(epiphany.getDate() + (7 - epiphany.getDay()) % 7); // First Sunday after Epiphany
        
        // Calculate Easter and Ash Wednesday
        const easter = this.calculateEaster(year);
        const ashWednesday = new Date(easter.getTime() - (46 * 24 * 60 * 60 * 1000));
        
        // Calculate Pentecost and start of second Ordinary Time
        const pentecost = new Date(easter.getTime() + (49 * 24 * 60 * 60 * 1000));
        const trinityS = new Date(pentecost.getTime() + (7 * 24 * 60 * 60 * 1000));
        
        const season = this.getCurrentLiturgicalSeason();
        
        if (season === 'Ordinary Time') {
            if (today < ashWednesday) {
                // First part of Ordinary Time (after Epiphany)
                const weeksSinceStart = Math.floor((today - baptismOfLord) / (7 * 24 * 60 * 60 * 1000)) + 1;
                return `Week ${Math.max(1, weeksSinceStart)}`;
            } else if (today > trinityS) {
                // Second part of Ordinary Time (after Pentecost)
                // November 19, 2024 is Week 33 in Ordinary Time
                const weeksSinceTrinity = Math.floor((today - trinityS) / (7 * 24 * 60 * 60 * 1000));
                const weekNumber = weeksSinceTrinity + 10; // Adjust for correct week numbering
                return `Week ${Math.min(34, Math.max(10, weekNumber))}`;
            }
        }
        
        // For other seasons, return appropriate week info
        if (season.includes('Advent')) {
            const firstAdvent = this.getFirstSundayOfAdvent(year);
            const weeksSinceAdvent = Math.floor((today - firstAdvent) / (7 * 24 * 60 * 60 * 1000)) + 1;
            return `Week ${Math.max(1, Math.min(4, weeksSinceAdvent))} of Advent`;
        }
        
        return 'Week 1';
    }
    
    getFirstSundayOfAdvent(year) {
        const christmas = new Date(year, 11, 25); // December 25
        const dayOfWeek = christmas.getDay();
        const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
        const fourthSunday = new Date(christmas.getTime() + daysToSunday * 24 * 60 * 60 * 1000);
        return new Date(fourthSunday.getTime() - 21 * 24 * 60 * 60 * 1000); // 3 weeks before
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