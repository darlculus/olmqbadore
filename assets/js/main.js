// ===== OLMQ CHURCH WEBSITE - MAIN JAVASCRIPT =====

// ===== ERROR HANDLING =====
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.error);
    // Don't let errors break the page
    return true;
});

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
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Add styles if not present
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                padding: 15px;
                z-index: 10000;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                max-width: 300px;
                border-left: 4px solid #3498db;
            }
            .notification.show { transform: translateX(0); }
            .notification.success { border-left-color: #27ae60; }
            .notification.error { border-left-color: #e74c3c; }
            .notification-content { display: flex; align-items: center; gap: 10px; }
            .notification-close { position: absolute; top: 5px; right: 10px; background: none; border: none; font-size: 18px; cursor: pointer; color: #666; }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => hideNotification(notification), 5000);
    
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => hideNotification(notification));
    }
}

function hideNotification(notification) {
    if (notification && notification.parentNode) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// ===== LOADING SCREEN =====
function initLoadingScreen() {
    const loadingScreen = safeQuerySelector('#loading-screen');
    if (!loadingScreen) return;
    
    // Ensure page is accessible even if loading screen fails
    const hideLoading = () => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 500);
    };
    
    // Hide after 2 seconds
    setTimeout(hideLoading, 2000);
    
    // Fallback - force hide after 5 seconds
    setTimeout(() => {
        if (loadingScreen.style.display !== 'none') {
            loadingScreen.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }, 5000);
}

// ===== NAVIGATION =====
function initNavigation() {
    const navToggle = safeQuerySelector('#hamburger');
    const navMenu = safeQuerySelector('#nav-menu');
    const navLinks = safeQuerySelectorAll('.nav-link');
    const navbar = safeQuerySelector('#navbar');

    // Mobile menu toggle with improved event handling
    if (navToggle && navMenu) {
        // Handle both click and touch events for better mobile support
        const toggleMenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isActive = navMenu.classList.contains('active');
            
            if (isActive) {
                closeMenu();
            } else {
                openMenu();
            }
        };
        
        const openMenu = () => {
            navMenu.classList.add('active');
            navToggle.classList.add('active');
            document.body.classList.add('menu-open');
            
            // Store current scroll position
            const scrollY = window.scrollY;
            document.body.style.top = `-${scrollY}px`;
        };
        
        const closeMenu = () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
            document.body.classList.remove('menu-open');
            
            // Restore scroll position
            const scrollY = document.body.style.top;
            document.body.style.top = '';
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        };
        
        navToggle.addEventListener('click', toggleMenu);
        navToggle.addEventListener('touchstart', toggleMenu, { passive: false });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                closeMenu();
            }
        });
        
        // Store functions for use in other parts
        window.OLMQNavigation = { openMenu, closeMenu };
    }

    // Close mobile menu when clicking links
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.OLMQNavigation && window.OLMQNavigation.closeMenu) {
                window.OLMQNavigation.closeMenu();
            } else {
                if (navMenu) navMenu.classList.remove('active');
                if (navToggle) navToggle.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
    });

    // Navbar scroll effect
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(255, 255, 255, 0.98)';
                navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            }
        });
    }

    // Active link highlighting
    window.addEventListener('scroll', () => {
        let current = '';
        const sections = safeQuerySelectorAll('section[id]');
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// ===== DATE DISPLAY =====
function initDateDisplay() {
    const dateDisplay = safeQuerySelector('.current-date');
    if (!dateDisplay) return;
    
    const updateDate = () => {
        const now = new Date();
        const options = { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        };
        dateDisplay.textContent = now.toLocaleDateString('en-US', options);
    };
    
    updateDate();
    setInterval(updateDate, 60000); // Update every minute
}

// ===== HERO CAROUSEL =====
function initHeroCarousel() {
    const slides = safeQuerySelectorAll('.carousel-slide');
    const dots = safeQuerySelectorAll('.nav-dot');
    const prevBtn = safeQuerySelector('#prevSlide');
    const nextBtn = safeQuerySelector('#nextSlide');
    
    if (slides.length === 0) return;
    
    let currentSlide = 0;
    
    const showSlide = (index) => {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    };
    
    const nextSlide = () => {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    };
    
    const prevSlide = () => {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
    };
    
    // Event listeners
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            showSlide(currentSlide);
        });
    });
    
    // Auto-play
    setInterval(nextSlide, 5000);
    
    // Initialize text animations
    initTextAnimations();
}

