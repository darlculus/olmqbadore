// ===== PARISH OFFICE PAGE JAVASCRIPT =====

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
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${
              type === "success"
                ? "check"
                : type === "error"
                ? "times"
                : type === "warning"
                ? "exclamation-triangle"
                : "info"
            }"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;

  document.body.appendChild(notification);

  // Show notification
  setTimeout(() => notification.classList.add("show"), 100);

  // Auto hide after 5 seconds
  setTimeout(() => hideNotification(notification), 5000);

  // Close button functionality
  const closeBtn = notification.querySelector(".notification-close");
  closeBtn.addEventListener("click", () => hideNotification(notification));
}

function hideNotification(notification) {
  notification.classList.remove("show");
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 300);
}

// ===== MODAL FUNCTIONALITY =====
function openModal(modalId) {
  const modal = safeQuerySelector(`#${modalId}`);
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";

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
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

// ===== NAVIGATION =====
function initNavigation() {
  const navToggle = safeQuerySelector(".nav-toggle");
  const navMenu = safeQuerySelector(".nav-menu");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      navToggle.classList.toggle("active");
      navMenu.classList.toggle("active");
    });

    // Close menu when clicking on links
    const navLinks = safeQuerySelectorAll(".nav-link");
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        navToggle.classList.remove("active");
        navMenu.classList.remove("active");
      });
    });
  }

  // Update current date
  updateCurrentDate();
}

function updateCurrentDate() {
  const dateElement = safeQuerySelector(".current-date");
  if (dateElement) {
    const now = new Date();
    const options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    dateElement.textContent = now.toLocaleDateString("en-US", options);
  }
}

// ===== FORM HANDLING =====
function initForms() {
  // Appointment Form
  const appointmentForm = safeQuerySelector("#appointment-form");
  if (appointmentForm) {
    appointmentForm.addEventListener("submit", handleAppointmentSubmit);
  }

  // Sacrament Forms
  const sacramentForms = safeQuerySelectorAll(".sacrament-form");
  sacramentForms.forEach((form) => {
    form.addEventListener("submit", handleSacramentSubmit);
  });

  // Set minimum date for appointment booking
  const dateInput = safeQuerySelector("#appointment-date");
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split("T")[0];
  }
}

function handleAppointmentSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  // Validate required fields
  const requiredFields = ["name", "email", "phone", "date", "time", "purpose"];
  const missingFields = requiredFields.filter((field) => !data[field]);

  if (missingFields.length > 0) {
    showNotification("Please fill in all required fields.", "error");
    return;
  }

  // Validate email
  if (!isValidEmail(data.email)) {
    showNotification("Please enter a valid email address.", "error");
    return;
  }

  // Validate phone
  if (!isValidPhone(data.phone)) {
    showNotification("Please enter a valid phone number.", "error");
    return;
  }

  // Show loading state
  const submitBtn = form.querySelector(".appointment-btn");
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> <span>Booking...</span>';
  submitBtn.disabled = true;

  // Simulate API call
  setTimeout(() => {
    showNotification(
      "Appointment request submitted successfully! We will contact you within 24 hours.",
      "success"
    );
    form.reset();

    // Reset button
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }, 2000);
}

function handleSacramentSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  // Get form type from modal
  const modal = form.closest(".sacrament-modal");
  const modalId = modal ? modal.id : "unknown";
  const sacramentType = modalId.replace("-modal", "");

  // Show loading state
  const submitBtn = form.querySelector(".btn-primary");
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> <span>Submitting...</span>';
  submitBtn.disabled = true;

  // Simulate API call
  setTimeout(() => {
    showNotification(
      `${capitalize(
        sacramentType
      )} registration submitted successfully! We will contact you soon.`,
      "success"
    );
    form.reset();
    closeModal(modalId);

    // Reset button
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }, 2000);
}

// ===== VALIDATION FUNCTIONS =====
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone) {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
  return phoneRegex.test(cleanPhone) && cleanPhone.length >= 10;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("aos-animate");
      }
    });
  }, observerOptions);

  // Observe all elements with data-aos attribute
  const animatedElements = safeQuerySelectorAll("[data-aos]");
  animatedElements.forEach((el) => observer.observe(el));
}

// ===== SMOOTH SCROLLING =====
function initSmoothScrolling() {
  const scrollLinks = safeQuerySelectorAll('a[href^="#"]');

  scrollLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (href === "#") return;

      const target = safeQuerySelector(href);
      if (target) {
        e.preventDefault();
        const offsetTop = target.offsetTop - 80; // Account for fixed navbar

        window.scrollTo({
          top: offsetTop,
          behavior: "smooth",
        });
      }
    });
  });
}

