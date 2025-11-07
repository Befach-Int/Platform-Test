/**
 * Mobile Navigation Utility
 * Handles hamburger menu, touch gestures, and mobile-specific interactions
 */

const mobileNav = {
    /**
     * Configuration
     */
    config: {
        breakpoint: 768,
        swipeThreshold: 50,
        swipeVelocity: 0.3
    },

    /**
     * State
     */
    state: {
        isOpen: false,
        isMobile: false,
        touchStartX: 0,
        touchStartY: 0,
        touchCurrentX: 0,
        touchCurrentY: 0,
        isSearchOpen: false
    },

    /**
     * Initialize mobile navigation
     */
    initialize() {
        this.createMobileNavigation();
        this.setupEventListeners();
        this.checkViewport();

        // Check viewport on resize
        window.addEventListener('resize', () => this.checkViewport());
    },

    /**
     * Check if we're on mobile viewport
     */
    checkViewport() {
        const wasMobile = this.state.isMobile;
        this.state.isMobile = window.innerWidth <= this.config.breakpoint;

        // Close menu if switching to desktop
        if (wasMobile && !this.state.isMobile && this.state.isOpen) {
            this.closeMenu();
        }
    },

    /**
     * Create mobile navigation elements
     */
    createMobileNavigation() {
        // Create hamburger button
        const hamburgerButton = document.createElement('button');
        hamburgerButton.className = 'mobile-menu-toggle';
        hamburgerButton.id = 'mobileMenuToggle';
        hamburgerButton.setAttribute('aria-label', 'Toggle navigation menu');
        hamburgerButton.setAttribute('aria-expanded', 'false');
        hamburgerButton.innerHTML = `
            <div class="hamburger-icon">
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
            </div>
        `;

        // Insert into header
        const header = document.querySelector('.header');
        if (header) {
            header.insertBefore(hamburgerButton, header.firstChild);
        }

        // Create navigation panel
        const navPanel = document.createElement('div');
        navPanel.className = 'mobile-nav-panel';
        navPanel.id = 'mobileNavPanel';
        navPanel.setAttribute('role', 'navigation');
        navPanel.setAttribute('aria-label', 'Mobile navigation');
        navPanel.innerHTML = this.buildNavPanelContent();

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'mobile-nav-overlay';
        overlay.id = 'mobileNavOverlay';

        // Append to body
        document.body.appendChild(navPanel);
        document.body.appendChild(overlay);

        // Create mobile search
        this.createMobileSearch();
    },

    /**
     * Build navigation panel content
     */
    buildNavPanelContent() {
        return `
            <div class="mobile-nav-header">
                <div class="mobile-nav-title">🚀 Menu</div>
                <button class="mobile-nav-close" id="mobileNavClose" aria-label="Close menu">
                    ✕
                </button>
            </div>

            <div class="mobile-nav-body">
                <!-- Workspace Selector -->
                <div class="mobile-workspace-selector" id="mobileWorkspaceSelector">
                    <div class="mobile-workspace-current" onclick="mobileNav.showWorkspaceMenu()">
                        <div class="mobile-workspace-icon">🌟</div>
                        <div class="mobile-workspace-info">
                            <div class="mobile-workspace-name">Current Workspace</div>
                            <div class="mobile-workspace-count">0 features</div>
                        </div>
                        <div class="mobile-workspace-arrow">›</div>
                    </div>
                </div>

                <!-- Navigation Sections -->
                <div class="mobile-nav-section">
                    <div class="mobile-nav-section-title">Views</div>
                    <button class="mobile-nav-item active" onclick="mobileNav.navigateTo('table-view')">
                        <span class="mobile-nav-icon">📋</span>
                        <span class="mobile-nav-label">Table View</span>
                    </button>
                    <button class="mobile-nav-item" onclick="mobileNav.navigateTo('graph-view')">
                        <span class="mobile-nav-icon">🕸️</span>
                        <span class="mobile-nav-label">Graph View</span>
                    </button>
                    <button class="mobile-nav-item" onclick="mobileNav.navigateTo('insights')">
                        <span class="mobile-nav-icon">💡</span>
                        <span class="mobile-nav-label">Insights</span>
                    </button>
                </div>

                <div class="mobile-nav-section">
                    <div class="mobile-nav-section-title">Actions</div>
                    <button class="mobile-nav-item" onclick="mobileNav.createFeature()">
                        <span class="mobile-nav-icon">➕</span>
                        <span class="mobile-nav-label">New Feature</span>
                    </button>
                    <button class="mobile-nav-item" onclick="mobileNav.showFilters()">
                        <span class="mobile-nav-icon">🔍</span>
                        <span class="mobile-nav-label">Filters</span>
                    </button>
                    <button class="mobile-nav-item" onclick="mobileNav.showSort()">
                        <span class="mobile-nav-icon">⬆️</span>
                        <span class="mobile-nav-label">Sort</span>
                    </button>
                </div>

                <div class="mobile-nav-section">
                    <div class="mobile-nav-section-title">Tools</div>
                    <button class="mobile-nav-item" onclick="mobileNav.exportData()">
                        <span class="mobile-nav-icon">💾</span>
                        <span class="mobile-nav-label">Export Data</span>
                    </button>
                    <button class="mobile-nav-item" onclick="mobileNav.importData()">
                        <span class="mobile-nav-icon">📥</span>
                        <span class="mobile-nav-label">Import Data</span>
                    </button>
                    <button class="mobile-nav-item" onclick="mobileNav.showSettings()">
                        <span class="mobile-nav-icon">⚙️</span>
                        <span class="mobile-nav-label">Settings</span>
                    </button>
                </div>

                <div class="mobile-nav-section">
                    <div class="mobile-nav-section-title">AI Assistant</div>
                    <button class="mobile-nav-item" onclick="mobileNav.openChat()">
                        <span class="mobile-nav-icon">🤖</span>
                        <span class="mobile-nav-label">Chat with AI</span>
                    </button>
                    <button class="mobile-nav-item" onclick="mobileNav.showAIOpportunities()">
                        <span class="mobile-nav-icon">✨</span>
                        <span class="mobile-nav-label">AI Suggestions</span>
                        <span class="mobile-nav-badge">3</span>
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Create mobile search panel
     */
    createMobileSearch() {
        // Add search toggle button to header
        const searchToggle = document.createElement('button');
        searchToggle.className = 'mobile-search-toggle';
        searchToggle.id = 'mobileSearchToggle';
        searchToggle.setAttribute('aria-label', 'Toggle search');
        searchToggle.innerHTML = '🔍';

        const headerRight = document.querySelector('.header-right');
        if (headerRight) {
            headerRight.insertBefore(searchToggle, headerRight.firstChild);
        }

        // Create search panel
        const searchPanel = document.createElement('div');
        searchPanel.className = 'mobile-search-panel';
        searchPanel.id = 'mobileSearchPanel';
        searchPanel.innerHTML = `
            <input
                type="text"
                class="mobile-search-input"
                id="mobileSearchInput"
                placeholder="Search features..."
                autocomplete="off"
            >
        `;

        document.body.appendChild(searchPanel);
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Hamburger toggle
        const toggleButton = document.getElementById('mobileMenuToggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.toggleMenu());
        }

        // Close button
        const closeButton = document.getElementById('mobileNavClose');
        if (closeButton) {
            closeButton.addEventListener('click', () => this.closeMenu());
        }

        // Overlay click
        const overlay = document.getElementById('mobileNavOverlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.closeMenu());
        }

        // Search toggle
        const searchToggle = document.getElementById('mobileSearchToggle');
        if (searchToggle) {
            searchToggle.addEventListener('click', () => this.toggleSearch());
        }

        // Search input
        const searchInput = document.getElementById('mobileSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                if (typeof app !== 'undefined' && app.applyFilters) {
                    // Update main search input
                    const mainSearch = document.getElementById('searchInput');
                    if (mainSearch) {
                        mainSearch.value = e.target.value;
                    }
                    app.applyFilters();
                }
            });
        }

        // Touch gestures
        this.setupTouchGestures();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape to close
            if (e.key === 'Escape' && this.state.isOpen) {
                this.closeMenu();
            }
        });
    },

    /**
     * Setup touch gestures for swipe
     */
    setupTouchGestures() {
        const panel = document.getElementById('mobileNavPanel');
        if (!panel) return;

        // Swipe to close
        panel.addEventListener('touchstart', (e) => {
            this.state.touchStartX = e.touches[0].clientX;
            this.state.touchStartY = e.touches[0].clientY;
        }, { passive: true });

        panel.addEventListener('touchmove', (e) => {
            if (!this.state.isOpen) return;

            this.state.touchCurrentX = e.touches[0].clientX;
            this.state.touchCurrentY = e.touches[0].clientY;

            const deltaX = this.state.touchCurrentX - this.state.touchStartX;
            const deltaY = Math.abs(this.state.touchCurrentY - this.state.touchStartY);

            // Only swipe if mostly horizontal
            if (deltaY < 50 && deltaX < 0) {
                panel.style.transform = `translateX(${deltaX}px)`;
            }
        }, { passive: true });

        panel.addEventListener('touchend', () => {
            if (!this.state.isOpen) return;

            const deltaX = this.state.touchCurrentX - this.state.touchStartX;
            const velocity = Math.abs(deltaX) / 100;

            // Close if swiped far enough or fast enough
            if (deltaX < -this.config.swipeThreshold || velocity > this.config.swipeVelocity) {
                this.closeMenu();
            } else {
                // Reset position
                panel.style.transform = '';
            }
        }, { passive: true });

        // Swipe from edge to open
        document.addEventListener('touchstart', (e) => {
            if (this.state.isOpen) return;
            if (e.touches[0].clientX < 20) {
                this.state.touchStartX = e.touches[0].clientX;
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (this.state.isOpen) return;
            if (e.changedTouches[0].clientX - this.state.touchStartX > this.config.swipeThreshold) {
                this.openMenu();
            }
        }, { passive: true });
    },

    /**
     * Toggle menu open/closed
     */
    toggleMenu() {
        if (this.state.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    },

    /**
     * Open menu
     */
    openMenu() {
        this.state.isOpen = true;

        const panel = document.getElementById('mobileNavPanel');
        const overlay = document.getElementById('mobileNavOverlay');
        const toggle = document.getElementById('mobileMenuToggle');

        if (panel) panel.classList.add('open');
        if (overlay) overlay.classList.add('visible');
        if (toggle) {
            toggle.classList.add('active');
            toggle.setAttribute('aria-expanded', 'true');
        }

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Update workspace display
        this.updateMobileWorkspaceDisplay();
    },

    /**
     * Close menu
     */
    closeMenu() {
        this.state.isOpen = false;

        const panel = document.getElementById('mobileNavPanel');
        const overlay = document.getElementById('mobileNavOverlay');
        const toggle = document.getElementById('mobileMenuToggle');

        if (panel) {
            panel.classList.remove('open');
            panel.style.transform = ''; // Reset any transform from gestures
        }
        if (overlay) overlay.classList.remove('visible');
        if (toggle) {
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
        }

        // Restore body scroll
        document.body.style.overflow = '';
    },

    /**
     * Toggle mobile search
     */
    toggleSearch() {
        this.state.isSearchOpen = !this.state.isSearchOpen;

        const searchPanel = document.getElementById('mobileSearchPanel');
        const searchInput = document.getElementById('mobileSearchInput');

        if (searchPanel) {
            searchPanel.classList.toggle('open', this.state.isSearchOpen);
        }

        if (this.state.isSearchOpen && searchInput) {
            setTimeout(() => searchInput.focus(), 100);
        }
    },

    /**
     * Update mobile workspace display
     */
    updateMobileWorkspaceDisplay() {
        if (typeof app === 'undefined') return;

        const currentWorkspace = app.workspaces.find(w => w.id === app.currentWorkspaceId);
        if (!currentWorkspace) return;

        const featureCount = app.features.filter(f => f.workspaceId === app.currentWorkspaceId).length;

        const container = document.querySelector('.mobile-workspace-current');
        if (container) {
            container.innerHTML = `
                <div class="mobile-workspace-icon" style="background: ${currentWorkspace.color || '#667eea'}20;">
                    ${currentWorkspace.icon || '🌟'}
                </div>
                <div class="mobile-workspace-info">
                    <div class="mobile-workspace-name">${currentWorkspace.name}</div>
                    <div class="mobile-workspace-count">${featureCount} feature${featureCount !== 1 ? 's' : ''}</div>
                </div>
                <div class="mobile-workspace-arrow">›</div>
            `;
        }
    },

    /**
     * Navigation actions
     */
    navigateTo(view) {
        this.closeMenu();
        // Implement view switching logic here
        console.log(`Navigate to: ${view}`);
    },

    createFeature() {
        this.closeMenu();
        if (typeof detailView !== 'undefined') {
            detailView.createNewFeature();
        }
    },

    showFilters() {
        this.closeMenu();
        // Show filter panel
        console.log('Show filters');
    },

    showSort() {
        this.closeMenu();
        // Show sort options
        console.log('Show sort options');
    },

    exportData() {
        this.closeMenu();
        if (typeof app !== 'undefined') {
            app.exportAllData();
        }
    },

    importData() {
        this.closeMenu();
        if (typeof app !== 'undefined') {
            app.importAllData();
        }
    },

    showSettings() {
        this.closeMenu();
        if (typeof settingsManager !== 'undefined') {
            settingsManager.openApiSettings();
        }
    },

    showWorkspaceMenu() {
        this.closeMenu();
        if (typeof workspaceManager !== 'undefined') {
            workspaceManager.openManageModal();
        }
    },

    openChat() {
        this.closeMenu();
        // Open AI chat panel
        console.log('Open AI chat');
    },

    showAIOpportunities() {
        this.closeMenu();
        // Show AI enhancement opportunities
        console.log('Show AI opportunities');
    }
};

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mobileNav.initialize());
} else {
    mobileNav.initialize();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = mobileNav;
}