// ===== TEXT ANIMATIONS =====
function initTextAnimations() {
    const words = safeQuerySelectorAll('.word');
    const typingTexts = safeQuerySelectorAll('.typing-text');
    
    // Animate words
    words.forEach(word => {
        const delay = word.getAttribute('data-delay') || 0;
        setTimeout(() => {
            word.style.opacity = '1';
            word.style.transform = 'translateY(0)';
        }, delay);
    });
    
    // Typing effect
    typingTexts.forEach(text => {
        const originalText = text.textContent;
        text.textContent = '';
        let i = 0;
        
        const typeWriter = () => {
            if (i < originalText.length) {
                text.textContent += originalText.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            }
        };
        
        setTimeout(typeWriter, 1000);
    });
}

// ===== MASS COUNTDOWN =====
function initMassCountdown() {
    const hoursEl = safeQuerySelector('#hours');
    const minutesEl = safeQuerySelector('#minutes');
    const secondsEl = safeQuerySelector('#seconds');
    const countdownText = safeQuerySelector('#countdown-text');
    const massDayEl = safeQuerySelector('.mass-day');
    const massTimeEl = safeQuerySelector('.mass-time');
    
    if (!hoursEl || !minutesEl || !secondsEl) return;
    
    const updateCountdown = () => {
        const now = new Date();
        const today = now.getDay();
        let nextMass = new Date();
        let massDay = '';
        let massTime = '';
        
        // Sunday Mass at 6:30 AM
        if (today === 0) { // Sunday
            nextMass.setHours(6, 30, 0, 0);
            if (now > nextMass) {
                nextMass.setHours(8, 30, 0, 0);
                massDay = 'Sunday';
                massTime = '8:30 AM';
                if (now > nextMass) {
                    nextMass.setHours(18, 0, 0, 0);
                    massDay = 'Sunday';
                    massTime = '6:00 PM';
                    if (now > nextMass) {
                        nextMass.setDate(nextMass.getDate() + 1);
                        nextMass.setHours(6, 30, 0, 0);
                        massDay = 'Monday';
                        massTime = '6:30 AM';
                    }
                }
            } else {
                massDay = 'Sunday';
                massTime = '6:30 AM';
            }
        } else {
            // Weekday Mass - Saturday is 7:00 AM, others are 6:30 AM
            const morningHour = today === 6 ? 7 : 6; // Saturday = 6, so 7:00 AM
            const morningMinute = today === 6 ? 0 : 30;
            nextMass.setHours(morningHour, morningMinute, 0, 0);
            if (now > nextMass) {
                nextMass.setHours(18, 30, 0, 0);
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                massDay = dayNames[today];
                massTime = '6:30 PM';
                if (now > nextMass) {
                    nextMass.setDate(nextMass.getDate() + 1);
                    const nextDay = (today + 1) % 7;
                    const nextMorningHour = nextDay === 6 ? 7 : 6;
                    const nextMorningMinute = nextDay === 6 ? 0 : 30;
                    nextMass.setHours(nextMorningHour, nextMorningMinute, 0, 0);
                    massDay = dayNames[nextDay];
                    massTime = nextDay === 6 ? '7:00 AM' : '6:30 AM';
                }
            } else {
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                massDay = dayNames[today];
                massTime = today === 6 ? '7:00 AM' : '6:30 AM';
            }
        }
        
        // Update the mass day and time display
        if (massDayEl) massDayEl.textContent = massDay;
        if (massTimeEl) massTimeEl.textContent = massTime;
        
        const timeDiff = nextMass - now;
        
        if (timeDiff > 0) {
            const hours = Math.floor(timeDiff / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
            
            hoursEl.textContent = hours.toString().padStart(2, '0');
            minutesEl.textContent = minutes.toString().padStart(2, '0');
            secondsEl.textContent = seconds.toString().padStart(2, '0');
            
            if (countdownText) {
                countdownText.textContent = 'Until next Mass';
            }
        } else {
            hoursEl.textContent = '00';
            minutesEl.textContent = '00';
            secondsEl.textContent = '00';
            if (countdownText) {
                countdownText.textContent = 'Mass is starting soon!';
            }
        }
    };
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// ===== ANIMATED COUNTERS =====
function initAnimatedCounters() {
    const counters = safeQuerySelectorAll('[data-count]');
    
    const animateCounter = (counter) => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            counter.textContent = Math.floor(current);
        }, 16);
    };
    
    // Intersection Observer for counters
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    });
    
    counters.forEach(counter => observer.observe(counter));
}