// ===== MODAL EVENT LISTENERS =====
function initModalEvents() {
  // Close modal when clicking outside
  const modals = safeQuerySelectorAll(".sacrament-modal");
  modals.forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  // Close modal with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const activeModal = safeQuerySelector(".sacrament-modal.active");
      if (activeModal) {
        closeModal(activeModal.id);
      }
    }
  });
}

// ===== NAVBAR SCROLL EFFECT =====
function initNavbarScroll() {
  const navbar = safeQuerySelector(".navbar");
  if (!navbar) return;

  let lastScrollY = window.scrollY;

  window.addEventListener("scroll", () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > 100) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }

    // Hide/show navbar on scroll
    if (currentScrollY > lastScrollY && currentScrollY > 200) {
      navbar.style.transform = "translateY(-100%)";
    } else {
      navbar.style.transform = "translateY(0)";
    }

    lastScrollY = currentScrollY;
  });
}

// ===== FORM ENHANCEMENTS =====
function initFormEnhancements() {
  // Auto-format phone numbers
  const phoneInputs = safeQuerySelectorAll('input[type="tel"]');
  phoneInputs.forEach((input) => {
    input.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");
      if (value.length >= 10) {
        value = value.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
      }
      e.target.value = value;
    });
  });

  // Dynamic form validation
  const inputs = safeQuerySelectorAll(
    "input[required], select[required], textarea[required]"
  );
  inputs.forEach((input) => {
    input.addEventListener("blur", validateField);
    input.addEventListener("input", clearFieldError);
  });
}

function validateField(e) {
  const field = e.target;
  const value = field.value.trim();

  // Remove existing error styling
  field.classList.remove("error");

  // Check if required field is empty
  if (field.hasAttribute("required") && !value) {
    showFieldError(field, "This field is required");
    return;
  }

  // Validate email
  if (field.type === "email" && value && !isValidEmail(value)) {
    showFieldError(field, "Please enter a valid email address");
    return;
  }

  // Validate phone
  if (field.type === "tel" && value && !isValidPhone(value)) {
    showFieldError(field, "Please enter a valid phone number");
    return;
  }

  // Validate date (not in the past)
  if (field.type === "date" && value) {
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      showFieldError(field, "Please select a future date");
      return;
    }
  }
}

function showFieldError(field, message) {
  field.classList.add("error");

  // Remove existing error message
  const existingError = field.parentNode.querySelector(".field-error");
  if (existingError) {
    existingError.remove();
  }

  // Add error message
  const errorElement = document.createElement("div");
  errorElement.className = "field-error";
  errorElement.textContent = message;
  field.parentNode.appendChild(errorElement);
}

function clearFieldError(e) {
  const field = e.target;
  field.classList.remove("error");

  const errorElement = field.parentNode.querySelector(".field-error");
  if (errorElement) {
    errorElement.remove();
  }
}

// ===== ACCESSIBILITY ENHANCEMENTS =====
function initAccessibility() {
  // Skip to content link
  const skipLink = document.createElement("a");
  skipLink.href = "#main-content";
  skipLink.textContent = "Skip to main content";
  skipLink.className = "skip-link";
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

  skipLink.addEventListener("focus", () => {
    skipLink.style.top = "6px";
  });

  skipLink.addEventListener("blur", () => {
    skipLink.style.top = "-40px";
  });

  document.body.insertBefore(skipLink, document.body.firstChild);

  // Add main content ID if not present
  const heroSection = safeQuerySelector(".hero-section");
  if (heroSection && !document.getElementById("main-content")) {
    heroSection.id = "main-content";
  }

  // Improve button accessibility
  const buttons = safeQuerySelectorAll(
    "button:not([aria-label]):not([aria-labelledby])"
  );
  buttons.forEach((button) => {
    if (!button.textContent.trim()) {
      const icon = button.querySelector("i");
      if (icon) {
        const iconClass = icon.className;
        let label = "Button";

        if (iconClass.includes("fa-times")) label = "Close";
        else if (iconClass.includes("fa-phone")) label = "Call";
        else if (iconClass.includes("fa-envelope")) label = "Email";
        else if (iconClass.includes("fa-download")) label = "Download";

        button.setAttribute("aria-label", label);
      }
    }
  });
}

