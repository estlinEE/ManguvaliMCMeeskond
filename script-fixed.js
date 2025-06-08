/**
 * Work Schedule Application
 * Fixed version with proper error handling
 */

class WorkScheduleApp {
    constructor() {
        this.currentLanguage = 'et';
        this.currentTheme = 'light';
        this.selectedMember = 'Pringlessman';
        this.currentDate = new Date();
        this.daysToShow = 7;
        this.schedules = [];
        this.subscription = null;

        this.translations = {
            'en': {
                'page-title': 'Work Schedule',
                'team-title': 'Team Members',
                'quick-add-title': 'Quick Add for Today',
                'custom-add-title': 'Custom Add',
                'custom-day-label': 'Day',
                'custom-time-label': 'Time Slot',
                'add-custom-text': 'Add',
                'load-more-text': 'Load More Days',
                'morning-text': 'Morning',
                'afternoon-text': 'Afternoon',
                'evening-text': 'Evening',
                'full-day-text': 'Full Day',
                'night-text': 'Night',
                'today': 'Today',
                'monday': 'Monday',
                'tuesday': 'Tuesday',
                'wednesday': 'Wednesday',
                'thursday': 'Thursday',
                'friday': 'Friday',
                'saturday': 'Saturday',
                'sunday': 'Sunday'
            },
            'et': {
                'page-title': 'Töögraafik',
                'team-title': 'Meeskonnaliikmed',
                'quick-add-title': 'Kiire lisamine tänaseks',
                'custom-add-title': 'Kohandatud lisamine',
                'custom-day-label': 'Päev',
                'custom-time-label': 'Ajavahemik',
                'add-custom-text': 'Lisa',
                'load-more-text': 'Laadi rohkem päevi',
                'morning-text': 'Hommik',
                'afternoon-text': 'Pärastlõuna',
                'evening-text': 'Õhtu',
                'full-day-text': 'Terve päev',
                'night-text': 'Öö',
                'today': 'Täna',
                'monday': 'Esmaspäev',
                'tuesday': 'Teisipäev',
                'wednesday': 'Kolmapäev',
                'thursday': 'Neljapäev',
                'friday': 'Reede',
                'saturday': 'Laupäev',
                'sunday': 'Pühapäev'
            }
        };

        this.init();
    }