// ===== DAILY READINGS =====
function initDailyReadings() {
    const liturgicalDate = safeQuerySelector('#liturgical-date');
    if (liturgicalDate && !liturgicalDate.textContent?.trim()) {
        const today = new Date();
        liturgicalDate.textContent = today.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    // Initialize automated readings system if available
    if (window.DailyReadingsManager && !window.dailyReadingsManager) {
        window.dailyReadingsManager = new window.DailyReadingsManager();
    }
    
    // Fallback: Load sample readings if automated system isn't available
    setTimeout(() => {
        const firstReadingText = safeQuerySelector('#first-reading-text');
        if (firstReadingText && !firstReadingText.textContent?.trim()) {
            loadSampleReadings();
        }
    }, 2000);
}

function loadSampleReadings() {
    const readings = {
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
            text: "On that day, Jesus went out of the house and sat down by the sea. Such large crowds gathered around him that he got into a boat and sat down, and the whole crowd stood along the shore."
        }
    };
    
    // Update DOM elements
    const elements = {
        'first-reading-reference': readings.first.reference,
        'first-reading-text': readings.first.text,
        'psalm-reference': readings.psalm.reference,
        'psalm-response': readings.psalm.response,
        'psalm-text': readings.psalm.text,
        'gospel-reference': readings.gospel.reference,
        'gospel-text': readings.gospel.text
    };
    
    Object.keys(elements).forEach(id => {
        const element = safeQuerySelector(`#${id}`);
        if (element) element.textContent = elements[id];
    });
}

// ===== SCROLL TO TOP =====
function initScrollToTop() {
    let scrollBtn = safeQuerySelector('#scroll-to-top');
    
    if (!scrollBtn) {
        scrollBtn = document.createElement('button');
        scrollBtn.id = 'scroll-to-top';
        scrollBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
        scrollBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            z-index: 1000;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        `;
        document.body.appendChild(scrollBtn);
    }
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollBtn.style.display = 'flex';
        } else {
            scrollBtn.style.display = 'none';
        }
    });
    
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ===== SMOOTH SCROLLING =====
function initSmoothScrolling() {
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[href^="#"]');
        if (link && link.getAttribute('href') !== '#') {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const target = safeQuerySelector(`#${targetId}`);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
}

// ===== MODAL FUNCTIONALITY =====
function initModals() {
    const MODAL_SELECTOR = '.announcement-modal, .participation-modal, .prayer-modal, .notification-modal, .reading-modal, .gallery-modal';

    const openModalById = (modalId) => {
        const modal = safeQuerySelector(`#${modalId}`);
        if (modal) {
            const scrollY = window.scrollY;
            modal.style.display = 'flex';
            modal.classList.add('show');
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
        }
    };

    const closeModalEl = (modal) => {
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            setTimeout(() => {
                window.scrollTo(0, savedScrollPosition);
            }, 10);
        }
    };

    // Event delegation for opening/closing modals
    document.addEventListener('click', function(e) {
        // Open via [data-modal]
        if (e.target.hasAttribute && e.target.hasAttribute('data-modal')) {
            const modalId = e.target.getAttribute('data-modal');
            openModalById(modalId);
            return;
        }

        // Explicit: Place Your Advert button
        if (e.target.closest && e.target.closest('#place-advert-btn')) {
            e.preventDefault();
            e.stopPropagation();
            openModalById('place-advert-modal');
            return;
        }

        // Close via close button (supports both .close-modal and .modal-close)
        if (
            (e.target.classList && e.target.classList.contains('close-modal')) ||
            (e.target.closest && e.target.closest('.close-modal')) ||
            (e.target.classList && e.target.classList.contains('modal-close')) ||
            (e.target.closest && e.target.closest('.modal-close'))
        ) {
            const modal = e.target.closest(MODAL_SELECTOR);
            closeModalEl(modal);
            return;
        }

        // Close via any cancel-* button inside a modal
        if (e.target.id && e.target.id.startsWith('cancel-')) {
            const modal = e.target.closest(MODAL_SELECTOR);
            closeModalEl(modal);
            return;
        }

        // Close on backdrop click
        if (e.target.matches && e.target.matches(MODAL_SELECTOR)) {
            closeModalEl(e.target);
            return;
        }
    });

    // Close modal with Escape key and close mobile menu
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close modal
            const openModal = safeQuerySelector(
                `${MODAL_SELECTOR}[style*="display: flex"], ${MODAL_SELECTOR}.show`
            );
            if (openModal) {
                closeModalEl(openModal);
            }
            
            // Close mobile menu
            if (window.OLMQNavigation && window.OLMQNavigation.closeMenu) {
                const navMenu = safeQuerySelector('#nav-menu');
                if (navMenu && navMenu.classList.contains('active')) {
                    window.OLMQNavigation.closeMenu();
                }
            }
        }
    });
}