// ===== PERFORMANCE OPTIMIZATIONS =====
function initPerformanceOptimizations() {
  // Lazy load images
  const images = safeQuerySelectorAll("img[data-src]");
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute("data-src");
        imageObserver.unobserve(img);
      }
    });
  });

  images.forEach((img) => imageObserver.observe(img));

  // Debounce scroll events
  let scrollTimeout;
  const originalScrollHandler = window.onscroll;

  window.onscroll = function () {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      if (originalScrollHandler) originalScrollHandler();
    }, 16); // ~60fps
  };
}

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", function () {
  try {
    initNavigation();
    initForms();
    initScrollAnimations();
    initSmoothScrolling();
    initModalEvents();
    initNavbarScroll();
    initFormEnhancements();
    initAccessibility();
    initPerformanceOptimizations();

    console.log("Parish Office page initialized successfully");
  } catch (error) {
    console.error("Error initializing Parish Office page:", error);
  }
});

// ===== GLOBAL FUNCTIONS (for HTML onclick handlers) =====
window.openModal = openModal;
window.closeModal = closeModal;
window.showNotification = showNotification;

// ===== ERROR HANDLING =====
window.addEventListener("error", function (e) {
  console.error("JavaScript Error:", e.error);
  showNotification(
    "An error occurred. Please refresh the page and try again.",
    "error"
  );
});

// ===== SERVICE WORKER REGISTRATION (if available) =====
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}

// ===== AOS ANIMATION INITIALIZATION =====
function initAOSAnimations() {
    // Check if AOS library is loaded
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true,
            offset: 100,
            disable: function() {
                // Disable AOS on mobile devices for better performance
                return window.innerWidth < 768;
            }
        });
        
        console.log('AOS animations initialized');
    } else {
        console.warn('AOS library not loaded - animations will be disabled');
    }
}

// Update the main initialization function
document.addEventListener('DOMContentLoaded', function() {
    try {
        initNavigation();
        initForms();
        initScrollAnimations();
        initSmoothScrolling();
        initModalEvents();
        initNavbarScroll();
        initFormEnhancements();
        initAccessibility();
        initPerformanceOptimizations();
        initAOSAnimations(); // Add this line
        
        console.log('Parish Office page initialized successfully');
    } catch (error) {
        console.error('Error initializing Parish Office page:', error);
    }
});

// ===== ONLINE SERVICES FUNCTIONS =====