    async init() {
        try {
            console.log('Starting app initialization...');

            // Load saved preferences
            this.loadPreferences();

            // Initialize Supabase
            if (window.supabaseClient) {
                await window.supabaseClient.initialize();
                await this.loadSchedules();
                await this.loadUserProfiles();
            }

            // Initial render
            this.updateTranslations();
            this.populateCustomDaySelector();
            this.renderCalendar();

            // Set up event listeners
            this.setupEventListeners();

            // Set up automatic day rotation
            this.setupDayRotation();

            console.log('App initialization completed successfully');
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    setupDayRotation() {
        // Check for day change every minute
        setInterval(() => {
            this.checkDayChange();
        }, 60000);

        // Also check when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkDayChange();
            }
        });
    }

    checkDayChange() {
        const now = new Date();
        const currentDateStr = this.formatDate(now);
        const lastCheckDate = localStorage.getItem('last-check-date');

        if (lastCheckDate && lastCheckDate !== currentDateStr) {
            // Day has changed, update the calendar
            this.currentDate = now;
            this.loadSchedules();
            this.renderCalendar();
            this.populateCustomDaySelector();
        }

        localStorage.setItem('last-check-date', currentDateStr);
    }

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
            members.forEach(member => {
                if (member) {
                    member.addEventListener('click', (e) => {
                        const memberName = e.currentTarget.dataset.member;
                        if (memberName) this.selectMember(memberName);
                    });
                }
            });

            // Quick add buttons
            const slotBtns = document.querySelectorAll('.slot-btn');
            slotBtns.forEach(btn => {
                if (btn) {
                    btn.addEventListener('click', (e) => {
                        const timeSlot = e.currentTarget.dataset.slot;
                        if (timeSlot) this.addTodaySchedule(timeSlot);
                    });
                }
            });

            // Custom add functionality
            const customAddBtn = document.getElementById('custom-add-btn');
            if (customAddBtn) {
                customAddBtn.addEventListener('click', () => this.addCustomSchedule());
            }

            console.log('Event listeners setup completed');
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    loadPreferences() {
        const savedLang = localStorage.getItem('work-schedule-lang') || 'et';
        const savedTheme = localStorage.getItem('work-schedule-theme') || 'light';
        const savedMember = localStorage.getItem('work-schedule-member') || 'Pringlessman';

        this.setLanguage(savedLang);
        this.setTheme(savedTheme);
        this.selectMember(savedMember);
    }

    setLanguage(lang) {
        this.currentLanguage = lang;

        // Update language button states
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const langBtn = document.getElementById(`lang-${lang}`);
        if (langBtn) langBtn.classList.add('active');

        this.updateTranslations();
        localStorage.setItem('work-schedule-lang', lang);
    }

    updateTranslations() {
        const translations = this.translations[this.currentLanguage];

        Object.keys(translations).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = translations[key];
            }
        });
    }



    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);

        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            // Update icon based on theme
            const themeIcons = {
                'light': '🌙',
                'dark': '🌑',
            };
            themeIcon.textContent = themeIcons[theme] || '🌙';
        }

        localStorage.setItem('work-schedule-theme', theme);
    }

    toggleTheme() {
        // Cycle through available themes
        const themes = ['light', 'dark'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.setTheme(themes[nextIndex]);
    }

    selectMember(memberName) {
        this.selectedMember = memberName;

        // Update member selection UI
        document.querySelectorAll('.member').forEach(member => {
            member.classList.remove('selected');
        });

        const selectedMember = document.querySelector(`[data-member="${memberName}"]`);
        if (selectedMember) {
            selectedMember.classList.add('selected');
        }

        localStorage.setItem('work-schedule-member', memberName);
    }

    async loadSchedules() {
        try {
            if (window.supabaseClient) {
                const startDate = this.formatDate(this.currentDate);
                const endDate = this.formatDate(new Date(this.currentDate.getTime() + (this.daysToShow - 1) * 24 * 60 * 60 * 1000));
                this.schedules = await window.supabaseClient.getSchedules(startDate, endDate);
            }
            this.renderCalendar();
        } catch (error) {
            console.error('Error loading schedules:', error);
        }
    }

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
                // Store updated profiles
                localStorage.setItem('user_profiles', JSON.stringify(supabaseProfiles));
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

        const avatarContainer = memberElement.querySelector('.member-avatar');
        const imgElement = avatarContainer.querySelector('.avatar-img');
        const initialElement = avatarContainer.querySelector('.avatar-initial');
        const nameElement = memberElement.querySelector('.member-name');

        if (avatarUrl && imgElement) {
            imgElement.src = avatarUrl;
            imgElement.classList.remove('hidden');
            if (initialElement) initialElement.style.display = 'none';
        } else if (initialElement) {
            initialElement.textContent = memberName.charAt(0).toUpperCase();
            initialElement.style.display = 'flex';
            if (imgElement) imgElement.classList.add('hidden');
        }

        // Update display name if provided
        if (displayName && nameElement) {
            nameElement.textContent = displayName;
        }
    }

    async addTodaySchedule(timeSlot) {
        if (!this.selectedMember) {
            this.showError('Please select a team member first.');
            return;
        }

        const today = this.formatDate(new Date());
        await this.addSchedule(this.selectedMember, today, timeSlot);
    }

    async addSchedule(memberName, date, timeSlot) {
        try {
            if (window.supabaseClient) {
                await window.supabaseClient.addSchedule(memberName, date, timeSlot);
                await this.loadSchedules();
            }
        } catch (error) {
            console.error('Error adding schedule:', error);
            this.showError('Failed to add schedule. Please try again.');
        }
    }

    async deleteSchedule(id) {
        try {
            if (window.supabaseClient) {
                await window.supabaseClient.deleteSchedule(id);
                await this.loadSchedules();
            }
        } catch (error) {
            console.error('Error deleting schedule:', error);
            this.showError('Failed to delete schedule. Please try again.');
        }
    }

    populateCustomDaySelector() {
        const daySelect = document.getElementById('custom-day');
        if (!daySelect) return;

        // Clear existing options except the first one
        const firstOption = daySelect.querySelector('option[value=""]');
        daySelect.innerHTML = '';
        if (firstOption) daySelect.appendChild(firstOption);

        // Add next 14 days
        for (let i = 0; i < 14; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);

            const option = document.createElement('option');
            option.value = this.formatDate(date);

            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayName = dayNames[date.getDay()];
            const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;

            if (i === 0) {
                option.textContent = `Today (${dayName} ${dateStr})`;
            } else if (i === 1) {
                option.textContent = `Tomorrow (${dayName} ${dateStr})`;
            } else {
                option.textContent = `${dayName} ${dateStr}`;
            }

            daySelect.appendChild(option);
        }
    }

    async addCustomSchedule() {
        const daySelect = document.getElementById('custom-day');
        const timeSelect = document.getElementById('custom-time');

        if (!daySelect || !timeSelect) return;

        const selectedDate = daySelect.value;
        const selectedTime = timeSelect.value;

        if (!selectedDate || !selectedTime) {
            this.showError('Please select both day and time slot.');
            return;
        }

        if (!this.selectedMember) {
            this.showError('Please select a team member first.');
            return;
        }

        await this.addSchedule(this.selectedMember, selectedDate, selectedTime);
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    renderCalendar() {
        const calendarGrid = document.getElementById('calendar-grid');
        if (!calendarGrid) return;

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
            const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const dayName = translations[dayNames[date.getDay() === 0 ? 6 : date.getDay() - 1]];

            // Get schedules for this day
            const daySchedules = this.schedules.filter(s => s.date === dateStr);

            dayCard.innerHTML = `
                <div class="day-header">
                    <div class="day-name">${dayName}${dateStr === today ? ` (${translations.today})` : ''}</div>
                    <div class="day-date">${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}</div>
                </div>
                <div class="day-schedules">
                    ${daySchedules.length === 0 ? 
                        '<div class="empty-state" style="color: var(--text-secondary); font-style: italic;">No schedules</div>' :
                        daySchedules.map(schedule => `
                            <div class="schedule-item ${schedule.time_slot.toLowerCase().replace(' ', '-')}">
                                <div class="schedule-member-info">
                                    <div class="schedule-avatar"></div>
                                    <div class="schedule-details">
                                        <div class="schedule-member">${schedule.member_name}</div>
                                        <div class="schedule-time">
                                            <span class="time-emoji">${this.getTimeEmoji(schedule.time_slot)}</span>
                                            <span>${translations[`${schedule.time_slot.toLowerCase().replace(' ', '-')}-text`] || schedule.time_slot}</span>
                                        </div>
                                    </div>
                                </div>
                                <button class="delete-schedule" onclick="app.deleteSchedule(${schedule.id})">×</button>
                            </div>
                        `).join('')
                    }
                </div>
            `;

            //Fix profile picture display in schedule
            const scheduleItem = dayCard.querySelector('.schedule-item');
            if (scheduleItem) {
                const memberName = scheduleItem.querySelector('.schedule-member').textContent;
                const scheduleAvatar = scheduleItem.querySelector('.schedule-avatar');
                if (scheduleAvatar) {
                    try {
                        const member = await window.supabaseClient.getUserProfile(memberName);
                        if (member && member.avatar_url) {
                            scheduleAvatar.innerHTML = `<img src="${member.avatar_url}" alt="${memberName}" class="avatar-img" />`;
                        } else {
                            scheduleAvatar.innerHTML = `<span class="avatar-initial">${memberName.charAt(0).toUpperCase()}</span>`;
                        }
                    } catch (error) {
                        console.log('Using fallback avatar for', memberName);
                        scheduleAvatar.innerHTML = `<span class="avatar-initial">${memberName.charAt(0).toUpperCase()}</span>`;
                    }
                }
            }

            calendarGrid.appendChild(dayCard);
        }
    }

    getTimeEmoji(timeSlot) {
        switch(timeSlot.toLowerCase()) {
            case 'morning': return '☀️';
            case 'afternoon': return '🌤️';
            case 'evening': return '🌆';
            case 'full day': return '📅';
            case 'night': return '🌙';
            default: return '⏰';
        }
    }

    showError(message) {
        const errorToast = document.getElementById('error-toast');
        const errorMessage = document.getElementById('error-message');

        if (errorToast && errorMessage) {
            errorMessage.textContent = message;
            errorToast.classList.remove('hidden');

            setTimeout(() => {
                this.hideError();
            }, 5000);
        } else {
            console.error('Error:', message);
            alert(message);
        }
    }

    hideError() {
        const errorToast = document.getElementById('error-toast');
        if (errorToast) {
            errorToast.classList.add('hidden');
        }
    }
}

// Initialize app when DOM is ready
if (typeof window !== 'undefined') {
    window.WorkScheduleApp = WorkScheduleApp;
}