// ===== FORM HANDLING =====
function initForms() {
    const forms = safeQuerySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.innerHTML : '';
            
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                submitBtn.disabled = true;
            }
            
            // Simulate form submission
            setTimeout(() => {
                showNotification('Form submitted successfully!', 'success');
                form.reset();
                
                if (submitBtn) {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
                
                // Close modal if form is in modal
                const modal = form.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            }, 2000);
        });
    });
}

// ===== GALLERY FUNCTIONALITY =====
function initGallery() {
    const filterBtns = safeQuerySelectorAll('.filter-btn');
    const galleryItems = safeQuerySelectorAll('.gallery-item');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Filter items
            galleryItems.forEach(item => {
                const category = item.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

// ===== ANIMATIONS =====
function initAnimations() {
    // Initialize AOS if available
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000,
            once: true,
            offset: 100
        });
    }
    
    // Fade in elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements with fade-in class
    const fadeElements = safeQuerySelectorAll('.fade-in');
    fadeElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// ===== PARISH REGISTRATION MODAL =====
function initParishRegistrationModal() {
    const modal = safeQuerySelector('#parish-registration-modal');
    if (!modal) return;
    
    // Check if user has seen modal recently
    const lastSeen = localStorage.getItem('parishModalLastSeen');
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    if (lastSeen && parseInt(lastSeen) > thirtyDaysAgo) {
        return;
    }
    
    // Show modal after page loads
    setTimeout(() => {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }, 3000);
    
    // Handle modal buttons
    const registerBtn = safeQuerySelector('#register-parish-btn');
    const browseBtn = safeQuerySelector('#browse-parish-btn');
    const memberBtn = safeQuerySelector('#already-member-btn');
    
    const closeModal = () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        localStorage.setItem('parishModalLastSeen', Date.now().toString());
    };
    
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            closeModal();
            window.location.href = 'about.html#join-parish';
        });
    }
    
    if (browseBtn) {
        browseBtn.addEventListener('click', closeModal);
    }
    
    if (memberBtn) {
        memberBtn.addEventListener('click', () => {
            closeModal();
            showNotification('Welcome back to our parish website!', 'success');
        });
    }
}

// ===== NEWSLETTER SIGNUP =====
function initNewsletter() {
    const newsletterForm = safeQuerySelector('#newsletter-form');
    if (!newsletterForm) return;
    
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const emailInput = this.querySelector('input[type="email"]');
        const submitBtn = this.querySelector('button[type="submit"]');
        
        if (!emailInput || !emailInput.value) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            showNotification('Thank you for subscribing to our newsletter!', 'success');
            emailInput.value = '';
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 1500);
    });
}