// Mass Booking Modal
function openMassBookingModal() {
    const modalHTML = `
        <div class="modal-overlay" id="mass-booking-modal">
            <div class="modal-content service-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-calendar-plus"></i> Book Mass Intention</h3>
                    <button class="modal-close" onclick="closeModal('mass-booking-modal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form class="service-form" id="mass-booking-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="mass-type">Mass Type</label>
                                <select id="mass-type" name="massType" required>
                                    <option value="">Select Mass Type</option>
                                    <option value="memorial">Memorial Mass</option>
                                    <option value="thanksgiving">Thanksgiving Mass</option>
                                    <option value="special-intention">Special Intention</option>
                                    <option value="anniversary">Anniversary Mass</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="preferred-date">Preferred Date</label>
                                <input type="date" id="preferred-date" name="preferredDate" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="intention-for">Mass Intention For</label>
                            <input type="text" id="intention-for" name="intentionFor" placeholder="Name of person" required>
                        </div>
                        <div class="form-group">
                            <label for="intention-details">Intention Details</label>
                            <textarea id="intention-details" name="intentionDetails" rows="3" placeholder="Please provide details about the mass intention"></textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="requester-name">Your Name</label>
                                <input type="text" id="requester-name" name="requesterName" required>
                            </div>
                            <div class="form-group">
                                <label for="requester-phone">Phone Number</label>
                                <input type="tel" id="requester-phone" name="requesterPhone" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="requester-email">Email Address</label>
                            <input type="email" id="requester-email" name="requesterEmail" required>
                        </div>
                        <div class="payment-info">
                            <div class="payment-summary">
                                <span>Mass Intention Fee: <strong>₦5,000</strong></span>
                            </div>
                            <p class="payment-note">
                                <i class="fas fa-info-circle"></i>
                                Payment can be made at the parish office or via bank transfer. Details will be provided after submission.
                            </p>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" onclick="closeModal('mass-booking-modal')">Cancel</button>
                            <button type="submit" class="btn-primary">Submit Request</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('mass-booking-modal').style.display = 'flex';
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('preferred-date').min = today;
    
    // Handle form submission
    document.getElementById('mass-booking-form').addEventListener('submit', function(e) {
        e.preventDefault();
        handleMassBookingSubmission(this);
    });
}

// Tithe Payment Modal
function openTitheModal() {
    const modalHTML = `
        <div class="modal-overlay" id="tithe-modal">
            <div class="modal-content service-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-hand-holding-usd"></i> Pay Tithe</h3>
                    <button class="modal-close" onclick="closeModal('tithe-modal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form class="service-form" id="tithe-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="tithe-amount">Tithe Amount (₦)</label>
                                <input type="number" id="tithe-amount" name="titheAmount" min="100" step="100" placeholder="Enter amount" required>
                            </div>
                            <div class="form-group">
                                <label for="tithe-frequency">Payment Frequency</label>
                                <select id="tithe-frequency" name="titheFrequency" required>
                                    <option value="">Select Frequency</option>
                                    <option value="one-time">One-time Payment</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="tithe-name">Full Name</label>
                                <input type="text" id="tithe-name" name="titheName" required>
                            </div>
                            <div class="form-group">
                                <label for="tithe-phone">Phone Number</label>
                                <input type="tel" id="tithe-phone" name="tithePhone" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="tithe-email">Email Address</label>
                            <input type="email" id="tithe-email" name="titheEmail" required>
                        </div>
                        <div class="payment-methods">
                            <h4>Payment Method</h4>
                            <div class="payment-options">
                                <label class="payment-option">
                                    <input type="radio" name="paymentMethod" value="bank-transfer" required>
                                    <span class="option-content">
                                        <i class="fas fa-university"></i>
                                        <span>Bank Transfer</span>
                                    </span>
                                </label>
                                <label class="payment-option">
                                    <input type="radio" name="paymentMethod" value="card" required>
                                    <span class="option-content">
                                        <i class="fas fa-credit-card"></i>
                                        <span>Debit/Credit Card</span>
                                    </span>
                                </label>
                                <label class="payment-option">
                                    <input type="radio" name="paymentMethod" value="mobile-money" required>
                                    <span class="option-content">
                                        <i class="fas fa-mobile-alt"></i>
                                        <span>Mobile Money</span>
                                    </span>
                                </label>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" onclick="closeModal('tithe-modal')">Cancel</button>
                            <button type="submit" class="btn-primary">Proceed to Payment</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('tithe-modal').style.display = 'flex';
    
    // Handle form submission
    document.getElementById('tithe-form').addEventListener('submit', function(e) {
        e.preventDefault();
        handleTitheSubmission(this);
    });
}

