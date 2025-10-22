// Gallery Page JavaScript
class GalleryManager {
  constructor() {
    this.currentFilter = 'all';
    this.currentView = 'grid';
    this.currentSort = 'newest';
    this.loadedImages = 12;
    this.totalImages = 150;
    this.isLoading = false;
    this.searchTerm = '';
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupModals();
    this.setupImageLazyLoading();
    this.setupMasonryGrid();
    this.setupCountdownTimer();
    this.setupCalendar();
    this.updateImageCount();
  }

  setupEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleFilterChange(btn.dataset.filter);
      });
    });

    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.handleViewChange(btn.dataset.view);
      });
    });

    // Sort change
    const sortSelect = document.querySelector('#gallery-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.handleSortChange(e.target.value);
      });
    }

    // Search functionality
    const searchInput = document.querySelector('#gallery-search');
    const clearSearch = document.querySelector('.clear-search');
    
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
    }

    if (clearSearch) {
      clearSearch.addEventListener('click', () => {
        this.clearSearch();
      });
    }

    // Load more button
    const loadMoreBtn = document.querySelector('#load-more-gallery');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        this.loadMoreImages();
      });
    }

    // Upload photos button
    const uploadBtn = document.querySelector('#upload-photos-btn');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => {
        this.showUploadModal();
      });
    }

    // Gallery item clicks
    document.addEventListener('click', (e) => {
      if (e.target.closest('.view-btn[data-image]')) {
        const imageUrl = e.target.closest('.view-btn').dataset.image;
        this.openImageModal(imageUrl);
      }
    });

    // Scroll to top
    this.setupScrollToTop();
  }

  handleFilterChange(filter) {
    this.currentFilter = filter;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    // Filter gallery items
    this.filterGalleryItems();
    
    // Update URL
    this.updateURL();
  }

  handleViewChange(view) {
    this.currentView = view;
    
    // Update active view button
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    
    // Update gallery layout
    this.updateGalleryLayout();
  }

  handleSortChange(sort) {
    this.currentSort = sort;
    this.sortGalleryItems();
    this.updateURL();
  }

  handleSearch(term) {
    this.searchTerm = term.toLowerCase();
    
    // Show/hide clear button
    const clearBtn = document.querySelector('.clear-search');
    if (term.length > 0) {
      clearBtn.classList.add('show');
    } else {
      clearBtn.classList.remove('show');
    }
    
    // Filter items based on search
    this.filterGalleryItems();
  }

  clearSearch() {
    const searchInput = document.querySelector('#gallery-search');
    const clearBtn = document.querySelector('.clear-search');
    
    searchInput.value = '';
    clearBtn.classList.remove('show');
    this.searchTerm = '';
    
    this.filterGalleryItems();
  }

    filterGalleryItems() {
    const items = document.querySelectorAll('.gallery-item');
    let visibleCount = 0;
    
    items.forEach(item => {
      const category = item.dataset.category;
      const title = item.querySelector('.gallery-info h4')?.textContent.toLowerCase() || '';
      const description = item.querySelector('.gallery-info p')?.textContent.toLowerCase() || '';
      
      // Check filter match
      const filterMatch = this.currentFilter === 'all' || category === this.currentFilter;
      
      // Check search match
      const searchMatch = this.searchTerm === '' || 
        title.includes(this.searchTerm) || 
        description.includes(this.searchTerm);
      
      if (filterMatch && searchMatch) {
        item.style.display = 'block';
        item.classList.add('fade-in');
        visibleCount++;
      } else {
        item.style.display = 'none';
        item.classList.remove('fade-in');
      }
    });
    
    // Update count
    this.updateVisibleCount(visibleCount);
    
    // Show empty state if no results
    this.toggleEmptyState(visibleCount === 0);
    
    // Reinitialize masonry if needed
    if (this.currentView === 'masonry') {
      setTimeout(() => this.setupMasonryGrid(), 300);
    }
  }

  updateGalleryLayout() {
    const gallery = document.querySelector('.gallery-grid');
    
    if (this.currentView === 'masonry') {
      gallery.classList.add('masonry-grid');
      setTimeout(() => this.setupMasonryGrid(), 100);
    } else {
      gallery.classList.remove('masonry-grid');
    }
  }

  sortGalleryItems() {
    const gallery = document.querySelector('.gallery-grid');
    const items = Array.from(gallery.querySelectorAll('.gallery-item'));
    
    items.sort((a, b) => {
      const dateA = new Date(a.dataset.date || '2024-01-01');
      const dateB = new Date(b.dataset.date || '2024-01-01');
      
      switch (this.currentSort) {
        case 'newest':
          return dateB - dateA;
        case 'oldest':
          return dateA - dateB;
        case 'alphabetical':
          const titleA = a.querySelector('.gallery-info h4')?.textContent || '';
          const titleB = b.querySelector('.gallery-info h4')?.textContent || '';
          return titleA.localeCompare(titleB);
        default:
          return 0;
      }
    });
    
    // Reorder DOM elements
    items.forEach(item => gallery.appendChild(item));
    
    // Reinitialize masonry if needed
    if (this.currentView === 'masonry') {
      setTimeout(() => this.setupMasonryGrid(), 100);
    }
  }

  loadMoreImages() {
    if (this.isLoading || this.loadedImages >= this.totalImages) return;
    
    this.isLoading = true;
    const loadMoreBtn = document.querySelector('#load-more-gallery');
    const btnText = loadMoreBtn.querySelector('span');
    const btnLoader = loadMoreBtn.querySelector('.btn-loader');
    
    // Show loading state
    loadMoreBtn.disabled = true;
    btnText.style.opacity = '0';
    btnLoader.style.display = 'block';
    
    // Simulate API call
    setTimeout(() => {
      this.addNewImages();
      
      // Hide loading state
      loadMoreBtn.disabled = false;
      btnText.style.opacity = '1';
      btnLoader.style.display = 'none';
      this.isLoading = false;
      
      // Update count
      this.updateImageCount();
      
      // Hide button if all loaded
      if (this.loadedImages >= this.totalImages) {
        loadMoreBtn.style.display = 'none';
      }
    }, 1500);
  }

  addNewImages() {
    const gallery = document.querySelector('.gallery-grid');
    const categories = ['mass', 'events', 'sacraments', 'community', 'youth'];
    const imagesToAdd = 6;
    
    for (let i = 0; i < imagesToAdd; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const imageItem = this.createGalleryItem(category, this.loadedImages + i + 1);
      gallery.appendChild(imageItem);
    }
    
    this.loadedImages += imagesToAdd;
    
    // Reinitialize lazy loading for new images
    this.setupImageLazyLoading();
    
    // Reinitialize masonry if needed
    if (this.currentView === 'masonry') {
      setTimeout(() => this.setupMasonryGrid(), 100);
    }
  }

  createGalleryItem(category, index) {
    const item = document.createElement('div');
    item.className = 'gallery-item fade-in';
    item.dataset.category = category;
    item.dataset.date = this.getRandomDate();
    
    const imageUrl = `https://images.unsplash.com/photo-${1500000000000 + index}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`;
    const largeImageUrl = `https://images.unsplash.com/photo-${1500000000000 + index}?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80`;
    
    item.innerHTML = `
      <div class="gallery-image">
        <img src="${imageUrl}" alt="${this.getCategoryTitle(category)} ${index}" loading="lazy" />
        <div class="gallery-overlay">
          <div class="gallery-info">
            <h4>${this.getCategoryTitle(category)} Event ${index}</h4>
            <p>Beautiful moments from our parish community</p>
            <span class="gallery-date">
              <i class="fas fa-calendar"></i>
              ${this.formatDate(item.dataset.date)}
            </span>
          </div>
          <div class="gallery-actions">
            <button class="gallery-btn view-btn" data-image="${largeImageUrl}">
              <i class="fas fa-eye"></i>
            </button>
            <button class="gallery-btn share-btn">
              <i class="fas fa-share-alt"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    
    return item;
  }

  getCategoryTitle(category) {
    const titles = {
      mass: 'Holy Mass',
      events: 'Parish Event',
      sacraments: 'Sacrament',
      community: 'Community',
      youth: 'Youth Ministry'
    };
    return titles[category] || 'Parish';
  }

  getRandomDate() {
    const start = new Date(2024, 0, 1);
    const end = new Date();
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  updateVisibleCount(count) {
    const currentCountEl = document.querySelector('#current-count');
    if (currentCountEl) {
      currentCountEl.textContent = count;
    }
  }

  updateImageCount() {
    const currentCountEl = document.querySelector('#current-count');
    const totalCountEl = document.querySelector('#total-count');
    
    if (currentCountEl) currentCountEl.textContent = this.loadedImages;
    if (totalCountEl) totalCountEl.textContent = this.totalImages;
  }

  toggleEmptyState(show) {
    let emptyState = document.querySelector('.empty-state');
    
    if (show && !emptyState) {
      emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <div class="empty-state-icon">
          <i class="fas fa-search"></i>
        </div>
        <h3>No Photos Found</h3>
        <p>We couldn't find any photos matching your search criteria. Try adjusting your filters or search terms.</p>
        <button class="btn btn-primary" onclick="galleryManager.clearAllFilters()">
          <i class="fas fa-refresh"></i>
          <span>Clear All Filters</span>
        </button>
      `;
      
      const gallery = document.querySelector('.gallery-grid');
      gallery.parentNode.insertBefore(emptyState, gallery.nextSibling);
    } else if (!show && emptyState) {
      emptyState.remove();
    }
  }

  clearAllFilters() {
    this.currentFilter = 'all';
    this.searchTerm = '';
    
    // Reset UI
    document.querySelector('#gallery-search').value = '';
    document.querySelector('.clear-search').classList.remove('show');
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-filter="all"]').classList.add('active');
    
    this.filterGalleryItems();
    this.updateURL();
  }

  setupImageLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src || img.src;
            img.classList.remove('loading');
            observer.unobserve(img);
          }
        });
      });

      document.querySelectorAll('.gallery-image img[loading="lazy"]').forEach(img => {
        img.classList.add('loading');
        imageObserver.observe(img);
      });
    }
  }

  setupMasonryGrid() {
    // Simple masonry layout implementation
    if (this.currentView !== 'masonry') return;
    
    const gallery = document.querySelector('.gallery-grid');
    if (!gallery.classList.contains('masonry-grid')) return;
    
    const items = gallery.querySelectorAll('.gallery-item');
    const columnCount = this.getMasonryColumns();
    const columns = Array.from({ length: columnCount }, () => []);
    
    items.forEach((item, index) => {
      const shortestColumn = columns.reduce((shortest, column, i) => 
        column.length < columns[shortest].length ? i : shortest, 0);
      columns[shortestColumn].push(item);
    });
    
    // Apply column styles
    gallery.style.columnCount = columnCount;
  }

  getMasonryColumns() {
    const width = window.innerWidth;
    if (width >= 1200) return 4;
    if (width >= 992) return 3;
    if (width >= 768) return 2;
    return 1;
  }

  setupCountdownTimer() {
    const countdownEl = document.querySelector('#event-countdown');
    if (!countdownEl) return;
    
    // Set target date (next major parish event)
    const targetDate = new Date('2024-12-25T00:00:00');
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;
      
      if (distance < 0) {
        countdownEl.innerHTML = '<div class="countdown-item"><span class="countdown-number">Event</span><span class="countdown-label">Started</span></div>';
        return;
      }
      
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      countdownEl.innerHTML = `
        <div class="countdown-item">
          <span class="countdown-number">${days}</span>
          <span class="countdown-label">Days</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-number">${hours}</span>
          <span class="countdown-label">Hours</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-number">${minutes}</span>
          <span class="countdown-label">Minutes</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-number">${seconds}</span>
          <span class="countdown-label">Seconds</span>
        </div>
      `;
    };
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  setupCalendar() {
    const calendarEl = document.querySelector('.calendar-grid');
    if (!calendarEl) return;
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    this.renderCalendar(currentYear, currentMonth);
    
    // Calendar navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const direction = e.target.closest('.nav-btn').classList.contains('prev') ? -1 : 1;
        this.navigateCalendar(direction);
      });
    });
  }

  renderCalendar(year, month) {
    const calendarGrid = document.querySelector('.calendar-grid');
    const monthHeader = document.querySelector('.month-header h4');
    
    if (!calendarGrid || !monthHeader) return;
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    monthHeader.textContent = `${monthNames[month]} ${year}`;
    
    // Clear calendar
    calendarGrid.innerHTML = '';
    
    // Add day headers
    dayNames.forEach(day => {
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day header';
      dayEl.textContent = day;
      calendarGrid.appendChild(dayEl);
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day other-month';
      calendarGrid.appendChild(dayEl);
    }
    
        // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day';
      dayEl.textContent = day;
      
      // Check if today
      if (year === today.getFullYear() && 
          month === today.getMonth() && 
          day === today.getDate()) {
        dayEl.classList.add('today');
      }
      
      // Check for events
      if (this.hasEvent(year, month, day)) {
        dayEl.classList.add('has-event');
        dayEl.addEventListener('click', () => {
          this.showDayEvents(year, month, day);
        });
      }
      
      calendarGrid.appendChild(dayEl);
    }
  }

  hasEvent(year, month, day) {
    // Sample event data - in real app, this would come from API
    const events = [
      { date: '2024-12-25', title: 'Christmas Day Mass' },
      { date: '2024-12-24', title: 'Christmas Eve Service' },
      { date: '2024-12-31', title: 'New Year Eve Prayer' },
      { date: '2024-12-08', title: 'Feast of Immaculate Conception' }
    ];
    
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.some(event => event.date === dateString);
  }

  showDayEvents(year, month, day) {
    // Show events for selected day
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    console.log(`Showing events for ${dateString}`);
    // Implementation would show modal with day's events
  }

  navigateCalendar(direction) {
    // Calendar navigation logic
    const currentMonth = parseInt(document.querySelector('.calendar-grid').dataset.month || new Date().getMonth());
    const currentYear = parseInt(document.querySelector('.calendar-grid').dataset.year || new Date().getFullYear());
    
    let newMonth = currentMonth + direction;
    let newYear = currentYear;
    
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    
    document.querySelector('.calendar-grid').dataset.month = newMonth;
    document.querySelector('.calendar-grid').dataset.year = newYear;
    
    this.renderCalendar(newYear, newMonth);
  }

  setupModals() {
    this.setupUploadModal();
    this.setupImageModal();
    this.setupGuidelinesModal();
    this.setupRSVPModal();
    this.setupCalendarModal();
  }

  setupUploadModal() {
    const modal = document.querySelector('#upload-modal');
    const uploadBtn = document.querySelector('#upload-photos-btn');
    const closeBtn = modal?.querySelector('.close-modal');
    const cancelBtn = modal?.querySelector('#cancel-upload');
    
    if (!modal) return;
    
    // Show modal
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => {
        this.showUploadModal();
      });
    }
    
    // Close modal
    [closeBtn, cancelBtn].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          this.hideUploadModal();
        });
      }
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideUploadModal();
      }
    });
    
    // Setup file upload
    this.setupFileUpload();
    
    // Setup upload form
    this.setupUploadForm();
  }

  setupFileUpload() {
    const uploadZone = document.querySelector('.upload-zone');
    const fileInput = document.querySelector('#photo-files');
    const previewGrid = document.querySelector('.preview-grid');
    
    if (!uploadZone || !fileInput) return;
    
    let selectedFiles = [];
    
    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });
    
    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('dragover');
    });
    
    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      
      const files = Array.from(e.dataTransfer.files);
      this.handleFileSelection(files);
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      this.handleFileSelection(files);
    });
  }

  handleFileSelection(files) {
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isImage && isValidSize;
    });
    
    if (validFiles.length !== files.length) {
      this.showMessage('Some files were skipped. Only images under 5MB are allowed.', 'warning');
    }
    
    validFiles.forEach(file => {
      this.addFilePreview(file);
    });
    
    this.updateUploadButton();
  }

  addFilePreview(file) {
    const previewGrid = document.querySelector('.preview-grid');
    const previewSection = document.querySelector('.upload-preview');
    
    if (!previewGrid) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewItem = document.createElement('div');
      previewItem.className = 'preview-item';
      previewItem.innerHTML = `
        <img src="${e.target.result}" alt="Preview" class="preview-image" />
        <div class="preview-info">
          <div class="file-name">${file.name}</div>
          <div class="file-size">${this.formatFileSize(file.size)}</div>
        </div>
        <button type="button" class="remove-preview" data-file="${file.name}">
          <i class="fas fa-times"></i>
        </button>
      `;
      
      previewGrid.appendChild(previewItem);
      previewSection.style.display = 'block';
      
      // Remove file functionality
      previewItem.querySelector('.remove-preview').addEventListener('click', () => {
        previewItem.remove();
        if (previewGrid.children.length === 0) {
          previewSection.style.display = 'none';
        }
        this.updateUploadButton();
      });
    };
    
    reader.readAsDataURL(file);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  updateUploadButton() {
    const uploadBtn = document.querySelector('#submit-upload');
    const previewItems = document.querySelectorAll('.preview-item');
    
    if (uploadBtn) {
      uploadBtn.disabled = previewItems.length === 0;
    }
  }

  setupUploadForm() {
    const form = document.querySelector('#upload-form');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleUploadSubmit();
    });
  }

  handleUploadSubmit() {
    const form = document.querySelector('#upload-form');
    const submitBtn = document.querySelector('#submit-upload');
    const btnText = submitBtn.querySelector('span');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    
    // Show loading state
    submitBtn.disabled = true;
    btnText.style.opacity = '0';
    btnLoader.style.display = 'block';
    
    // Simulate upload
    setTimeout(() => {
      this.showMessage('Photos uploaded successfully! They will be reviewed before being published.', 'success');
      this.hideUploadModal();
      form.reset();
      document.querySelector('.upload-preview').style.display = 'none';
      document.querySelector('.preview-grid').innerHTML = '';
      
      // Reset button
      submitBtn.disabled = false;
      btnText.style.opacity = '1';
      btnLoader.style.display = 'none';
    }, 2000);
  }

  setupImageModal() {
    const modal = document.querySelector('#gallery-modal');
    if (!modal) return;
    
    const closeBtn = modal.querySelector('#close-gallery-modal');
    const prevBtn = modal.querySelector('#prev-image');
    const nextBtn = modal.querySelector('#next-image');
    const downloadBtn = modal.querySelector('#download-image');
    const shareBtn = modal.querySelector('#share-image');
    
    // Close modal
    [closeBtn].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          this.hideImageModal();
        });
      }
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
        this.hideImageModal();
      }
    });
    
    // Navigation
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.navigateImage(-1);
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.navigateImage(1);
      });
    }
    
    // Download image
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        this.downloadCurrentImage();
      });
    }
    
    // Share image
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        this.shareCurrentImage();
      });
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('show')) return;
      
      switch (e.key) {
        case 'Escape':
          this.hideImageModal();
          break;
        case 'ArrowLeft':
          this.navigateImage(-1);
          break;
        case 'ArrowRight':
          this.navigateImage(1);
          break;
      }
    });
  }

  openImageModal(imageUrl, title = '', description = '') {
    const modal = document.querySelector('#gallery-modal');
    const modalImage = document.querySelector('#modal-image');
    const modalTitle = document.querySelector('#modal-title');
    const modalDescription = document.querySelector('#modal-description');
    const imageLoader = document.querySelector('.image-loader');
    
    if (!modal || !modalImage) return;
    
    // Store current image data
    this.currentImageData = { url: imageUrl, title, description };
    
    // Show modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Show loader
    imageLoader.style.display = 'flex';
    modalImage.style.opacity = '0';
    
    // Load image
    const img = new Image();
    img.onload = () => {
      modalImage.src = imageUrl;
      modalImage.style.opacity = '1';
      imageLoader.style.display = 'none';
    };
    img.onerror = () => {
      imageLoader.innerHTML = '<div class="error-message">Failed to load image</div>';
    };
    img.src = imageUrl;
    
    // Update info
    if (modalTitle) modalTitle.textContent = title;
    if (modalDescription) modalDescription.textContent = description;
  }

  hideImageModal() {
    const modal = document.querySelector('#gallery-modal');
    if (!modal) return;
    
    modal.classList.remove('show');
    document.body.style.overflow = '';
    
    // Reset image
    setTimeout(() => {
      const modalImage = document.querySelector('#modal-image');
      if (modalImage) modalImage.src = '';
    }, 300);
  }

  navigateImage(direction) {
    // Get all visible gallery items
    const visibleItems = Array.from(document.querySelectorAll('.gallery-item'))
      .filter(item => item.style.display !== 'none');
    
    if (visibleItems.length === 0) return;
    
    // Find current image index
    const currentUrl = this.currentImageData?.url;
    const currentIndex = visibleItems.findIndex(item => {
      const viewBtn = item.querySelector('.view-btn[data-image]');
      return viewBtn && viewBtn.dataset.image === currentUrl;
    });
    
    if (currentIndex === -1) return;
    
    // Calculate new index
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = visibleItems.length - 1;
    if (newIndex >= visibleItems.length) newIndex = 0;
    
    // Get new image data
    const newItem = visibleItems[newIndex];
    const viewBtn = newItem.querySelector('.view-btn[data-image]');
    const title = newItem.querySelector('.gallery-info h4')?.textContent || '';
    const description = newItem.querySelector('.gallery-info p')?.textContent || '';
    
    if (viewBtn) {
      this.openImageModal(viewBtn.dataset.image, title, description);
    }
  }

  downloadCurrentImage() {
    if (!this.currentImageData?.url) return;
    
    const link = document.createElement('a');
    link.href = this.currentImageData.url;
    link.download = `olmq-gallery-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.showMessage('Image download started', 'success');
  }

  shareCurrentImage() {
    if (!this.currentImageData?.url) return;
    
    if (navigator.share) {
      navigator.share({
        title: this.currentImageData.title || 'OLMQ Gallery Image',
        text: this.currentImageData.description || 'Check out this photo from Our Lady Mother and Queen Parish',
        url: window.location.href
      }).catch(console.error);
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.showMessage('Image URL copied to clipboard', 'success');
      }).catch(() => {
        this.showMessage('Unable to share image', 'error');
      });
    }
  }

    setupGuidelinesModal() {
    const modal = document.querySelector('#guidelines-modal');
    const guidelinesBtn = document.querySelector('#view-guidelines-btn');
    const closeBtn = modal?.querySelector('.close-modal');
    
    if (!modal) return;
    
    if (guidelinesBtn) {
      guidelinesBtn.addEventListener('click', () => {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
      });
    }
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        document.body.style.overflow = '';
      });
    }
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
      }
    });
  }

  setupRSVPModal() {
    const modal = document.querySelector('#rsvp-modal');
    const rsvpBtns = document.querySelectorAll('.rsvp-btn');
    const closeBtn = modal?.querySelector('.close-modal');
    const cancelBtn = modal?.querySelector('#cancel-rsvp');
    const form = modal?.querySelector('#rsvp-form');
    
    if (!modal) return;
    
    // Show modal
    rsvpBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const eventTitle = btn.closest('.event-card')?.querySelector('h4')?.textContent || 'Parish Event';
        modal.querySelector('#event-title').textContent = eventTitle;
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
      });
    });
    
    // Close modal
    [closeBtn, cancelBtn].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          modal.classList.remove('show');
          document.body.style.overflow = '';
        });
      }
    });
    
    // Handle form submission
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleRSVPSubmit();
      });
    }
  }

  handleRSVPSubmit() {
    const form = document.querySelector('#rsvp-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('span');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    
    // Show loading state
    submitBtn.disabled = true;
    btnText.style.opacity = '0';
    btnLoader.style.display = 'block';
    
    // Simulate API call
    setTimeout(() => {
      this.showMessage('RSVP submitted successfully! We look forward to seeing you at the event.', 'success');
      
      // Close modal and reset form
      document.querySelector('#rsvp-modal').classList.remove('show');
      document.body.style.overflow = '';
      form.reset();
      
      // Reset button
      submitBtn.disabled = false;
      btnText.style.opacity = '1';
      btnLoader.style.display = 'none';
    }, 1500);
  }

  setupCalendarModal() {
    const modal = document.querySelector('#calendar-modal');
    const calendarBtn = document.querySelector('#view-calendar-btn');
    const closeBtn = modal?.querySelector('.close-modal');
    
    if (!modal) return;
    
    if (calendarBtn) {
      calendarBtn.addEventListener('click', () => {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Initialize calendar if not already done
        if (!modal.querySelector('.calendar-grid').hasChildNodes()) {
          this.initializeModalCalendar();
        }
      });
    }
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        document.body.style.overflow = '';
      });
    }
  }

  initializeModalCalendar() {
    const today = new Date();
    this.renderModalCalendar(today.getFullYear(), today.getMonth());
  }

  renderModalCalendar(year, month) {
    // Similar to main calendar but for modal
    const calendarGrid = document.querySelector('#calendar-modal .calendar-grid');
    if (!calendarGrid) return;
    
    // Implementation similar to main calendar
    this.renderCalendar(year, month);
  }

  showUploadModal() {
    const modal = document.querySelector('#upload-modal');
    if (!modal) return;
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  hideUploadModal() {
    const modal = document.querySelector('#upload-modal');
    if (!modal) return;
    
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }

  setupScrollToTop() {
    const scrollBtn = document.createElement('button');
    scrollBtn.className = 'scroll-to-top';
    scrollBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    scrollBtn.setAttribute('aria-label', 'Scroll to top');
    document.body.appendChild(scrollBtn);
    
    // Show/hide based on scroll position
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        scrollBtn.classList.add('show');
      } else {
        scrollBtn.classList.remove('show');
      }
    });
    
    // Scroll to top on click
    scrollBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  updateURL() {
    const params = new URLSearchParams();
    
    if (this.currentFilter !== 'all') {
      params.set('filter', this.currentFilter);
    }
    
    if (this.currentSort !== 'newest') {
      params.set('sort', this.currentSort);
    }
    
    if (this.searchTerm) {
      params.set('search', this.searchTerm);
    }
    
    const newURL = params.toString() ? 
      `${window.location.pathname}?${params.toString()}` : 
      window.location.pathname;
    
    window.history.replaceState({}, '', newURL);
  }

  loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    
    // Load filter
    const filter = params.get('filter');
    if (filter && filter !== 'all') {
      this.handleFilterChange(filter);
    }
    
    // Load sort
    const sort = params.get('sort');
    if (sort && sort !== 'newest') {
      document.querySelector('#gallery-sort').value = sort;
      this.handleSortChange(sort);
    }
    
    // Load search
    const search = params.get('search');
    if (search) {
      document.querySelector('#gallery-search').value = search;
      this.handleSearch(search);
    }
  }

  showMessage(message, type = 'info') {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}-message`;
    messageEl.innerHTML = `
      <i class="fas fa-${this.getMessageIcon(type)}"></i>
      <span>${message}</span>
      <button class="close-message">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    // Add to page
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(messageEl, container.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      messageEl.remove();
    }, 5000);
    
    // Manual close
    messageEl.querySelector('.close-message').addEventListener('click', () => {
      messageEl.remove();
    });
  }

  getMessageIcon(type) {
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  }

  // Utility method to handle responsive behavior
  handleResize() {
    // Reinitialize masonry on resize
    if (this.currentView === 'masonry') {
      setTimeout(() => this.setupMasonryGrid(), 100);
    }
  }

  // Initialize gallery from URL parameters on page load
  initializeFromURL() {
    this.loadFromURL();
  }
}

// Initialize gallery when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.galleryManager = new GalleryManager();
  
  // Handle window resize
  window.addEventListener('resize', () => {
    window.galleryManager.handleResize();
  });
  
  // Initialize AOS (Animate On Scroll)
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
      offset: 100
    });
  }
});

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
  if (window.galleryManager) {
    window.galleryManager.initializeFromURL();
  }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GalleryManager;
}
