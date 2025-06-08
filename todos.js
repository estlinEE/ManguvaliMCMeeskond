/**
 * Todos Page JavaScript
 * Handles kanban board functionality with drag and drop
 */

class TodosApp {
    constructor() {
        this.currentLanguage = 'en';
        this.currentTheme = 'light';
        this.todos = [];
        this.currentEditingTodo = null;
        this.draggedElement = null;

        // Translation object
        this.translations = {
            en: {
                'page-title': 'Todo Board',
                'todos-title': 'Project Board',
                'add-todo-text': 'Add Todo',
                'todo-column-title': 'To Do',
                'progress-column-title': 'In Progress',
                'done-column-title': 'Done',
                'modal-title': 'Add New Todo',
                'todo-title-label': 'Title',
                'todo-description-label': 'Description',
                'todo-label-label': 'Label',
                'todo-status-label': 'Status',
                'feature-label': 'Feature',
                'bug-label': 'Bug',
                'improvement-label': 'Improvement',
                'urgent-label': 'Urgent',
                'design-label': 'Design',
                'documentation-label': 'Documentation',
                'testing-label': 'Testing',
                'maintenance-label': 'Maintenance',
                'todo-status-option': 'To Do',
                'progress-status-option': 'In Progress',
                'done-status-option': 'Done',
                'save-todo-text': 'Save Todo',
                'cancel-todo-text': 'Cancel',
                'detail-todo-title': 'Todo Details',
                'loading-text': 'Loading...',
                'nav-schedule-text': 'Schedule',
                'nav-todos-text': 'Todos',
                'nav-settings-text': 'Settings',
                'edit-modal-title': 'Edit Todo',
                'update-todo-text': 'Update Todo',
                'today': 'Today',
                'tomorrow': 'Tomorrow',
                'due-today': 'Due today',
                'one-day-left': '1 day left',
                'days-left': 'days left',
                'days-overdue': 'days overdue',
                'high-priority-text': 'HIGH',
                'medium-priority-text': 'MED',
                'low-priority-text': 'LOW',
                'todo-assignee-label': 'Assigned To',
                'todo-images-label': 'Images/Screenshots',
                'remove-image': 'Remove',
            },
            et: {
                'page-title': 'Ülesannete Tahvel',
                'todos-title': 'Projekti Tahvel',
                'add-todo-text': 'Lisa Ülesanne',
                'todo-column-title': 'Teha',
                'progress-column-title': 'Pooleli',
                'done-column-title': 'Valmis',
                'modal-title': 'Lisa Uus Ülesanne',
                'todo-title-label': 'Pealkiri',
                'todo-description-label': 'Kirjeldus',
                'todo-label-label': 'Silt',
                'todo-status-label': 'Staatus',
                'feature-label': 'Funktsioon',
                'bug-label': 'Viga',
                'improvement-label': 'Täiendus',
                'urgent-label': 'Kiire',
                'design-label': 'Disain',
                'documentation-label': 'Dokumentatsioon',
                'testing-label': 'Testimine',
                'maintenance-label': 'Hooldus',
                'todo-status-option': 'Teha',
                'progress-status-option': 'Pooleli',
                'done-status-option': 'Valmis',
                'save-todo-text': 'Salvesta Ülesanne',
                'cancel-todo-text': 'Tühista',
                'detail-todo-title': 'Ülesande Detailid',
                'loading-text': 'Laadimine...',
                'nav-schedule-text': 'Graafik',
                'nav-todos-text': 'Ülesanded',
                'nav-settings-text': 'Seaded',
                'edit-modal-title': 'Muuda Ülesannet',
                'update-todo-text': 'Uuenda Ülesanne',
                'today': 'Täna',
                'tomorrow': 'Homme',
                'due-today': 'Tähtaeg täna',
                'one-day-left': '1 päev jäänud',
                'days-left': 'päeva jäänud',
                'days-overdue': 'päeva üle tähtaja',
                'high-priority-text': 'KÕRGE',
                'medium-priority-text': 'KESK',
                'low-priority-text': 'MADAL',
                'todo-assignee-label': 'Määratud',
                'todo-images-label': 'Pildid/Kuvatõmmised',
                'remove-image': 'Eemalda',
            }
        };

        this.init();
    }