// ===== ADVERTS INFO (Featured) =====
function initAdverts() {
    // Ensure the Info modal exists (create dynamically to avoid HTML edits)
    const createAdvertInfoModalIfNeeded = () => {
        if (safeQuerySelector('#advert-info-modal')) return;
        const modal = document.createElement('div');
        modal.id = 'advert-info-modal';
        modal.className = 'announcement-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">
                        <img id="advert-info-logo" class="modal-logo" alt="Business Logo" onerror="this.style.display='none'">
                        <div>
                            <h3 id="advert-info-title">Business</h3>
                            <p id="advert-info-subtitle">Community Partner</p>
                        </div>
                    </div>
                    <button class="close-modal" id="close-advert-info">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="advert-info-block">
                        <p id="advert-info-description"></p>
                        <div class="advert-info-meta">
                            <div class="meta-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span id="advert-info-location"></span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-phone"></i>
                                <a id="advert-info-phone-link" href="#">
                                    <span id="advert-info-phone"></span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-modal">
                        <i class="fas fa-times"></i>
                        <span>Close</span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    const openAdvertInfoModal = (data) => {
        createAdvertInfoModalIfNeeded();
        const modal = safeQuerySelector('#advert-info-modal');
        if (!modal) return;

        const setText = (sel, text) => { const el = modal.querySelector(sel); if (el) el.textContent = text || ''; };
        const logoEl = modal.querySelector('#advert-info-logo');
        if (logoEl) {
            if (data.logo) {
                logoEl.src = data.logo;
                logoEl.style.display = '';
            } else {
                logoEl.style.display = 'none';
            }
        }

        setText('#advert-info-title', data.name || 'Business');
        setText('#advert-info-subtitle', 'Featured Community Partner');
        setText('#advert-info-description', data.description || '');
        setText('#advert-info-location', data.location || '');
        setText('#advert-info-phone', data.phone || '');

        const phoneLink = modal.querySelector('#advert-info-phone-link');
        if (phoneLink) {
            const tel = (data.phone || '').replace(/[^+\d]/g, '');
            phoneLink.href = tel ? `tel:${tel}` : '#';
        }

        modal.style.display = 'flex';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    };

    document.addEventListener('click', function(e) {
        const infoBtn = e.target.closest ? e.target.closest('.info-btn') : null;
        if (!infoBtn) return;

        const card = infoBtn.closest('.advert-card');
        if (!card) return;

        const name = card.querySelector('.advert-info h4')?.textContent?.trim() || 'Business';
        const description = card.querySelector('.advert-info p')?.textContent?.trim() || '';
        const logo = card.querySelector('.advert-logo img')?.src || '';

        // Attempt to extract location and phone
        let location = '';
        let phone = '';
        const spans = card.querySelectorAll('.advert-details span');
        if (spans && spans.length >= 2) {
            location = spans[0].textContent.trim();
            phone = spans[1].textContent.trim();
        } else {
            const detailSpans = card.querySelectorAll('.advert-details span, .advert-location');
            detailSpans.forEach(sp => {
                const text = sp.textContent.trim();
                if (!text) return;
                if (/\d/.test(text) || text.includes('+')) phone = text; else location = text;
            });
        }

        openAdvertInfoModal({ name, description, logo, location, phone });
    });
}

// ===== ANNOUNCEMENTS & PRIEST MESSAGE =====
function initAnnouncements() {
    const letterBtn = safeQuerySelector('#read-full-letter');
    const messageBtn = safeQuerySelector('#read-full-message');
    const previousBtn = safeQuerySelector('#previous-messages');

    const openModalById = (id) => {
        const modal = safeQuerySelector('#' + id);
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    };

    const ensureModal = (id, title, bodyHtml) => {
        let modal = safeQuerySelector('#' + id);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = id;
            modal.className = 'announcement-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-title">
                            <h3>${title}</h3>
                        </div>
                        <button class="close-modal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${bodyHtml}
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary close-modal">
                            <i class="fas fa-times"></i>
                            <span>Close</span>
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            const titleEl = modal.querySelector('.modal-title h3');
            const bodyEl = modal.querySelector('.modal-body');
            if (titleEl) titleEl.textContent = title;
            if (bodyEl) bodyEl.innerHTML = bodyHtml;
        }
        return modal;
    };

    if (letterBtn) {
        letterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            savedScrollPosition = window.scrollY;
            const content = `
                <p><strong>Emmanuel: God With Us in Times of Challenge</strong></p>
                <p>Beloved in Christ, as we celebrate the mystery of the Incarnation, we are reminded that God draws near to His people, especially in moments of trial. Let the light of Christ dispel every darkness in our families and in our nation.</p>
                <p>This season, I invite all the faithful to:</n>
                <ul>
                    <li>Attend the Christmas liturgies with devotion</li>
                    <li>Practice charity towards the poor and vulnerable</li>
                    <li>Strengthen family prayer and reconciliation</li>
                </ul>
                <p>May the peace of Christ reign in your hearts. — Most Rev. Alfred Adewale Martins, Archbishop of Lagos.</p>
            `;
            ensureModal('full-letter-modal', 'Christmas Season Pastoral Letter', content);
            openModalById('full-letter-modal');
        });
    }

    if (messageBtn) {
        messageBtn.addEventListener('click', () => {
            const content = `
                <p>Dear beloved parishioners,</p>
                <p>As we journey through Advent, we are called to watchfulness, hope, and joyful expectation. Let us prepare room for Christ through prayer, confession, reconciliation with one another, and works of mercy.</p>
                <p>I encourage you to join our Novena, participate in parish activities, and keep Christ at the center of all preparations. May Emmanuel bless you and your families.</p>
                <p>— Rev. Fr. Leon Houessou, Parish Priest.</p>
            `;
            ensureModal('full-message-modal', "Parish Priest's Message", content);
            openModalById('full-message-modal');
        });
    }

    if (previousBtn) {
        previousBtn.addEventListener('click', () => {
            const previousMessages = [
                {
                    date: 'December 8, 2024',
                    title: 'Second Sunday of Advent: Prepare the Way',
                    content: 'Let us straighten the paths of our lives through sincere repentance and renewed faith. Make time for the Sacrament of Reconciliation and acts of charity.'
                },
                {
                    date: 'December 1, 2024',
                    title: 'First Sunday of Advent: Keep Watch',
                    content: 'Stay awake in prayer and hope. Begin Advent with a family prayer plan and simple sacrifices that open our hearts to Christ.'
                },
                {
                    date: 'November 24, 2024',
                    title: 'Christ the King: Lord of Our Lives',
                    content: 'We crown Christ as King when we obey His word and serve in love. Let our homes reflect His Kingdom of peace and justice.'
                }
            ];
            const listHtml = previousMessages.map(m => `
                <div class="previous-message-item" style="padding: 12px 0; border-bottom: 1px solid #eee;">
                    <div class="prev-header" style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                        <h4 style="margin:0;">${m.title}</h4>
                        <span style="font-size: 0.875rem; color:#666;"><i class="fas fa-calendar"></i> ${m.date}</span>
                    </div>
                    <div class="prev-body" style="margin-top:6px;">
                        <p style="margin:0;">${m.content}</p>
                    </div>
                </div>
            `).join('');
            const content = `<div class="previous-messages-list">${listHtml}</div>`;
            ensureModal('previous-messages-modal', 'Previous Messages', content);
            openModalById('previous-messages-modal');
        });
    }
}

