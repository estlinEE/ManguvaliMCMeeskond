class Settings {
    constructor() {
        this.selectedMember = null;
        this.currentProfile = null;
        this.profilePictureFile = null;
        this.currentTheme = 'default';
        this.currentLanguage = 'en';
    }

    /**
     * Load current user profile
     */
    async loadCurrentProfile() {
        console.log('Loading profile for member:', this.selectedMember);
        try {
            // Always try localStorage first for faster loading
            const profile = await window.supabaseClient.getUserProfileFromLocalStorage(this.selectedMember);
            this.currentProfile = profile;
            console.log('Profile loaded successfully:', profile);
            this.updateProfileUI();
            console.log('Profile UI updated successfully');
            
            // Try to sync with Supabase in background without blocking UI
            this.syncProfileFromSupabase();
        } catch (error) {
            console.error('Supabase profile fetch error:', {
                message: error.message,
                details: error.toString(),
                hint: error.hint || '',
                code: error.code || ''
            });
            
            // Initialize with default profile
            this.currentProfile = {
                member_name: this.selectedMember,
                display_name: this.selectedMember,
                avatar_url: null
            };
            this.updateProfileUI();
        }
    }

    /**
     * Background sync with Supabase without blocking UI
     */
    async syncProfileFromSupabase() {
        try {
            const supabaseProfile = await window.supabaseClient.getUserProfile(this.selectedMember);
            if (supabaseProfile && supabaseProfile.member_name) {
                this.currentProfile = supabaseProfile;
                this.updateProfileUI();
            }
        } catch (error) {
            // Silent fail for background sync
            console.log('Background sync completed (using localStorage fallback)');
        }
    }

    /**
     * Update profile UI elements
     */
    updateProfileUI() {
        if (!this.currentProfile) return;

        // Update display name input
        document.getElementById('display-name').value = this.currentProfile.display_name || this.currentProfile.member_name;
        
        // Update current member name display
        document.getElementById('current-member-name').textContent = this.currentProfile.display_name || this.currentProfile.member_name;
        
        // Update avatar preview
        this.updateAvatarPreview(this.currentProfile.avatar_url);
        
        // Show/hide remove button
        const removePictureBtn = document.getElementById('remove-picture-btn');
        if (this.currentProfile.avatar_url) {
            removePictureBtn.classList.remove('hidden');
        } else {
            removePictureBtn.classList.add('hidden');
        }
    }

    /**
     * Update avatar preview
     */
    updateAvatarPreview(avatarUrl) {
        const previewImg = document.getElementById('preview-img');
        const previewInitial = document.getElementById('preview-initial');
        
        if (avatarUrl) {
            previewImg.src = avatarUrl;
            previewImg.classList.remove('hidden');
            previewInitial.style.display = 'none';
        } else {
            previewImg.classList.add('hidden');
            previewInitial.style.display = 'flex';
            previewInitial.textContent = this.selectedMember.charAt(0).toUpperCase();
        }
    }

    /**
     * Handle profile picture upload
     */
    async handleProfilePictureUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showError('Please select an image file.');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showError('File size must be less than 5MB.');
            return;
        }

        this.profilePictureFile = file;
        
        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.updateAvatarPreview(e.target.result);
        };
        reader.readAsDataURL(file);
        
        // Show remove button
        document.getElementById('remove-picture-btn').classList.remove('hidden');
    }

    /**
     * Remove profile picture
     */
    removeProfilePicture() {
        this.profilePictureFile = null;
        this.updateAvatarPreview(null);
        
        // Clear file input
        document.getElementById('profile-picture-input').value = '';
        
        // Hide remove button
        document.getElementById('remove-picture-btn').classList.add('hidden');
    }

    /**
     * Update general UI
     */
    updateUI() {
        // Update member select
        document.getElementById('member-select').value = this.selectedMember;
        
        // Update theme option visual selection
        document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('selected'));
        const selectedOption = document.querySelector(`[data-theme="${this.currentTheme}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
        
        // Update language select
        document.getElementById('language-select').value = this.currentLanguage;
        
        console.log('UI updated from preferences');
    }

    /**
     * Save settings
     */
    async saveSettings() {
        try {
            this.showLoading(true);
            
            const displayName = document.getElementById('display-name').value.trim();
            
            if (!displayName) {
                this.showError('Display name is required.');
                this.showLoading(false);
                return;
            }

            let avatarUrl = this.currentProfile?.avatar_url;
            
            // Upload profile picture if a new one was selected
            if (this.profilePictureFile) {
                try {
                    avatarUrl = await window.supabaseClient.uploadProfilePicture(
                        this.selectedMember,
                        this.profilePictureFile
                    );
                } catch (uploadError) {
                    console.error('Error uploading profile picture:', uploadError);
                    this.showError('Failed to upload profile picture. Settings saved without image.');
                    avatarUrl = this.currentProfile?.avatar_url; // Keep existing avatar
                }
            }

            // Save or update profile
            const profileData = {
                member_name: this.selectedMember,
                display_name: displayName,
                avatar_url: avatarUrl,
                theme_preference: this.currentTheme,
                language_preference: this.currentLanguage
            };

            await window.supabaseClient.saveUserProfile(profileData);

            // --- Sync to localStorage so avatar updates immediately ---
            let profiles = JSON.parse(localStorage.getItem('user_profiles') || '[]');
            const idx = profiles.findIndex(p => p.member_name === profileData.member_name);
            if (idx !== -1) {
                profiles[idx] = profileData;
            } else {
                profiles.push(profileData);
            }
            localStorage.setItem('user_profiles', JSON.stringify(profiles));
            // ----------------------------------------------------------

            this.currentProfile = profileData;
            this.profilePictureFile = null;
            
            this.showLoading(false);
            this.showSuccess('Settings saved successfully!');
            
            // Update profile picture input
            document.getElementById('profile-picture-input').value = '';
            
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showError('Failed to save settings. Please try again.');
            this.showLoading(false);
        }
    }

    /**
     * Cancel settings changes
     */
    cancelSettings() {
        // Reset to current profile
        this.loadCurrentProfile();
        this.profilePictureFile = null;
        
        // Clear file input
        document.getElementById('profile-picture-input').value = '';
        
        // Navigate back to schedule
        window.location.href = 'index.html';
    }

    /**
     * Show loading indicator
     */
    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.toggle('hidden', !show);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorToast = document.getElementById('error-toast');
        const errorMessage = document.getElementById('error-message');
        if (errorToast && errorMessage) {
            errorMessage.textContent = message;
            errorToast.classList.remove('hidden');
            setTimeout(() => errorToast.classList.add('hidden'), 5000);
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        const successToast = document.getElementById('success-toast');
        const successMessage = document.getElementById('success-message');
        if (successToast && successMessage) {
            successMessage.textContent = message;
            successToast.classList.remove('hidden');
            setTimeout(() => successToast.classList.add('hidden'), 3000);
        }
    }
}

// Initialize settings when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Settings page initializing...');
    
    // Initialize Supabase client
    if (!window.supabaseClient) {
        window.supabaseClient = new SupabaseClient();
        await window.supabaseClient.initialize();
    }

    // Initialize navigation manager
    if (window.NavigationManager) {
        const navManager = new NavigationManager();
        navManager.init();
    }

    // Initialize settings
    const settings = new Settings();
    
    // Load preferences from NavigationManager or localStorage
    const preferences = NavigationManager.getSharedPreferences();
    settings.currentTheme = preferences.theme || 'light';
    settings.currentLanguage = preferences.language || 'en';
    
    // Set default member (first available member)
    settings.selectedMember = 'Mikey'; // Default to first member
    
    // Set up event listeners
    setupSettingsEventListeners(settings);
    
    // Load current profile
    await settings.loadCurrentProfile();
    
    // Update UI
    settings.updateUI();
    
    console.log('Settings page initialized successfully');
});

function setupSettingsEventListeners(settings) {
    // Profile picture upload
    const profilePictureInput = document.getElementById('profile-picture-input');
    const uploadBtn = document.getElementById('upload-btn');
    const removePictureBtn = document.getElementById('remove-picture-btn');
    
    if (uploadBtn && profilePictureInput) {
        uploadBtn.addEventListener('click', () => {
            profilePictureInput.click();
        });
        
        profilePictureInput.addEventListener('change', (event) => {
            settings.handleProfilePictureUpload(event);
        });
    }
    
    if (removePictureBtn) {
        removePictureBtn.addEventListener('click', () => {
            settings.removeProfilePicture();
        });
    }
    
    // Member selection
    const memberSelect = document.getElementById('member-select');
    if (memberSelect) {
        memberSelect.addEventListener('change', async (event) => {
            settings.selectedMember = event.target.value;
            await settings.loadCurrentProfile();
        });
    }
    
    // Theme selection
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove active class from all options
            themeOptions.forEach(opt => opt.classList.remove('selected'));
            // Add active class to clicked option
            option.classList.add('selected');
            // Update theme
            const theme = option.dataset.theme;
            settings.currentTheme = theme;
            NavigationManager.applyTheme(theme);
        });
    });
    
    // Language selection
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.addEventListener('change', (event) => {
            const language = event.target.value;
            settings.currentLanguage = language;
            NavigationManager.applyLanguage(language);
        });
    }
    
    // Save settings button
    const saveBtn = document.getElementById('save-settings-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            await settings.saveSettings();
        });
    }
    
    // Cancel settings button
    const cancelBtn = document.getElementById('cancel-settings-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            settings.cancelSettings();
        });
    }
    
    // Error toast close button
    const closeErrorBtn = document.getElementById('close-error');
    if (closeErrorBtn) {
        closeErrorBtn.addEventListener('click', () => {
            document.getElementById('error-toast').classList.add('hidden');
        });
    }
    
    // Success toast close button
    const closeSuccessBtn = document.getElementById('close-success');
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', () => {
            document.getElementById('success-toast').classList.add('hidden');
        });
    }
}

window.Settings = Settings;