    /**
     * Initialize the todos application
     */
    async init() {
        try {
            this.showLoading(true);

            // Load saved preferences
            this.loadPreferences();

            // Set up event listeners
            this.setupEventListeners();

            // Initialize Supabase
            await window.supabaseClient.initialize();

            // Load todos
            await this.loadTodos();

            // Initial render
            this.updateTranslations();
            this.renderTodos();

            this.showLoading(false);
        } catch (error) {
            console.error('Error initializing todos:', error);
            this.showError('Failed to initialize todos. Please try again.');
            this.showLoading(false);
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Language switcher
        document.getElementById('lang-et').addEventListener('click', () => this.setLanguage('et'));
        document.getElementById('lang-en').addEventListener('click', () => this.setLanguage('en'));

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());

        // Add todo button
        document.getElementById('add-todo-btn').addEventListener('click', () => this.openAddTodoModal());

        // Modal buttons
        document.getElementById('save-todo-btn').addEventListener('click', () => this.saveTodo());
        document.getElementById('cancel-todo-btn').addEventListener('click', () => this.closeModal());
        document.getElementById('close-modal').addEventListener('click', () => this.closeModal());

        // Detail modal buttons
        document.getElementById('edit-todo-btn').addEventListener('click', () => this.editCurrentTodo());
        document.getElementById('delete-todo-btn').addEventListener('click', () => this.deleteCurrentTodo());
        document.getElementById('close-detail-modal').addEventListener('click', () => this.closeDetailModal());

        // Image upload handling
        document.getElementById('todo-images').addEventListener('change', (e) => this.handleImageUpload(e));

        // Toast close buttons
        document.getElementById('close-error').addEventListener('click', () => this.hideError());
        const closeSuccess = document.getElementById('close-success');
        if (closeSuccess) {
            closeSuccess.addEventListener('click', () => this.hideSuccess());
        }

        // Drag and drop setup
        this.setupDragAndDrop();

        // Modal backdrop clicks
        document.getElementById('todo-modal').addEventListener('click', (e) => {
            if (e.target.id === 'todo-modal') this.closeModal();
        });

        document.getElementById('todo-detail-modal').addEventListener('click', (e) => {
            if (e.target.id === 'todo-detail-modal') this.closeDetailModal();
        });
    }

    /**
     * Handle image upload
     */
    handleImageUpload(event) {
        const files = event.target.files;
        const previewContainer = document.getElementById('image-preview-container');
        
        if (!previewContainer) return;

        // Initialize images array if it doesn't exist
        if (!this.currentImages) {
            this.currentImages = [];
        }

        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageData = e.target.result;
                    this.currentImages.push(imageData);

                    // Create preview element
                    const previewDiv = document.createElement('div');
                    previewDiv.className = 'image-preview';
                    previewDiv.innerHTML = `
                        <img src="${imageData}" alt="Preview" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;">
                        <button type="button" class="remove-image-btn" onclick="todosApp.removeImage(${this.currentImages.length - 1})">
                            <span id="remove-image">${this.translations[this.currentLanguage]['remove-image'] || 'Remove'}</span>
                        </button>
                    `;
                    previewContainer.appendChild(previewDiv);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    /**
     * Remove image from current images
     */
    removeImage(index) {
        if (this.currentImages && index >= 0 && index < this.currentImages.length) {
            this.currentImages.splice(index, 1);
            this.updateImagePreviews();
        }
    }

    /**
     * Update image previews
     */
    updateImagePreviews() {
        const previewContainer = document.getElementById('image-preview-container');
        if (!previewContainer) return;

        previewContainer.innerHTML = '';
        
        if (this.currentImages) {
            this.currentImages.forEach((imageData, index) => {
                const previewDiv = document.createElement('div');
                previewDiv.className = 'image-preview';
                previewDiv.innerHTML = `
                    <img src="${imageData}" alt="Preview" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;">
                    <button type="button" class="remove-image-btn" onclick="todosApp.removeImage(${index})">
                        <span>${this.translations[this.currentLanguage]['remove-image'] || 'Remove'}</span>
                    </button>
                `;
                previewContainer.appendChild(previewDiv);
            });
        }
    }

    /**
     * Load user preferences
     */
    loadPreferences() {
        const savedLang = localStorage.getItem('work-schedule-lang') || 'en';
        const savedTheme = localStorage.getItem('work-schedule-theme') || 'light';

        this.setLanguage(savedLang);
        this.setTheme(savedTheme);
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
        localStorage.setItem('work-schedule-lang', lang);
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
     * Toggle between light and dark themes
     */
    toggleTheme() {
        this.setTheme(this.currentTheme === 'light' ? 'dark' : 'light');
    }

    /**
     * Set application theme
     */
    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);

        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            const themeIcons = {
                'light': '🌙',
                'dark': '🌑',
                'darker': '⚫',
                'pink': '🌸',
                'yellow': '☀️'
            };
            themeIcon.textContent = themeIcons[theme] || '🌙';
        }