// ===== HARVEST BUTTONS =====
function initHarvestButtons() {
    document.addEventListener('click', function(e) {
        // Volunteer button
        if (e.target.closest('.volunteer-btn')) {
            const modal = safeQuerySelector('#participation-modal');
            if (modal) {
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        }
        
        // Register Stall button
        if (e.target.closest('.register-btn')) {
            const modal = safeQuerySelector('#participation-modal');
            if (modal) {
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        }
    });
}

// ===== LIVE STREAM FUNCTIONALITY =====
function initLiveStream() {
    // Notify Me When Live button
    const notifyBtn = safeQuerySelector('#notify-btn');
    if (notifyBtn) {
        notifyBtn.addEventListener('click', function() {
            const modal = safeQuerySelector('#stream-notification-modal');
            if (modal) {
                modal.style.display = 'flex';
                modal.classList.add('show');
                document.body.style.overflow = 'hidden';
            }
        });
    }

    // Test Stream button
    const testStreamBtn = safeQuerySelector('#test-stream-btn');
    if (testStreamBtn) {
        testStreamBtn.addEventListener('click', function() {
            const offlineState = safeQuerySelector('#offline-state');
            const youtubeEmbed = safeQuerySelector('#youtube-embed');
            const iframe = safeQuerySelector('#youtube-iframe');
            
            if (offlineState && youtubeEmbed && iframe) {
                // Show test stream (sample video)
                iframe.src = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1';
                offlineState.style.display = 'none';
                youtubeEmbed.style.display = 'block';
                
                showNotification('Test stream started! This is a sample video.', 'success');
                
                // Update stream status
                const statusDot = safeQuerySelector('.status-dot');
                const statusText = safeQuerySelector('.status-text');
                if (statusDot) statusDot.className = 'status-dot live';
                if (statusText) statusText.textContent = 'Test Stream Live';
            }
        });
    }

    // Share Stream button
    const shareBtn = safeQuerySelector('#share-stream-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            if (navigator.share) {
                navigator.share({
                    title: 'OLMQ Live Stream',
                    text: 'Join us for live Mass at Our Lady Mother and Queen Catholic Church, Badore',
                    url: window.location.href + '#live-stream'
                }).catch(err => console.log('Error sharing:', err));
            } else {
                // Fallback: copy to clipboard
                const url = window.location.href + '#live-stream';
                navigator.clipboard.writeText(url).then(() => {
                    showNotification('Stream link copied to clipboard!', 'success');
                }).catch(() => {
                    showNotification('Unable to copy link. Please share manually.', 'error');
                });
            }
        });
    }

    // Donate button
    const donateBtn = safeQuerySelector('#stream-donate-btn');
    if (donateBtn) {
        donateBtn.addEventListener('click', function() {
            showNotification('Donation: Access Bank - 0017925881 - OUR LADY MOTHER AND QUEEN', 'info');
        });
    }

    // Prayer Request button
    const prayerBtn = safeQuerySelector('#prayer-request-btn');
    if (prayerBtn) {
        prayerBtn.addEventListener('click', function() {
            const modal = safeQuerySelector('#prayer-request-modal');
            if (modal) {
                modal.style.display = 'flex';
                modal.classList.add('show');
                document.body.style.overflow = 'hidden';
            }
        });
    }

    // Recording play buttons
    const playOverlays = safeQuerySelectorAll('.play-overlay');
    playOverlays.forEach(overlay => {
        overlay.addEventListener('click', function() {
            const recordingItem = overlay.closest('.recording-item');
            if (recordingItem) {
                const title = recordingItem.querySelector('h4')?.textContent || 'Mass Recording';
                
                // Create and show video modal
                createVideoModal(title, 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1');
                showNotification(`Playing: ${title}`, 'success');
            }
        });
    });

    // Stream notification form handling
    const notificationForm = safeQuerySelector('#notification-form');
    if (notificationForm) {
        // Show form when notification options are toggled
        const toggles = safeQuerySelectorAll('#stream-notification-modal input[type="checkbox"]');
        toggles.forEach(toggle => {
            toggle.addEventListener('change', function() {
                const anyChecked = Array.from(toggles).some(t => t.checked);
                notificationForm.style.display = anyChecked ? 'block' : 'none';
            });
        });
    }
}

