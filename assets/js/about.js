// ===== ABOUT PAGE JAVASCRIPT =====

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    initializeAboutPage();
});

// ===== MAIN INITIALIZATION =====
function initializeAboutPage() {
    initializeNavigation();
    initializeCurrentDate();
    initializeScrollEffects();
    initializeModal();
    initializeFormHandling();
    initializeScrollToTop();
    initializeAnimations();
}

// ===== NAVIGATION FUNCTIONALITY =====
function initializeNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Mobile menu toggle
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on links
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        }
    });

    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 100) {
                navbar.style.background = 'rgba(255, 255, 255, 0.98)';
                navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
            }
        });
    }
}

// ===== CURRENT DATE DISPLAY =====
function initializeCurrentDate() {
    const currentDateElement = document.querySelector('.current-date');
    if (currentDateElement) {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        currentDateElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

// ===== SCROLL EFFECTS =====
function initializeScrollEffects() {
    // Smooth scroll for internal links
    const internalLinks = document.querySelectorAll('a[href^="#"]');
    internalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Scroll indicator animation
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', function() {
            const ourStorySection = document.getElementById('our-story');
            if (ourStorySection) {
                const offsetTop = ourStorySection.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    }

    // Parallax effect for hero background
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const heroBackground = document.querySelector('.hero-bg-img');
        
        if (heroBackground) {
            const rate = scrolled * -0.5;
            heroBackground.style.transform = `translateY(${rate}px)`;
        }
    });

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.timeline-item, .highlight-card, .leader-card, .ministry-leader-card');
    animateElements.forEach(el => observer.observe(el));
}

// ===== MODAL FUNCTIONALITY =====
function initializeModal() {
    const modal = document.getElementById('parish-registration-modal');
    const openModalBtns = document.querySelectorAll('a[href="#join-parish"]');
    const closeModalBtn = document.getElementById('close-parish-modal');
    const cancelBtn = document.getElementById('cancel-registration');

    // Open modal
    openModalBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (modal) {
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden';
                
                // Focus on first input
                setTimeout(() => {
                    const firstInput = modal.querySelector('input');
                    if (firstInput) firstInput.focus();                }, 100);
            }
        });
    });

    // Close modal
    function closeModal() {
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // Reset form
            const form = document.getElementById('parish-registration-form');
            if (form) {
                form.reset();
                clearFormErrors();
            }
        }
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }

    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.style.display === 'block') {
            closeModal();
        }
    });
}

// ===== FORM HANDLING =====
function initializeFormHandling() {
    const form = document.getElementById('parish-registration-form');
    
    if (form) {
        form.addEventListener('submit', handleFormSubmission);
        
        // Real-time validation
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            input.addEventListener('input', function() {
                clearFieldError(this);
            });
        });
    }
}

function handleFormSubmission(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Clear previous errors
    clearFormErrors();
    
    // Validate form
    if (!validateForm(form)) {
        showFormMessage('Please correct the errors below.', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Submitting...</span>';
    submitBtn.disabled = true;
    
    // Simulate form submission (replace with actual API call)
    setTimeout(() => {
        // Simulate success
        showFormMessage('Thank you! Your registration has been submitted successfully. We will contact you soon.', 'success');
        
        // Reset form
        form.reset();
        
        // Close modal after delay
        setTimeout(() => {
            const modal = document.getElementById('parish-registration-modal');
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        }, 2000);
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
    }, 2000);
}

function validateForm(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}

function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.getAttribute('name');
    let isValid = true;
    let errorMessage = '';
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        errorMessage = 'This field is required.';
        isValid = false;
    }
    
    // Email validation
    else if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            errorMessage = 'Please enter a valid email address.';
            isValid = false;
        }
    }
    
    // Phone validation
    else if (field.type === 'tel' && value) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(value)) {
            errorMessage = 'Please enter a valid phone number.';
            isValid = false;
        }
    }
    
    // Name validation
    else if ((fieldName === 'first-name' || fieldName === 'last-name') && value) {
        if (value.length < 2) {
            errorMessage = 'Name must be at least 2 characters long.';
            isValid = false;
        }
    }
    
    if (!isValid) {
        showFieldError(field, errorMessage);
    } else {
        clearFieldError(field);
    }
    
    return isValid;
}

function showFieldError(field, message) {
    clearFieldError(field);
    
    field.style.borderColor = '#e74c3c';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.color = '#e74c3c';
    errorDiv.style.fontSize = '12px';
    errorDiv.style.marginTop = '5px';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.style.borderColor = '#e9ecef';
    
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

function clearFormErrors() {
    const errors = document.querySelectorAll('.field-error');
    errors.forEach(error => error.remove());
    
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.style.borderColor = '#e9ecef';
    });
    
    const messages = document.querySelectorAll('.form-success, .form-error');
    messages.forEach(message => message.remove());
}

