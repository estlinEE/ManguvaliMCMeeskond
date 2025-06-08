/**
 * Work Schedule Application
 * Main JavaScript file handling UI interactions and data management
 */

class WorkScheduleApp {
    constructor() {
        this.currentLanguage = 'en';
        this.currentTheme = 'light';
        this.selectedMember = 'Pringlessman';
        this.currentDate = new Date();
        this.daysToShow = 14; // Start with 2 weeks
        this.schedules = [];
        this.subscription = null;

        // Enhanced translation object
        this.translations = {
            en: {
                'page-title': 'Work Schedule',
                'team-title': 'Team Members',
                'quick-add-title': 'Quick Add Today',
                'bulk-add-title': 'Bulk Add',
                'custom-add-title': 'Custom Add',
                'calendar-title': 'Work Schedule',
                'morning-text': 'Morning',
                'afternoon-text': 'Afternoon',
                'evening-text': 'Evening',
                'full-day-text': 'Full Day',
                'night-text': 'Night',
                'full-week-text': 'Full Week',
                '5-mornings-text': '5 Mornings',
                'loading-text': 'Loading...',
                'load-more-text': 'Load More Days',
                'add-button-text': 'Add',
                'select-day-option': 'Select Day',
                'morning-option': 'Morning',
                'afternoon-option': 'Afternoon',
                'evening-option': 'Evening',
                'full-day-option': 'Full Day',
                'night-option': 'Night',
                'nav-schedule-text': 'Schedule',
                'nav-todos-text': 'Todos',
                'nav-settings-text': 'Settings',
                'available': 'Available',
                'busy': 'Busy',
                'partial': 'Partial',
                'today': 'Today',
                'tomorrow': 'Tomorrow',
                'yesterday': 'Yesterday',
                'monday': 'Monday',
                'tuesday': 'Tuesday',
                'wednesday': 'Wednesday',
                'thursday': 'Thursday',
                'friday': 'Friday',
                'saturday': 'Saturday',
                'sunday': 'Sunday',
                'no-schedules': 'No schedules',
                'error-occurred': 'An error occurred',
                'delete-confirm': 'Are you sure you want to delete this schedule?',
                'success-added': 'Schedule added successfully',
                'success-deleted': 'Schedule deleted successfully',
                'error-add-failed': 'Failed to add schedule',
                'error-delete-failed': 'Failed to delete schedule',
                'error-load-failed': 'Failed to load schedules',
                'connection-error': 'Connection error. Please check your internet.'
            },
            et: {
                'page-title': 'Töögraafik',
                'team-title': 'Meeskonna Liikmed',
                'quick-add-title': 'Kiire Lisamine Täna',
                'bulk-add-title': 'Hulgi Lisamine',
                'custom-add-title': 'Kohandatud Lisamine',
                'calendar-title': 'Töögraafik',
                'morning-text': 'Hommik',
                'afternoon-text': 'Pärastlõuna',
                'evening-text': 'Õhtu',
                'full-day-text': 'Täispäev',
                'night-text': 'Öö',
                'full-week-text': 'Terve Nädal',
                '5-mornings-text': '5 Hommikut',
                'loading-text': 'Laadimine...',
                'load-more-text': 'Laadi Rohkem Päevi',
                'add-button-text': 'Lisa',
                'select-day-option': 'Vali Päev',
                'morning-option': 'Hommik',
                'afternoon-option': 'Pärastlõuna',
                'evening-option': 'Õhtu',
                'full-day-option': 'Täispäev',
                'night-option': 'Öö',
                'nav-schedule-text': 'Graafik',
                'nav-todos-text': 'Ülesanded',
                'nav-settings-text': 'Seaded',
                'available': 'Saadaval',
                'busy': 'Hõivatud',
                'partial': 'Osaliselt',
                'today': 'Täna',
                'tomorrow': 'Homme',
                'yesterday': 'Eile',
                'monday': 'Esmaspäev',
                'tuesday': 'Teisipäev',
                'wednesday': 'Kolmapäev',
                'thursday': 'Neljapäev',
                'friday': 'Reede',
                'saturday': 'Laupäev',
                'sunday': 'Pühapäev',
                'no-schedules': 'Graafikuid pole',
                'error-occurred': 'Ilmnes viga',
                'delete-confirm': 'Kas olete kindel, et soovite selle graafiku kustutada?',
                'success-added': 'Graafik lisatud edukalt',
                'success-deleted': 'Graafik kustutatud edukalt',
                'error-add-failed': 'Graafiku lisamine ebaõnnestus',
                'error-delete-failed': 'Graafiku kustutamine ebaõnnestus',
                'error-load-failed': 'Graafikute laadimine ebaõnnestus',
                'connection-error': 'Ühenduse viga. Palun kontrollige internetiühendust.'
            }
        };

        // Initialize the application
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Starting app initialization...');
            this.showLoading(true);

            // Load saved preferences
            console.log('Loading preferences...');
            this.loadPreferences();

            // Initialize Supabase first
            console.log('Initializing Supabase...');
            await window.supabaseClient.initialize();

            // Load data
            console.log('Loading data...');
            await this.loadSchedules();
            await this.loadUserProfiles();

            // Initial render
            console.log('Rendering UI...');
            this.updateTranslations();
            this.renderCalendar();
            this.populateCustomDaySelector();

            // Set up event listeners after rendering
            console.log('Setting up event listeners...');
            this.setupEventListeners();

            // Set up real-time subscription
            console.log('Setting up real-time subscription...');
            this.setupRealtimeSubscription();

            // Set up automatic date checking every minute
            setInterval(() => this.updateTodayIfNeeded(), 60000);

            // Clean up subscription when page unloads
            window.addEventListener('beforeunload', () => {
                if (this.subscription) {
                    this.subscription.unsubscribe();
                    this.subscription = null;
                }
            });

            this.showLoading(false);
            console.log('App initialization completed successfully');
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Failed to initialize application. Please check your connection and try again.');
            this.showLoading(false);
        }
    }

    /**
     * Set up event listeners for UI interactions
     */
    setupEventListeners() {
        try {
            // Language switcher
            const langEt = document.getElementById('lang-et');
            const langEn = document.getElementById('lang-en');
            if (langEt) langEt.addEventListener('click', () => this.setLanguage('et'));
            if (langEn) langEn.addEventListener('click', () => this.setLanguage('en'));

            // Theme toggle
            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle) themeToggle.addEventListener('click', () => this.toggleTheme());

            // Member selection
            const members = document.querySelectorAll('.member');
            if (members && members.length > 0) {
                members.forEach(member => {
                    if (member) {
                        member.addEventListener('click', (e) => {
                            const memberName = e.currentTarget.dataset.member;
                            if (memberName) this.selectMember(memberName);
                        });
                    }
                });
            }

            // Quick add buttons
            const slotBtns = document.querySelectorAll('.slot-btn');
            if (slotBtns && slotBtns.length > 0) {
                slotBtns.forEach(btn => {
                    if (btn) {
                        btn.addEventListener('click', (e) => {
                            const timeSlot = e.currentTarget.dataset.slot;
                            if (timeSlot) this.addTodaySchedule(timeSlot);
                        });
                    }
                });
            }

            // Custom add functionality
            const customAddBtn = document.getElementById('custom-add-btn');
            if (customAddBtn) {
                customAddBtn.addEventListener('click', () => this.addCustomSchedule());
            }

            // Load more functionality
            const loadMoreBtn = document.getElementById('load-more-btn');
            if (loadMoreBtn) {
                loadMoreBtn.addEventListener('click', () => this.loadMoreDays());
            }

            // Error toast close
            const closeErrorBtn = document.getElementById('close-error');
            if (closeErrorBtn) {
                closeErrorBtn.addEventListener('click', () => this.hideError());
            }

            console.log('Event listeners setup completed successfully');
        } catch (error) {
            console.error('Error setting up event listeners:', error);
            // Don't throw the error, just log it and continue
        }
    }

    /**
     * Set up real-time subscription for data changes
     */
    setupRealtimeSubscription() {
        // Check if subscription already exists to prevent multiple subscriptions
        if (this.subscription) {
            console.log('Real-time subscription already exists');
            return;
        }
        
        try {
            this.subscription = window.supabaseClient.subscribeToChanges(() => {
                // Reload schedules when changes occur
                this.loadSchedules();
            });
        } catch (error) {
            console.log('Real-time subscription setup skipped:', error.message);
        }
    }

    /**
     * Load user preferences from localStorage
     */
    loadPreferences() {
        const savedLang = localStorage.getItem('work-schedule-lang');
        const savedTheme = localStorage.getItem('work-schedule-theme');
        const savedMember = localStorage.getItem('work-schedule-member');

        if (savedLang) this.setLanguage(savedLang);
        if (savedTheme) this.setTheme(savedTheme);
        if (savedMember) this.selectMember(savedMember);
    }

    /**
     * Save user preferences to localStorage
     */
    savePreferences() {
        localStorage.setItem('work-schedule-lang', this.currentLanguage);
        localStorage.setItem('work-schedule-theme', this.currentTheme);
        localStorage.setItem('work-schedule-member', this.selectedMember);
    }

    /**
     * Set application language
     */
    setLanguage(lang) {
        this.currentLanguage = lang;

        // Update language button states
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`lang-${lang}`).classList.add('active');

        this.updateTranslations();
        this.renderCalendar();
        this.savePreferences();
    }

    /**
     * Update UI text with current language translations
     */
    updateTranslations() {
        const translations = this.translations[this.currentLanguage];

        Object.keys(translations).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = translations[key];
            }
        });
    }

    /**
     * Toggle between themes
     */
    toggleTheme() {
        const themes = ['light', 'dark', 'strawberry', 'sun', 'lightsea'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.setTheme(themes[nextIndex]);
    }

    /**
     * Set application theme
     */
    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);

        const themeIcon = document.getElementById('theme-icon');
        themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';

        this.savePreferences();
    }

    /**
     * Select a team member
     */
    async selectMember(memberName) {
        this.selectedMember = memberName;

        // Update UI selection state
        document.querySelectorAll('.member').forEach(member => {
            member.classList.remove('selected');
        });
        document.querySelector(`[data-member="${memberName}"]`).classList.add('selected');

        // Load user's preferred theme and language
        try {
            // First try to get from localStorage for faster response
            const localProfiles = JSON.parse(localStorage.getItem('user_profiles') || '[]');
            const localProfile = localProfiles.find(p => p.member_name === memberName);
            
            if (localProfile) {
                if (localProfile.theme_preference) {
                    console.log(`Applying ${memberName}'s saved theme:`, localProfile.theme_preference);
                    this.setTheme(localProfile.theme_preference);
                }
                if (localProfile.language_preference) {
                    console.log(`Applying ${memberName}'s saved language:`, localProfile.language_preference);
                    this.setLanguage(localProfile.language_preference);
                }
            }

            // Background sync with Supabase - only update if user hasn't changed settings recently
            const userProfile = await window.supabaseClient.getUserProfile(memberName);
            if (userProfile) {
                // Only sync from Supabase if local profile doesn't exist or is outdated
                if (!localProfile) {
                    if (userProfile.theme_preference && userProfile.theme_preference !== this.currentTheme) {
                        console.log(`Updating ${memberName}'s theme from Supabase:`, userProfile.theme_preference);
                        this.setTheme(userProfile.theme_preference);
                    }
                    if (userProfile.language_preference && userProfile.language_preference !== this.currentLanguage) {
                        console.log(`Updating ${memberName}'s language from Supabase:`, userProfile.language_preference);
                        this.setLanguage(userProfile.language_preference);
                    }
                }
            }
        } catch (error) {
            console.log('Using default preferences for user:', error.message);
        }

        this.savePreferences();
    }

    /**
     * Load user profiles and update avatars
     */
    async loadUserProfiles() {
        try {
            // Try localStorage first for faster loading
            const localProfiles = window.supabaseClient.getUserProfilesFromLocalStorage();
            localProfiles.forEach(profile => {
                this.updateMemberAvatar(profile.member_name, profile.avatar_url, profile.display_name);
            });

            // Background sync with Supabase
            try {
                const supabaseProfiles = await window.supabaseClient.getUserProfiles();
                supabaseProfiles.forEach(profile => {
                    this.updateMemberAvatar(profile.member_name, profile.avatar_url, profile.display_name);
                });
            } catch (supabaseError) {
                console.log('Using localStorage fallback for profiles');
            }
        } catch (error) {
            console.error('Error loading user profiles:', error);
        }
    }

    /**
     * Update member avatar display
     */
    updateMemberAvatar(memberName, avatarUrl, displayName) {
        const memberElement = document.querySelector(`[data-member="${memberName}"]`);
        if (!memberElement) return;

        const avatarElement = memberElement.querySelector('.member-avatar');
        const imgElement = avatarElement.querySelector('.avatar-img');
        const initialElement = avatarElement.querySelector('.avatar-initial');

        if (avatarUrl) {
            imgElement.src = avatarUrl;
            imgElement.classList.remove('hidden');
            initialElement.style.display = 'none';
        } else {
            imgElement.classList.add('hidden');
            initialElement.style.display = 'flex';
        }

        // Update display name if provided
        if (displayName) {
            const nameElement = memberElement.querySelector('.member-name');
            nameElement.textContent = displayName;
        }
    }

    /**
     * Load more days (infinite scroll effect)
     */
    loadMoreDays() {
        this.daysToShow += 7; // Add one more week
        this.loadSchedules();
        this.renderCalendar();
        this.populateCustomDaySelector();
    }

    /**
     * Check if we need to update to show "today" correctly
     */
    updateTodayIfNeeded() {
        const now = new Date();
        const today = this.formatDate(now);
        const currentToday = this.formatDate(this.currentDate);

        if (today !== currentToday) {
            this.currentDate = now;
            this.loadSchedules();
            this.renderCalendar();
        }
    }

    /**
     * Get the start of the week (Monday) for a given date
     */
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
        return new Date(d.setDate(diff));
    }

    /**
     * Format date as YYYY-MM-DD
     */
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * Get day names in current language
     */
    getDayNames() {
        const translations = this.translations[this.currentLanguage];
        return [
            translations.monday,
            translations.tuesday,
            translations.wednesday,
            translations.thursday,
            translations.friday,
            translations.saturday,
            translations.sunday
        ];
    }

    /**
     * Load schedules from database
     */
    async loadSchedules() {
        try {
            const startDate = new Date(this.currentDate);
            const endDate = new Date(this.currentDate);
            endDate.setDate(endDate.getDate() + this.daysToShow);

            this.schedules = await window.supabaseClient.getSchedules(
                this.formatDate(startDate),
                this.formatDate(endDate)
            );

            this.renderCalendar();
        } catch (error) {
            console.error('Error loading schedules:', error);
            this.showError('Failed to load schedules. Please try again.');
        }
    }

    /**
     * Add schedule for today
     */
    async addTodaySchedule(timeSlot) {
        const today = this.formatDate(new Date());
        await this.addSchedule(this.selectedMember, today, timeSlot);
    }

    /**
     * Add a schedule entry
     */
    async addSchedule(memberName, date, timeSlot) {
        try {
            this.showLoading(true);
            await window.supabaseClient.addSchedule(memberName, date, timeSlot);
            await this.loadSchedules();
            this.showLoading(false);
        } catch (error) {
            console.error('Error adding schedule:', error);
            this.showError(error.message);
            this.showLoading(false);
        }
    }

    /**
     * Delete a schedule entry
     */
    async deleteSchedule(id) {
        try {
            this.showLoading(true);
            await window.supabaseClient.deleteSchedule(id);
            await this.loadSchedules();
            this.showLoading(false);
        } catch (error) {
            console.error('Error deleting schedule:', error);
            this.showError('Failed to delete schedule. Please try again.');
            this.showLoading(false);
        }
    }

    /**
     * Add full week schedule for selected member
     */
    async addFullWeek() {
        try {
            this.showLoading(true);
            const promises = [];

            for (let i = 0; i < 7; i++) {
                const date = new Date(this.currentDate);
                date.setDate(date.getDate() + i);
                const dateStr = this.formatDate(date);

                promises.push(
                    window.supabaseClient.addSchedule(this.selectedMember, dateStr, 'Full Day')
                        .catch(error => console.warn(`Could not add full day for ${dateStr}:`, error.message))
                );
            }

            await Promise.all(promises);
            await this.loadSchedules();
            this.showLoading(false);
        } catch (error) {
            console.error('Error adding full week:', error);
            this.showError('Failed to add full week schedule.');
            this.showLoading(false);
        }
    }

    /**
     * Add 5 morning shifts for selected member
     */
    async addFiveMornings() {
        try {
            this.showLoading(true);
            const promises = [];

            for (let i = 0; i < 5; i++) {
                const date = new Date(this.currentDate);
                date.setDate(date.getDate() + i);
                const dateStr = this.formatDate(date);

                promises.push(
                    window.supabaseClient.addSchedule(this.selectedMember, dateStr, 'Morning')
                        .catch(error => console.warn(`Could not add morning for ${dateStr}:`, error.message))
                );
            }

            await Promise.all(promises);
            await this.loadSchedules();
            this.showLoading(false);
        } catch (error) {
            console.error('Error adding five mornings:', error);
            this.showError('Failed to add five morning shifts.');
            this.showLoading(false);
        }
    }

    /**
     * Add custom schedule entry
     */
    async addCustomSchedule() {
        const daySelect = document.getElementById('custom-day');
        const timeSelect = document.getElementById('custom-time');

        const selectedDay = daySelect.value;
        const selectedTime = timeSelect.value;

        if (!selectedDay || !selectedTime) {
            this.showError('Please select both day and time slot.');
            return;
        }

        await this.addSchedule(this.selectedMember, selectedDay, selectedTime);

        // Reset form
        daySelect.value = '';
    }

    /**
     * Populate custom day selector with upcoming dates
     */
    populateCustomDaySelector() {
        const select = document.getElementById('custom-day');
        const translations = this.translations[this.currentLanguage];

        // Clear existing options except the first one
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        // Add next 30 days
        for (let i = 0; i < 30; i++) {
            const date = new Date(this.currentDate);
            date.setDate(date.getDate() + i);

            const option = document.createElement('option');
            option.value = this.formatDate(date);

            if (i === 0) {
                option.textContent = translations.today;
            } else if (i === 1) {
                option.textContent = translations.tomorrow;
            } else {
                const dayName = this.getDayNames()[date.getDay() === 0 ? 6 : date.getDay() - 1];
                option.textContent = `${dayName} (${date.getDate()}/${date.getMonth() + 1})`;
            }

            select.appendChild(option);
        }
    }

    /**
     * Render the calendar
     */
    renderCalendar() {
        const calendarGrid = document.getElementById('calendar-grid');
        calendarGrid.innerHTML = '';

        const translations = this.translations[this.currentLanguage];
        const today = this.formatDate(new Date());

        for (let i = 0; i < this.daysToShow; i++) {
            const date = new Date(this.currentDate);
            date.setDate(date.getDate() + i);
            const dateStr = this.formatDate(date);

            const dayCard = document.createElement('div');
            dayCard.className = 'day-card';

            // Get day name
            const dayNames = this.getDayNames();
            const dayName = dayNames[date.getDay() === 0 ? 6 : date.getDay() - 1];

            // Get schedules for this day
            const daySchedules = this.schedules.filter(s => s.date === dateStr);

            // Create day header
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';

            const dayNameElement = document.createElement('div');
            dayNameElement.className = 'day-name';
            if (dateStr === today) {
                dayNameElement.textContent = `${dayName} (${translations.today})`;
            } else {
                dayNameElement.textContent = dayName;
            }

            const dayDateElement = document.createElement('div');
            dayDateElement.className = 'day-date';
            dayDateElement.textContent = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

            dayHeader.appendChild(dayNameElement);
            dayHeader.appendChild(dayDateElement);

            // Create schedules container
            const schedulesContainer = document.createElement('div');
            schedulesContainer.className = 'day-schedules';

            if (daySchedules.length === 0) {
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.style.color = 'var(--text-secondary)';
                emptyState.style.fontStyle = 'italic';
                emptyState.textContent = 'No schedules';
                schedulesContainer.appendChild(emptyState);
            } else {
                daySchedules.forEach(schedule => {
                    const scheduleItem = document.createElement('div');
                    scheduleItem.className = `schedule-item ${schedule.time_slot.toLowerCase().replace(' ', '-')}`;

                    // Get emoji for time slot
                    const getTimeEmoji = (timeSlot) => {
                        switch(timeSlot.toLowerCase()) {
                            case 'morning': return '☀️';
                            case 'afternoon': return '🌤️';
                            case 'evening': return '🌆';
                            case 'full day': return '📅';
                            case 'night': return '🌙';
                            default: return '⏰';
                        }
                    };

                    // Get user profile for avatar
                    const profiles = JSON.parse(localStorage.getItem('user_profiles') || '[]');
                    const userProfile = profiles.find(p => p.member_name === schedule.member_name);

                    const memberInfo = document.createElement('div');
                    memberInfo.className = 'schedule-member-info';

                    const avatar = document.createElement('div');
                    avatar.className = 'schedule-avatar';
                    if (userProfile?.avatar_url) {
                        const img = document.createElement('img');
                        img.src = userProfile.avatar_url;
                        img.alt = schedule.member_name;
                        img.style.width = '32px';
                        img.style.height = '32px';
                        img.style.borderRadius = '50%';
                        img.style.objectFit = 'cover';
                        avatar.appendChild(img);
                    } else {
                        avatar.textContent = schedule.member_name.charAt(0);
                        avatar.style.display = 'flex';
                        avatar.style.alignItems = 'center';
                        avatar.style.justifyContent = 'center';
                        avatar.style.width = '32px';
                        avatar.style.height = '32px';
                        avatar.style.borderRadius = '50%';
                        avatar.style.backgroundColor = 'var(--primary-color)';
                        avatar.style.color = 'white';
                        avatar.style.fontWeight = 'bold';
                    }

                    const details = document.createElement('div');
                    details.className = 'schedule-details';

                    const memberName = document.createElement('div');
                    memberName.className = 'schedule-member';
                    memberName.textContent = userProfile?.display_name || schedule.member_name;

                    const timeInfo = document.createElement('div');
                    timeInfo.className = 'schedule-time';

                    const emoji = document.createElement('span');
                    emoji.className = 'time-emoji';
                    emoji.textContent = getTimeEmoji(schedule.time_slot);

                    const timeText = document.createElement('span');
                    timeText.textContent = translations[`${schedule.time_slot.toLowerCase().replace(' ', '-')}-text`] || schedule.time_slot;

                    timeInfo.appendChild(emoji);
                    timeInfo.appendChild(timeText);

                    details.appendChild(memberName);
                    details.appendChild(timeInfo);

                    memberInfo.appendChild(avatar);
                    memberInfo.appendChild(details);

                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'delete-schedule';
                    deleteBtn.textContent = '×';
                    deleteBtn.onclick = (e) => {
                        e.stopPropagation();
                        this.deleteSchedule(schedule.id);
                    };

                    scheduleItem.appendChild(memberInfo);
                    scheduleItem.appendChild(deleteBtn);

                    schedulesContainer.appendChild(scheduleItem);
                });
            }

            dayCard.appendChild(dayHeader);
            dayCard.appendChild(schedulesContainer);
            calendarGrid.appendChild(dayCard);
        }
    }

    /**
     * Show loading indicator
     */
    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            if (show) {
                loading.classList.remove('hidden');
            } else {
                loading.classList.add('hidden');
            }
        } else {
            console.warn('Loading element not found');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorToast = document.getElementById('error-toast');
        const errorMessage = document.getElementById('error-message');

        errorMessage.textContent = message;
        errorToast.classList.remove('hidden');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    /**
     * Hide error message
     */
    hideError() {
        const errorToast = document.getElementById('error-toast');
        errorToast.classList.add('hidden');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WorkScheduleApp();
});