// Create video modal for recordings
function createVideoModal(title, videoUrl) {
    // Remove existing video modal
    const existingModal = safeQuerySelector('#video-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'video-modal';
    modal.className = 'announcement-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px;">
            <div class="modal-header">
                <div class="modal-title">
                    <h3>${title}</h3>
                </div>
                <button class="close-modal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body" style="padding: 0;">
                <div class="video-container" style="position: relative; width: 100%; height: 0; padding-bottom: 56.25%;">
                    <iframe 
                        src="${videoUrl}" 
                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">
                    <i class="fas fa-times"></i>
                    <span>Close</span>
                </button>
                <a href="https://www.youtube.com/@olmqbadore2146" target="_blank" class="btn btn-primary">
                    <i class="fab fa-youtube"></i>
                    <span>Visit Our YouTube</span>
                </a>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// ===== GLOBAL SCROLL POSITION STORAGE =====
let savedScrollPosition = 0;

// ===== FIX PLACE ADVERT BUTTON =====
function fixPlaceAdvertButton() {
    const btn = document.getElementById('place-advert-btn');
    if (btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            savedScrollPosition = window.scrollY;
            const modal = document.getElementById('place-advert-modal');
            if (modal) {
                modal.style.display = 'flex';
                modal.classList.add('show');
                document.body.style.overflow = 'hidden';
            }
            return false;
        }, true);
    }
}