function showFormMessage(message, type) {
    clearFormErrors();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `form-${type}`;
    
    const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
    messageDiv.innerHTML = `<i class="${icon}"></i> ${message}`;
    
    const form = document.getElementById('parish-registration-form');
    form.insertBefore(messageDiv, form.firstChild);
    
    // Auto-remove error messages after 5 seconds
    if (type === 'error') {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

// ===== SCROLL TO TOP FUNCTIONALITY =====
function initializeScrollToTop() {
    // Create scroll to top button
    const scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.className = 'scroll-to-top';
    scrollToTopBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    scrollToTopBtn.setAttribute('aria-label', 'Scroll to top');
    document.body.appendChild(scrollToTopBtn);
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });
    
    // Scroll to top when clicked
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ===== ANIMATIONS =====
function initializeAnimations() {
    // Counter animation for statistics
    const counters = document.querySelectorAll('.stat-number');
    const counterObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => counterObserver.observe(counter));
    
    // Typing effect for quotes
    const quotes = document.querySelectorAll('.welcome-paragraph, .leadership-quote');
    quotes.forEach(quote => {
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('typing-effect');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });
        
        observer.observe(quote);
    });
}

function animateCounter(element) {
    const target = parseInt(element.textContent.replace(/[^\d]/g, ''));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(function() {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        
        // Preserve original formatting
        const originalText = element.textContent;
        const prefix = originalText.match(/^[^\d]*/)[0];
        const suffix = originalText.match(/[^\d]*$/)[0];
        
        element.textContent = prefix + Math.floor(current) + suffix;
    }, 16);
}

// ===== UTILITY FUNCTIONS =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// ===== CONTACT FUNCTIONALITY =====
function initializeContactButtons() {
    const contactBtns = document.querySelectorAll('.contact-btn');
    
    contactBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Add click animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            // Track contact attempts (for analytics)
            if (typeof gtag !== 'undefined') {
                const action = href.startsWith('mailto:') ? 'email' : 'phone';
                gtag('event', 'contact_attempt', {
                    'contact_method': action,
                    'contact_target': href
                });
            }
        });
    });
}

// ===== ACCESSIBILITY ENHANCEMENTS =====
function initializeAccessibility() {
    // Skip to content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: var(--primary-color);
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 1000;
        transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', function() {
        this.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', function() {
        this.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add main content landmark
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        heroSection.setAttribute('id', 'main-content');
        heroSection.setAttribute('role', 'main');
    }
    
    // Enhance keyboard navigation
    const focusableElements = document.querySelectorAll(
        'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    
    focusableElements.forEach(element => {
        element.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && this.tagName === 'A') {
                this.click();
            }
        });
    });
}

// ===== ERROR HANDLING =====
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.error);
    
    // Show user-friendly error message for critical failures
    if (e.error && e.error.message.includes('critical')) {
        showGlobalError('Something went wrong. Please refresh the page and try again.');
    }
});

function showGlobalError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e74c3c;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 2000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <span style="margin-left: 10px;">${message}</span>
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

// ===== PERFORMANCE OPTIMIZATIONS =====
// Lazy load images
function initializeLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Preload critical resources
function preloadCriticalResources() {
    const criticalImages = [
        'assets/img/logo.png'
    ];
    
    criticalImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
    });
}

// ===== INITIALIZE ADDITIONAL FEATURES =====
document.addEventListener('DOMContentLoaded', function() {
    initializeContactButtons();
    initializeAccessibility();
    initializeLazyLoading();
        preloadCriticalResources();
});

// ===== SEARCH FUNCTIONALITY =====
function initializeSearch() {
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search leadership...';
    searchInput.className = 'leadership-search';
    searchInput.style.cssText = `
        width: 100%;
        max-width: 400px;
        padding: 12px 20px;
        border: 2px solid #e9ecef;
        border-radius: 25px;
        font-size: 16px;
        margin-bottom: 30px;
        transition: all 0.3s ease;
    `;
    
    const leadershipSection = document.querySelector('.leadership-section .container');
    if (leadershipSection) {
        const sectionHeader = leadershipSection.querySelector('.section-header');
        if (sectionHeader) {
            sectionHeader.appendChild(searchInput);
        }
    }
    
    // Search functionality
    searchInput.addEventListener('input', debounce(function() {
        const searchTerm = this.value.toLowerCase();
        const leaderCards = document.querySelectorAll('.leader-card, .ministry-leader-card');
        
        leaderCards.forEach(card => {
            const name = card.querySelector('.leader-name, h4')?.textContent.toLowerCase() || '';
            const position = card.querySelector('.leader-position, .ministry-leader-info p')?.textContent.toLowerCase() || '';
            const bio = card.querySelector('.leader-bio, .ministry-description')?.textContent.toLowerCase() || '';
            
            const matches = name.includes(searchTerm) || 
                          position.includes(searchTerm) || 
                          bio.includes(searchTerm);
            
            if (matches || searchTerm === '') {
                card.style.display = 'block';
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
            } else {
                card.style.opacity = '0.3';
                card.style.transform = 'scale(0.95)';
            }
        });
        
        // Show "no results" message
        const visibleCards = Array.from(leaderCards).filter(card => 
            card.style.opacity !== '0.3'
        );
        
        let noResultsMsg = document.querySelector('.no-results-message');
        if (visibleCards.length === 0 && searchTerm !== '') {
            if (!noResultsMsg) {
                noResultsMsg = document.createElement('div');
                noResultsMsg.className = 'no-results-message';
                noResultsMsg.style.cssText = `
                    text-align: center;
                    padding: 40px;
                    color: var(--medium-gray);
                    font-size: 18px;
                `;
                noResultsMsg.innerHTML = `
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                    <p>No leaders found matching your search.</p>
                `;
                leadershipSection.appendChild(noResultsMsg);
            }
            noResultsMsg.style.display = 'block';
        } else if (noResultsMsg) {
            noResultsMsg.style.display = 'none';
        }
    }, 300));
    
    // Focus styles
    searchInput.addEventListener('focus', function() {
        this.style.borderColor = 'var(--primary-color)';
        this.style.boxShadow = '0 0 0 3px rgba(52, 152, 219, 0.1)';
    });
    
    searchInput.addEventListener('blur', function() {
        this.style.borderColor = '#e9ecef';
        this.style.boxShadow = 'none';
    });
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--primary-color);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: var(--shadow-medium);
        z-index: 2001;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, duration);
}