        localStorage.setItem('work-schedule-theme', theme);
    }

    toggleTheme() {
        const themes = ['light', 'dark', 'darker', 'pink', 'yellow'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.setTheme(themes[nextIndex]);
    }

    /**
     * Load todos from database
     */
    async loadTodos() {
        try {
            this.todos = await window.supabaseClient.getTodos();
            this.renderTodos();
        } catch (error) {
            console.error('Error loading todos:', error);
            this.showError('Failed to load todos. Please try again.');
        }
    }

    /**
     * Render todos in kanban columns
     */
    renderTodos() {
        const columns = ['todo', 'in-progress', 'done'];

        columns.forEach(status => {
            const columnContent = document.querySelector(`[data-column="${status}"]`);
            const countElement = document.getElementById(`${status === 'in-progress' ? 'progress' : status}-count`);

            const columnTodos = this.todos.filter(todo => todo.status === status);

            // Sort todos by priority, time urgency, and due date
            columnTodos.sort((a, b) => {
                // Priority order: high = 0, medium = 1, low = 2
                const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
                const aPriority = priorityOrder[a.priority] || 1;
                const bPriority = priorityOrder[b.priority] || 1;

                // Calculate urgency score based on days left
                const getUrgencyScore = (todo) => {
                    if (!todo.due_date) return 999; // No due date = lowest urgency
                    
                    const dueDate = new Date(todo.due_date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    dueDate.setHours(0, 0, 0, 0);
                    
                    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    
                    if (diffDays < 0) return -diffDays; // Overdue gets negative score (highest urgency)
                    return diffDays; // Days left
                };

                const aUrgency = getUrgencyScore(a);
                const bUrgency = getUrgencyScore(b);

                // First sort by priority
                if (aPriority !== bPriority) {
                    return aPriority - bPriority;
                }

                // Then by urgency (lower score = more urgent)
                if (aUrgency !== bUrgency) {
                    return aUrgency - bUrgency;
                }

                // Finally by creation date (newest first)
                return new Date(b.created_at) - new Date(a.created_at);
            });

            countElement.textContent = columnTodos.length;
            columnContent.innerHTML = '';

            if (columnTodos.length === 0) {
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.style.color = 'var(--text-secondary)';
                emptyState.style.fontStyle = 'italic';
                emptyState.style.textAlign = 'center';
                emptyState.style.padding = '2rem';
                emptyState.textContent = 'No todos';
                columnContent.appendChild(emptyState);
            } else {
                columnTodos.forEach(todo => {
                    const todoCard = this.createTodoCard(todo);
                    columnContent.appendChild(todoCard);
                });
            }
        });
    }

    /**
     * Create a todo card element
     */
    createTodoCard(todo) {
        const card = document.createElement('div');
        card.className = 'todo-card';
        card.draggable = true;
        card.dataset.todoId = todo.id;

        // Add priority class
        if (todo.priority) {
            card.classList.add(`${todo.priority}-priority`);
        }

        // Check if overdue
        const isOverdue = todo.due_date && new Date(todo.due_date) < new Date() && todo.status !== 'done';
        if (isOverdue) {
            card.classList.add('overdue');
        }

        // Format due date with days left calculation
        let dueDateHtml = '';
        if (todo.due_date) {
            const dueDate = new Date(todo.due_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            dueDate.setHours(0, 0, 0, 0);

            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let dateText = '';
            let daysLeftText = '';

            const t = this.translations[this.currentLanguage];

            if (diffDays === 0) {
                dateText = t['today'] || 'Today';
                daysLeftText = `⏰ ${t['due-today'] || 'Due today'}`;
            } else if (diffDays === 1) {
                dateText = t['tomorrow'] || 'Tomorrow';
                daysLeftText = `📅 ${t['one-day-left'] || '1 day left'}`;
            } else if (diffDays > 1) {
                dateText = dueDate.toLocaleDateString();
                daysLeftText = `📅 ${diffDays} ${t['days-left'] || 'days left'}`;
            } else {
                dateText = dueDate.toLocaleDateString();
                daysLeftText = `⚠️ ${Math.abs(diffDays)} ${t['days-overdue'] || 'days overdue'}`;
            }

            dueDateHtml = `
                <div class="todo-due-date ${isOverdue ? 'overdue' : ''}">
                    <div class="due-date-text">${dateText}</div>
                    <div class="days-left-text">${daysLeftText}</div>
                </div>
            `;
        }

        // Format assignees with profile pictures
        let assigneeHtml = '';
        const assignees = todo.assignees || (todo.assignee ? [todo.assignee] : []);
        
        if (assignees && assignees.length > 0) {
            const profiles = JSON.parse(localStorage.getItem('user_profiles') || '[]');
            
            const assigneeElements = assignees.slice(0, 3).map(assigneeName => {
                const profile = profiles.find(p => p.member_name === assigneeName);
                
                let avatarHtml = '';
                if (profile && profile.avatar_url) {
                    avatarHtml = `<img src="${profile.avatar_url}" alt="${assigneeName}" class="assignee-avatar">`;
                } else {
                    avatarHtml = `<div class="assignee-avatar-initial">${assigneeName.charAt(0).toUpperCase()}</div>`;
                }
                
                return `
                    <div class="todo-assignee-item">
                        ${avatarHtml}
                        <span class="assignee-name">${profile ? profile.display_name || assigneeName : assigneeName}</span>
                    </div>
                `;
            }).join('');
            
            const extraCount = assignees.length > 3 ? `<div class="extra-assignees">+${assignees.length - 3}</div>` : '';
            
            assigneeHtml = `
                <div class="todo-assignees">
                    ${assigneeElements}
                    ${extraCount}
                </div>
            `;
        }

        // Enhanced priority display
        let priorityHtml = '';
        let priorityBadge = '';
        if (todo.priority) {
            const priorityIcons = {
                'high': '🔴',
                'medium': '🟡', 
                'low': '🟢'
            };
            const t = this.translations[this.currentLanguage];
            const priorityTexts = {
                'high': t['high-priority-text'] || 'HIGH',
                'medium': t['medium-priority-text'] || 'MED',
                'low': t['low-priority-text'] || 'LOW'
            };
            priorityHtml = `<div class="priority-indicator ${todo.priority}"></div>`;
            priorityBadge = `<div class="priority-badge ${todo.priority}">${priorityIcons[todo.priority]} ${priorityTexts[todo.priority]}</div>`;
        }

        card.innerHTML = `
            <div class="todo-header">
                <div class="todo-label ${todo.label}">${this.getLabelText(todo.label)}</div>
                ${priorityBadge}
            </div>
            <div class="todo-title">
                ${priorityHtml}
                ${this.escapeHtml(todo.title)}
            </div>
            <div class="todo-description">${this.escapeHtml(todo.description || '')}</div>
            <div class="todo-meta">
                ${dueDateHtml}
                ${assigneeHtml}
            </div>
            <div class="todo-actions">
                <button class="todo-action" onclick="window.todosApp.editTodo('${todo.id}')">✏️</button>
                <button class="todo-action" onclick="window.todosApp.deleteTodo('${todo.id}')">🗑️</button>
            </div>
        `;

        // Add click handler to view details
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('todo-action')) {
                this.viewTodoDetails(todo);
            }
        });

        return card;
    }

    /**
     * Get label text in current language
     */
    getLabelText(label) {
        const translations = this.translations[this.currentLanguage];
        return translations[`${label}-label`] || label;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Set up drag and drop functionality
     */
    setupDragAndDrop() {
        // Add drag event listeners to columns
        const columns = document.querySelectorAll('.column-content');

        columns.forEach(column => {
            column.addEventListener('dragover', this.handleDragOver.bind(this));
            column.addEventListener('drop', this.handleDrop.bind(this));
        });

        // Delegate drag events for todo cards
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('todo-card')) {
                this.handleDragStart(e);
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('todo-card')) {
                this.handleDragEnd(e);
            }
        });
    }

    /**
     * Handle drag start
     */
    handleDragStart(e) {
        this.draggedElement = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.outerHTML);
    }

    /**
     * Handle drag end
     */
    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedElement = null;
    }

    /**
     * Handle drag over
     */
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    /**
     * Handle drop
     */
    async handleDrop(e) {
        e.preventDefault();

        if (!this.draggedElement) return;

        const targetColumn = e.target.closest('.column-content');
        if (!targetColumn) return;

        const newStatus = targetColumn.dataset.column;
        const todoId = this.draggedElement.dataset.todoId;

        try {
            await this.updateTodoStatus(todoId, newStatus);
        } catch (error) {
            console.error('Error updating todo status:', error);
            this.showError('Failed to update todo status.');
        }
    }

    /**
     * Update todo status
     */
    async updateTodoStatus(todoId, newStatus) {
        try {
            this.showLoading(true);

            await window.supabaseClient.updateTodo(todoId, { status: newStatus });

            // Update local todos array
            const todo = this.todos.find(t => t.id.toString() === todoId.toString());
            if (todo) {
                todo.status = newStatus;
            }

            this.renderTodos();
            this.showLoading(false);
        } catch (error) {
            this.showLoading(false);
            throw error;
        }
    }

    /**
     * Open add todo modal
     */
    openAddTodoModal() {
        this.currentEditingTodo = null;
        this.resetModal();

        const modal = document.getElementById('todo-modal');
        const modalTitle = document.getElementById('modal-title');
        const saveBtn = document.getElementById('save-todo-btn');

        modalTitle.textContent = this.translations[this.currentLanguage]['modal-title'];
        saveBtn.innerHTML = `💾 <span>${this.translations[this.currentLanguage]['save-todo-text']}</span>`;

        modal.classList.remove('hidden');
    }

    /**
     * Reset modal form
     */
    resetModal() {
        document.getElementById('todo-title').value = '';
        document.getElementById('todo-description').value = '';
        document.getElementById('todo-label').value = 'feature';
        document.getElementById('todo-priority').value = 'medium';
        document.getElementById('todo-due-date').value = '';
        document.getElementById('todo-status').value = 'todo';
        
        // Reset assignees checkboxes
        const assigneeInputs = document.querySelectorAll('.assignee-input');
        assigneeInputs.forEach(input => input.checked = false);
        
        // Reset images
        document.getElementById('todo-images').value = '';
        this.currentImages = [];
        const previewContainer = document.getElementById('image-preview-container');
        if (previewContainer) {
            previewContainer.innerHTML = '';
        }
    }

    /**
     * Close modal
     */
    closeModal() {
        document.getElementById('todo-modal').classList.add('hidden');
        this.currentEditingTodo = null;
    }

    /**
     * Save todo
     */
    async saveTodo() {
        const title = document.getElementById('todo-title').value.trim();
        const description = document.getElementById('todo-description').value.trim();
        const label = document.getElementById('todo-label').value;
        const priority = document.getElementById('todo-priority').value;
        const dueDate = document.getElementById('todo-due-date').value;
        const status = document.getElementById('todo-status').value;

        // Get selected assignees
        const assigneeInputs = document.querySelectorAll('.assignee-input:checked');
        const assignees = Array.from(assigneeInputs).map(input => input.value);

        if (!title) {
            this.showError('Title is required.');
            return;
        }

        try {
            this.showLoading(true);

            const todoData = {
                title,
                description,
                label,
                priority,
                due_date: dueDate || null,
                assignees: assignees,
                images: this.currentImages || [],
                status
            };

            if (this.currentEditingTodo) {
                // Update existing todo
                await window.supabaseClient.updateTodo(this.currentEditingTodo.id, todoData);

                // Update local todos array
                const index = this.todos.findIndex(t => t.id === this.currentEditingTodo.id);
                if (index >= 0) {
                    this.todos[index] = { ...this.todos[index], ...todoData };
                }

                this.showSuccess('Todo updated successfully!');
            } else {
                // Add new todo
                const newTodo = await window.supabaseClient.addTodo(todoData);
                this.todos.push(newTodo);

                this.showSuccess('Todo added successfully!');
            }

            this.renderTodos();
            this.closeModal();
            this.showLoading(false);

        } catch (error) {
            console.error('Error saving todo:', error);
            this.showError('Failed to save todo. Please try again.');
            this.showLoading(false);
        }
    }

    /**
     * Edit todo
     */
    editTodo(todoId) {
        const todo = this.todos.find(t => t.id.toString() === todoId.toString());
        if (!todo) {
            console.error('Todo not found:', todoId);
            return;
        }

        this.currentEditingTodo = todo;

        // Populate modal with todo data
        document.getElementById('todo-title').value = todo.title;
        document.getElementById('todo-description').value = todo.description || '';
        document.getElementById('todo-label').value = todo.label;
        document.getElementById('todo-priority').value = todo.priority || 'medium';
        document.getElementById('todo-due-date').value = todo.due_date || '';
        document.getElementById('todo-status').value = todo.status;

        // Set assignees checkboxes
        const assigneeInputs = document.querySelectorAll('.assignee-input');
        assigneeInputs.forEach(input => {
            input.checked = false;
        });
        
        const todoAssignees = todo.assignees || (todo.assignee ? [todo.assignee] : []);
        todoAssignees.forEach(assignee => {
            const input = document.querySelector(`.assignee-input[value="${assignee}"]`);
            if (input) {
                input.checked = true;
            }
        });

        // Set images
        this.currentImages = todo.images || [];
        this.updateImagePreviews();

        // Update modal title and button
        const modal = document.getElementById('todo-modal');
        const modalTitle = document.getElementById('modal-title');
        const saveBtn = document.getElementById('save-todo-btn');

        modalTitle.textContent = this.translations[this.currentLanguage]['edit-modal-title'];
        saveBtn.innerHTML = `💾 <span>${this.translations[this.currentLanguage]['update-todo-text']}</span>`;

        modal.classList.remove('hidden');
    }

    /**
     * Delete todo
     */
    async deleteTodo(todoId) {
        if (!confirm('Are you sure you want to delete this todo?')) {
            return;
        }

        try {
            this.showLoading(true);

            await window.supabaseClient.deleteTodo(todoId);

            // Remove from local todos array
            this.todos = this.todos.filter(t => t.id.toString() !== todoId.toString());

            this.renderTodos();
            this.showSuccess('Todo deleted successfully!');
            this.showLoading(false);

        } catch (error) {
            console.error('Error deleting todo:', error);
            this.showError('Failed to delete todo. Please try again.');
            this.showLoading(false);
        }
    }

    /**
     * View todo details
     */
    viewTodoDetails(todo) {
        document.getElementById('detail-title').textContent = todo.title;
        document.getElementById('detail-description').textContent = todo.description || 'No description';
        document.getElementById('detail-status').textContent = `Status: ${this.getStatusText(todo.status)}`;
        document.getElementById('detail-created').textContent = `Created: ${new Date(todo.created_at).toLocaleDateString()}`;

        const labelElement = document.getElementById('detail-label');
        labelElement.textContent = this.getLabelText(todo.label);
        labelElement.className = `todo-label ${todo.label}`;

        // Store current todo for editing/deleting
        this.currentEditingTodo = todo;

        document.getElementById('todo-detail-modal').classList.remove('hidden');
    }

    /**
     * Get status text in current language
     */
    getStatusText(status) {
        const statusKey = status === 'in-progress' ? 'progress-status-option' : `${status}-status-option`;
        return this.translations[this.currentLanguage][statusKey] || status;
    }

    /**
     * Edit current todo from detail modal
     */
    editCurrentTodo() {
        this.closeDetailModal();
        this.editTodo(this.currentEditingTodo.id);
    }

    /**
     * Delete current todo from detail modal
     */
    deleteCurrentTodo() {
        this.closeDetailModal();
        this.deleteTodo(this.currentEditingTodo.id);
    }

    /**
     * Close detail modal
     */
    closeDetailModal() {
        document.getElementById('todo-detail-modal').classList.add('hidden');
        this.currentEditingTodo = null;
    }

    /**
     * Show loading indicator
     */
    showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
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

        setTimeout(() => this.hideError(), 5000);
    }

    /**
     * Hide error message
     */
    hideError() {
        document.getElementById('error-toast').classList.add('hidden');
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        const successToast = document.getElementById('success-toast');
        const successMessage = document.getElementById('success-message');

        successMessage.textContent = message;
        successToast.classList.remove('hidden');

        setTimeout(() => this.hideSuccess(), 3000);
    }

    /**
     * Hide success message
     */
    hideSuccess() {
        document.getElementById('success-toast').classList.add('hidden');
    }
}

// Initialize the todos application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.todosApp = new TodosApp();
});