// ===== MAIN INITIALIZATION =====
function initializeWebsite() {
    try {
        console.log('Initializing OLMQ Church website...');
        
        // Fix the advert button first
        fixPlaceAdvertButton();
        
        // Core functionality
        initLoadingScreen();
        initNavigation();
        initDateDisplay();
        initSmoothScrolling();
        initScrollToTop();
        
        // Content functionality
        initHeroCarousel();
        initMassCountdown();
        initAnimatedCounters();
        initDailyReadings();
        
        // Interactive features
        initModals();
        initForms();
        initGallery();
        initAnimations();
        initParishRegistrationModal();
        initNewsletter();
        initAdverts();
        initAnnouncements();
        initHarvestButtons();
        initLiveStream();
        
        // Ensure body is scrollable
        document.body.style.overflow = 'auto';
        
        // Add mobile-specific fixes
        addMobileFixes();
        
        console.log('OLMQ Church website initialized successfully!');
        
    } catch (error) {
        console.error('Error during initialization:', error);
        
        // Fallback: ensure page is still usable
        document.body.style.overflow = 'auto';
        const loadingScreen = safeQuerySelector('#loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        showNotification('Website loaded with limited functionality', 'error');
    }
}

// ===== MOBILE FIXES =====
function addMobileFixes() {
    // Fix for iOS Safari viewport issues
    const setVH = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    // Improve touch responsiveness
    const navToggle = safeQuerySelector('#hamburger');
    if (navToggle) {
        navToggle.style.touchAction = 'manipulation';
        navToggle.style.userSelect = 'none';
        navToggle.style.webkitUserSelect = 'none';
        navToggle.style.webkitTouchCallout = 'none';
        
        // Add visual feedback for touch
        navToggle.addEventListener('touchstart', () => {
            navToggle.style.transform = 'scale(0.95)';
        }, { passive: true });
        
        navToggle.addEventListener('touchend', () => {
            setTimeout(() => {
                navToggle.style.transform = '';
            }, 150);
        }, { passive: true });
    }
    
    // Prevent zoom on input focus (iOS)
    const inputs = safeQuerySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        if (input.style.fontSize === '' || parseFloat(input.style.fontSize) < 16) {
            input.style.fontSize = '16px';
        }
    });
    
    // Add touch-friendly styles to interactive elements
    const interactiveElements = safeQuerySelectorAll('button, .btn, .nav-link, .filter-btn');
    interactiveElements.forEach(element => {
        element.style.touchAction = 'manipulation';
    });
    
    // Handle orientation change
    window.addEventListener('orientationchange', () => {
        // Close mobile menu on orientation change
        if (window.OLMQNavigation && window.OLMQNavigation.closeMenu) {
            const navMenu = safeQuerySelector('#nav-menu');
            if (navMenu && navMenu.classList.contains('active')) {
                window.OLMQNavigation.closeMenu();
            }
        }
        
        // Recalculate viewport height
        setTimeout(setVH, 500);
    });
}

// ===== DOM READY =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWebsite);
} else {
    initializeWebsite();
}

// ===== FALLBACK INITIALIZATION =====
window.addEventListener('load', function() {
    // Double-check critical elements
    const loadingScreen = safeQuerySelector('#loading-screen');
    if (loadingScreen && loadingScreen.style.display !== 'none') {
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 1000);
    }
    
    // Ensure page is scrollable
    if (document.body.style.overflow !== 'auto') {
        document.body.style.overflow = 'auto';
    }
});

// ===== CONSOLE WELCOME MESSAGE =====
console.log('%c⛪ Our Lady Mother and Queen Catholic Church, Badore', 'color: #667eea; font-size: 16px; font-weight: bold;');
console.log('%c"We shall do whatever your son tells us"', 'color: #764ba2; font-style: italic;');
console.log('%cWebsite developed with ❤️ for the parish community', 'color: #667eea;');

// ===== EXPORT FOR GLOBAL USE =====
window.OLMQChurch = {
    showNotification,
    initializeWebsite,
    safeQuerySelector,
    safeQuerySelectorAll,
    addMobileFixes
};

// Debug function for mobile testing
window.debugMobileMenu = function() {
    const navToggle = safeQuerySelector('#hamburger');
    const navMenu = safeQuerySelector('#nav-menu');
    
    console.log('Nav Toggle:', navToggle);
    console.log('Nav Menu:', navMenu);
    console.log('Nav Toggle Classes:', navToggle?.className);
    console.log('Nav Menu Classes:', navMenu?.className);
    console.log('Body Classes:', document.body.className);
    console.log('Window Width:', window.innerWidth);
    console.log('OLMQNavigation:', window.OLMQNavigation);
};