// ===== READING PROGRESS INDICATOR =====
function initializeReadingProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
        z-index: 1001;
        transition: width 0.1s ease;
    `;
    
    document.body.appendChild(progressBar);
    
    window.addEventListener('scroll', throttle(function() {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        
        progressBar.style.width = Math.min(scrollPercent, 100) + '%';
    }, 10));
}

// ===== KEYBOARD SHORTCUTS =====
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + K: Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.querySelector('.leadership-search');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // Ctrl/Cmd + P: Print
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            window.print();
        }
        
        // Escape: Close modal or clear search
        if (e.key === 'Escape') {
            const modal = document.getElementById('parish-registration-modal');
            const searchInput = document.querySelector('.leadership-search');
            
            if (modal && modal.style.display === 'block') {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            } else if (searchInput && searchInput.value) {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input'));
            }
        }
        
        // Home: Scroll to top
        if (e.key === 'Home' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        // End: Scroll to bottom
        if (e.key === 'End' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
    });
}

// ===== ANALYTICS TRACKING =====
function initializeAnalytics() {
    // Track page view
    if (typeof gtag !== 'undefined') {
        gtag('config', 'GA_MEASUREMENT_ID', {
            page_title: 'About Us - OLMQ Badore',
            page_location: window.location.href
        });
    }
    
    // Track scroll depth
    let maxScroll = 0;
    const scrollMilestones = [25, 50, 75, 100];
    
    window.addEventListener('scroll', throttle(function() {
        const scrollPercent = Math.round((window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
        
        if (scrollPercent > maxScroll) {
            maxScroll = scrollPercent;
            
            scrollMilestones.forEach(milestone => {
                if (scrollPercent >= milestone && !window[`scrolled_${milestone}`]) {
                    window[`scrolled_${milestone}`] = true;
                    
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'scroll_depth', {
                            'event_category': 'engagement',
                            'event_label': `${milestone}%`,
                            'value': milestone
                        });
                    }
                }
            });
        }
    }, 1000));
    
    // Track time on page
    const startTime = Date.now();
    
    window.addEventListener('beforeunload', function() {
        const timeOnPage = Math.round((Date.now() - startTime) / 1000);
        
        if (typeof gtag !== 'undefined' && timeOnPage > 10) {
            gtag('event', 'time_on_page', {
                'event_category': 'engagement',
                'event_label': 'about_page',
                'value': timeOnPage
            });
        }
    });
}

// ===== INITIALIZE ALL ADDITIONAL FEATURES =====
document.addEventListener('DOMContentLoaded', function() {
    // Initialize additional features with delay to ensure DOM is ready
    setTimeout(() => {
        initializeSearch();
        initializeReadingProgress();
        initializeKeyboardShortcuts();
        initializeAnalytics();
    }, 500);
});

// ===== SERVICE WORKER REGISTRATION =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
                            });
    });
}

// ===== PERFORMANCE MONITORING =====
window.addEventListener('load', function() {
    // Log page load time
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    console.log(`Page loaded in ${loadTime}ms`);
    
    // Report long tasks
    if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver(function(list) {
            list.getEntries().forEach(function(entry) {
                if (entry.duration > 50) {
                    console.warn(`Long task detected: ${entry.duration}ms`);
                }
            });
        });
        observer.observe({ entryTypes: ['longtask'] });
    }
});

// ===== FINAL INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Initialize core features only
    initializeAboutPage();
    
    // Add loading complete class
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
});

// ===== END OF SCRIPT =====



