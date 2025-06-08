/**
 * Navigation System
 * Handles page navigation and shared functionality
 */

class NavigationManager {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.init();
    }

    /**
     * Initialize navigation
     */
    init() {
        this.setupNavigationListeners();
        this.updateActiveNavigation();
    }

    /**
     * Get current page from URL
     */
    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('settings.html')) return 'settings';
        if (path.includes('todos.html')) return 'todos';
        return 'schedule';
    }

    /**
     * Set up navigation event listeners
     */
    setupNavigationListeners() {
        const navButtons = document.querySelectorAll('.nav-btn');

        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = button.dataset.page;
                this.navigateToPage(targetPage);
            });
        });
    }

    /**
     * Navigate to a specific page
     */
    navigateToPage(page) {
        let targetUrl;

        switch (page) {
            case 'schedule':
                targetUrl = 'index.html';
                break;
            case 'settings':
                targetUrl = 'settings.html';
                break;
            case 'todos':
                targetUrl = 'todos.html';
                break;
            default:
                targetUrl = 'index.html';
        }

        window.location.href = targetUrl;
    }

    /**
     * Update active navigation state
     */
    updateActiveNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');

        navButtons.forEach(button => {
            button.classList.remove('active');
            if (button.dataset.page === this.currentPage) {
                button.classList.add('active');
            }
        });
    }

    /**
     * Get shared preferences for cross-page consistency
     */
    static getSharedPreferences() {
        return {
            language: localStorage.getItem('work-schedule-lang') || 'en',
            theme: localStorage.getItem('work-schedule-theme') || 'light',
            member: localStorage.getItem('work-schedule-member') || 'Pringlessman'
        };
    }

    /**
     * Set shared preferences
     */
    static setSharedPreferences(prefs) {
        if (prefs.language) localStorage.setItem('work-schedule-lang', prefs.language);
        if (prefs.theme) localStorage.setItem('work-schedule-theme', prefs.theme);
        if (prefs.member) localStorage.setItem('work-schedule-member', prefs.member);
    }

    /**
     * Apply theme from preferences
     */
    static applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
        }
    }

    /**
     * Apply language from preferences
     */
    static applyLanguage(language) {
        const langButtons = document.querySelectorAll('.lang-btn');
        langButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.lang === language) {
                btn.classList.add('active');
            }
        });
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Apply saved preferences immediately
    const prefs = NavigationManager.getSharedPreferences();
    NavigationManager.applyTheme(prefs.theme);
    NavigationManager.applyLanguage(prefs.language);

    // Initialize navigation
    new NavigationManager();
});

// Export for use in other modules
window.NavigationManager = NavigationManager;