// Donation Modal
function openDonationModal() {
    const modalHTML = `
        <div class="modal-overlay" id="donation-modal">
            <div class="modal-content service-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-heart"></i> Donate to Poor & Needy</h3>
                    <button class="modal-close" onclick="closeModal('donation-modal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form class="service-form" id="donation-form">
                        <div class="donation-categories">
                            <h4>Select Donation Category</h4>
                            <div class="category-options">
                                <label class="category-option">
                                    <input type="radio" name="donationCategory" value="food-program" required>
                                    <span class="option-content">
                                        <i class="fas fa-bread-slice"></i>
                                        <span>Food Programs</span>
                                    </span>
                                </label>
                                <label class="category-option">
                                    <input type="radio" name="donationCategory" value="education" required>
                                    <span class="option-content">
                                        <i class="fas fa-graduation-cap"></i>
                                        <span>Education Support</span>
                                    </span>
                                </label>
                                <label class="category-option">
                                    <input type="radio" name="donationCategory" value="medical" required>
                                    <span class="option-content">
                                        <i class="fas fa-medkit"></i>
                                        <span>Medical Assistance</span>
                                    </span>
                                </label>
                                <label class="category-option">
                                    <input type="radio" name="donationCategory" value="housing" required>
                                    <span class="option-content">
                                        <i class="fas fa-home"></i>
                                        <span>Housing Aid</span>
                                    </span>
                                </label>
                                <label class="category-option">
                                    <input type="radio" name="donationCategory" value="general" required>
                                    <span class="option-content">
                                        <i class="fas fa-hand-holding-heart"></i>
                                        <span>General Fund</span>
                                    </span>
                                </label>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="donation-amount">Donation Amount (₦)</label>
                                <input type="number" id="donation-amount" name="donationAmount" min="500" step="100" placeholder="Enter amount" required>
                            </div>
                            <div class="form-group">
                                <label for="donation-frequency">Donation Type</label>
                                <select id="donation-frequency" name="donationFrequency" required>
                                    <option value="">Select Type</option>
                                    <option value="one-time">One-time Donation</option>
                                    <option value="monthly">Monthly Donation</option>
                                    <option value="quarterly">Quarterly Donation</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="donor-name">Full Name</label>
                                <input type="text" id="donor-name" name="donorName" required>
                            </div>
                            <div class="form-group">
                                <label for="donor-phone">Phone Number</label>
                                <input type="tel" id="donor-phone" name="donorPhone" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="donor-email">Email Address</label>
                            <input type="email" id="donor-email" name="donorEmail" required>
                        </div>
                        <div class="form-group">
                            <label for="donation-message">Message (Optional)</label>
                            <textarea id="donation-message" name="donationMessage" rows="3" placeholder="Any special message or dedication"></textarea>
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" name="anonymous" value="yes">
                                <span class="checkmark"></span>
                                Make this donation anonymous
                            </label>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" onclick="closeModal('donation-modal')">Cancel</button>
                            <button type="submit" class="btn-primary">Proceed to Donate</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('donation-modal').style.display = 'flex';
    
    // Handle form submission
    document.getElementById('donation-form').addEventListener('submit', function(e) {
        e.preventDefault();
        handleDonationSubmission(this);
    });
}

// Help Modal
function openHelpModal() {
    const modalHTML = `
        <div class="modal-overlay" id="help-modal">
            <div class="modal-content help-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-question-circle"></i> Need Help?</h3>
                    <button class="modal-close" onclick="closeModal('help-modal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="help-content">
                        <div class="help-section">
                            <h4><i class="fas fa-calendar-plus"></i> Mass Booking Help</h4>
                            <ul>
                                <li>Mass intentions can be booked up to 3 months in advance</li>
                                <li>Payment of ₦5,000 is required to confirm booking</li>
                                <li>You will receive confirmation within 24 hours</li>
                                <li>Changes can be made up to 48 hours before the mass</li>
                            </ul>
                        </div>
                        <div class="help-section">
                            <h4><i class="fas fa-hand-holding-usd"></i> Tithe Payment Help</h4>
                            <ul>
                                <li>Secure online payment processing</li>
                                <li>Automatic receipt generation</li>
                                <li>Option to set up recurring payments</li>
                                <li>All major payment methods accepted</li>
                            </ul>
                        </div>
                        <div class="help-section">
                            <h4><i class="fas fa-heart"></i> Donation Help</h4>
                            <ul>
                                <li>Choose specific programs to support</li>
                                <li>Option for anonymous donations</li>
                                <li>Tax-deductible receipts provided</li>
                                <li>Regular updates on fund usage</li>
                            </ul>
                        </div>
                        <div class="help-contact">
                            <h4>Still Need Help?</h4>
                            <div class="contact-options">
                                <a href="tel:+2348123456789" class="contact-option">
                                    <i class="fas fa-phone"></i>
                                    <span>Call: +234 812 345 6789</span>
                                </a>
                                <a href="mailto:office@olmqbadore.org" class="contact-option">
                                    <i class="fas fa-envelope"></i>
                                    <span>Email: office@olmqbadore.org</span>
                                </a>
                                <div class="contact-option">
                                    <i class="fas fa-clock"></i>
                                    <span>Office Hours: Mon-Fri 9AM-5PM</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('help-modal').style.display = 'flex';
}

// Form submission handlers
function handleMassBookingSubmission(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        showNotification('Mass booking request submitted successfully! You will receive confirmation within 24 hours.', 'success');
        closeModal('mass-booking-modal');
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 2000);
}

function handleTitheSubmission(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;
    
    // Simulate payment processing
    setTimeout(() => {
        showNotification('Redirecting to secure payment gateway...', 'info');
        closeModal('tithe-modal');
        
        // In a real implementation, redirect to payment gateway
        // window.location.href = 'payment-gateway-url';
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 2000);
}

function handleDonationSubmission(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;
    
    // Simulate donation processing
    setTimeout(() => {
        showNotification('Thank you for your generous donation! Redirecting to payment...', 'success');
        closeModal('donation-modal');
        
        // In a real implementation, redirect to payment gateway
        // window.location.href = 'donation-payment-url';
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 2000);
}

// Close modal function
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Show notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

