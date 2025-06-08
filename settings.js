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
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorMsg = document.getElementById('error-message');
        if (errorMsg) {
            errorMsg.textContent = message;
            errorMsg.classList.remove('hidden');
            setTimeout(() => errorMsg.classList.add('hidden'), 5000);
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        const successMsg = document.getElementById('success-message');
        if (successMsg) {
            successMsg.textContent = message;
            successMsg.classList.remove('hidden');
            setTimeout(() => successMsg.classList.add('hidden'), 3000);
        }
    }
}

// Example usage:
// const settings = new Settings();
// settings.selectedMember = 'YourMemberName';
// settings.loadCurrentProfile();

window.Settings = Settings;
