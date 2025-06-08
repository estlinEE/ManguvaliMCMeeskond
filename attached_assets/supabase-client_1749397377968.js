/**
 * Enhanced Supabase Client Configuration
 * Handles database operations for work schedules, user profiles, and todos
 */

class SupabaseClient {
    constructor() {
        // Use authenticated Supabase connection
        const SUPABASE_URL = 'https://wkaxehfirlosvlmsikav.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYXhlaGZpcmxvc3ZsbXNpa2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwNjUxNjAsImV4cCI6MjA2MTY0MTE2MH0.z4dUw2fF5nI4586ROc-n-EiaVJemjWtUw29esGSxZkU';
        
        this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        this.schedulesTable = 'work_schedules';
        this.profilesTable = 'user_profiles';
        this.todosTable = 'todos';
        this.initialized = false;
    }

    /**
     * Initialize the database tables if they don't exist
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Check if tables exist by trying to select from them
            await this.checkAndInitializeTables();
            this.initialized = true;
        } catch (error) {
            console.log('Database initialization completed with fallback');
            this.initialized = true;
        }
    }

    /**
     * Check and initialize required tables
     */
    async checkAndInitializeTables() {
        const tables = [
            { name: this.schedulesTable, fallback: 'work_schedules' },
            { name: this.profilesTable, fallback: 'user_profiles' },
            { name: this.todosTable, fallback: 'todos' }
        ];

        for (const table of tables) {
            try {
                const { data, error } = await this.supabase
                    .from(table.name)
                    .select('id')
                    .limit(1);

                if (error && error.code === '42P01') {
                    console.log(`Table ${table.name} does not exist. Using localStorage fallback.`);
                }
            } catch (error) {
                console.log(`Table check completed for ${table.name}`);
            }
        }
    }

    /* =================== WORK SCHEDULES =================== */

    /**
     * Get all schedules for a date range
     */
    async getSchedules(startDate, endDate) {
        await this.initialize();
        
        const { data, error } = await this.supabase
            .from(this.schedulesTable)
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });

        if (error && error.code === '42P01') {
            return this.getSchedulesFromLocalStorage(startDate, endDate);
        }

        if (error) {
            console.error('Error fetching schedules:', error);
            return this.getSchedulesFromLocalStorage(startDate, endDate);
        }

        return data || [];
    }

    /**
     * Fallback: Get schedules from localStorage
     */
    getSchedulesFromLocalStorage(startDate, endDate) {
        const schedules = JSON.parse(localStorage.getItem('work_schedules') || '[]');
        return schedules.filter(schedule => 
            schedule.date >= startDate && schedule.date <= endDate
        );
    }

    /**
     * Add a new schedule entry
     */
    async addSchedule(memberName, date, timeSlot) {
        await this.initialize();

        // Check for Morning conflict
        if (timeSlot === 'Morning') {
            const existingMorning = await this.checkMorningConflict(memberName, date);
            if (existingMorning) {
                throw new Error(`${memberName} already has a Morning shift on ${date}`);
            }
        }

        const { data, error } = await this.supabase
            .from(this.schedulesTable)
            .insert([
                {
                    member_name: memberName,
                    date: date,
                    time_slot: timeSlot
                }
            ])
            .select();

        if (error && error.code === '42P01') {
            return this.addScheduleToLocalStorage(memberName, date, timeSlot);
        }

        if (error) {
            console.error('Error adding schedule:', error);
            if (error.code === '23505') {
                throw new Error(`${memberName} already has a ${timeSlot} shift on ${date}`);
            }
            return this.addScheduleToLocalStorage(memberName, date, timeSlot);
        }

        return data[0];
    }

    /**
     * Fallback: Add schedule to localStorage
     */
    addScheduleToLocalStorage(memberName, date, timeSlot) {
        const schedules = JSON.parse(localStorage.getItem('work_schedules') || '[]');
        
        // Check for duplicates
        const existing = schedules.find(s => 
            s.member_name === memberName && 
            s.date === date && 
            s.time_slot === timeSlot
        );
        
        if (existing) {
            throw new Error(`${memberName} already has a ${timeSlot} shift on ${date}`);
        }

        // Check for Morning conflict
        if (timeSlot === 'Morning') {
            const existingMorning = schedules.find(s => 
                s.member_name === memberName && 
                s.date === date && 
                s.time_slot === 'Morning'
            );
            if (existingMorning) {
                throw new Error(`${memberName} already has a Morning shift on ${date}`);
            }
        }
        
        const newSchedule = {
            id: Date.now(),
            member_name: memberName,
            date: date,
            time_slot: timeSlot,
            created_at: new Date().toISOString()
        };
        
        schedules.push(newSchedule);
        localStorage.setItem('work_schedules', JSON.stringify(schedules));
        
        return newSchedule;
    }

    /**
     * Delete a schedule entry
     */
    async deleteSchedule(id) {
        await this.initialize();

        const { error } = await this.supabase
            .from(this.schedulesTable)
            .delete()
            .eq('id', id);

        if (error && error.code === '42P01') {
            return this.deleteScheduleFromLocalStorage(id);
        }

        if (error) {
            console.error('Error deleting schedule:', error);
            return this.deleteScheduleFromLocalStorage(id);
        }
    }

    /**
     * Fallback: Delete schedule from localStorage
     */
    deleteScheduleFromLocalStorage(id) {
        const schedules = JSON.parse(localStorage.getItem('work_schedules') || '[]');
        const filteredSchedules = schedules.filter(s => s.id !== parseInt(id));
        localStorage.setItem('work_schedules', JSON.stringify(filteredSchedules));
    }

    /**
     * Check if member already has a Morning shift on the given date
     */
    async checkMorningConflict(memberName, date) {
        await this.initialize();

        const { data, error } = await this.supabase
            .from(this.schedulesTable)
            .select('id')
            .eq('member_name', memberName)
            .eq('date', date)
            .eq('time_slot', 'Morning')
            .limit(1);

        if (error && error.code === '42P01') {
            return this.checkMorningConflictInLocalStorage(memberName, date);
        }

        if (error) {
            console.error('Error checking morning conflict:', error);
            return this.checkMorningConflictInLocalStorage(memberName, date);
        }

        return data && data.length > 0;
    }

    /**
     * Fallback: Check morning conflict in localStorage
     */
    checkMorningConflictInLocalStorage(memberName, date) {
        const schedules = JSON.parse(localStorage.getItem('work_schedules') || '[]');
        return schedules.some(s => 
            s.member_name === memberName && 
            s.date === date && 
            s.time_slot === 'Morning'
        );
    }

    /* =================== USER PROFILES =================== */

    /**
     * Get user profile by member name
     */
    async getUserProfile(memberName) {
        await this.initialize();

        const { data, error } = await this.supabase
            .from(this.profilesTable)
            .select('*')
            .eq('member_name', memberName)
            .single();

        if (error && error.code === '42P01') {
            return this.getUserProfileFromLocalStorage(memberName);
        }

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching user profile:', error);
            return this.getUserProfileFromLocalStorage(memberName);
        }

        return data || this.getUserProfileFromLocalStorage(memberName);
    }

    /**
     * Get all user profiles
     */
    async getUserProfiles() {
        await this.initialize();

        const { data, error } = await this.supabase
            .from(this.profilesTable)
            .select('*');

        if (error && error.code === '42P01') {
            return this.getUserProfilesFromLocalStorage();
        }

        if (error) {
            console.error('Error fetching user profiles:', error);
            return this.getUserProfilesFromLocalStorage();
        }

        return data || [];
    }

    /**
     * Save or update user profile
     */
    async saveUserProfile(profileData) {
        await this.initialize();

        const { data, error } = await this.supabase
            .from(this.profilesTable)
            .upsert([profileData])
            .select();

        if (error && error.code === '42P01') {
            return this.saveUserProfileToLocalStorage(profileData);
        }

        if (error) {
            console.error('Error saving user profile:', error);
            return this.saveUserProfileToLocalStorage(profileData);
        }

        return data[0];
    }

    /**
     * Upload profile picture to Supabase Storage or fallback to data URL
     */
    async uploadProfilePicture(memberName, file) {
        // Always use data URL for reliable storage
        // This works consistently without requiring storage bucket setup
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                console.log('Profile picture converted to data URL for storage');
                resolve(e.target.result);
            };
            reader.onerror = (error) => {
                console.error('Error reading file:', error);
                reject(error);
            };
            reader.readAsDataURL(file);
        });
    }

    /**
     * Fallback: Get user profile from localStorage
     */
    getUserProfileFromLocalStorage(memberName) {
        const profiles = JSON.parse(localStorage.getItem('user_profiles') || '[]');
        return profiles.find(p => p.member_name === memberName) || {
            member_name: memberName,
            display_name: memberName,
            avatar_url: null
        };
    }

    /**
     * Fallback: Get all user profiles from localStorage
     */
    getUserProfilesFromLocalStorage() {
        return JSON.parse(localStorage.getItem('user_profiles') || '[]');
    }

    /**
     * Fallback: Save user profile to localStorage
     */
    saveUserProfileToLocalStorage(profileData) {
        const profiles = JSON.parse(localStorage.getItem('user_profiles') || '[]');
        const existingIndex = profiles.findIndex(p => p.member_name === profileData.member_name);
        
        if (existingIndex >= 0) {
            profiles[existingIndex] = { ...profiles[existingIndex], ...profileData };
        } else {
            profiles.push(profileData);
        }
        
        localStorage.setItem('user_profiles', JSON.stringify(profiles));
        return profileData;
    }

    /* =================== TODOS =================== */

    /**
     * Get all todos
     */
    async getTodos() {
        await this.initialize();

        const { data, error } = await this.supabase
            .from(this.todosTable)
            .select('*')
            .order('created_at', { ascending: false });

        if (error && error.code === '42P01') {
            return this.getTodosFromLocalStorage();
        }

        if (error) {
            console.error('Error fetching todos:', error);
            return this.getTodosFromLocalStorage();
        }

        return data || [];
    }

    /**
     * Add a new todo
     */
    async addTodo(todoData) {
        await this.initialize();

        const todo = {
            ...todoData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await this.supabase
            .from(this.todosTable)
            .insert([todo])
            .select();

        if (error && error.code === '42P01') {
            return this.addTodoToLocalStorage(todo);
        }

        if (error) {
            console.error('Error adding todo:', error);
            return this.addTodoToLocalStorage(todo);
        }

        return data[0];
    }

    /**
     * Update a todo
     */
    async updateTodo(id, updates) {
        await this.initialize();

        const todoUpdate = {
            ...updates,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await this.supabase
            .from(this.todosTable)
            .update(todoUpdate)
            .eq('id', id)
            .select();

        if (error && error.code === '42P01') {
            return this.updateTodoInLocalStorage(id, todoUpdate);
        }

        if (error) {
            console.error('Error updating todo:', error);
            return this.updateTodoInLocalStorage(id, todoUpdate);
        }

        return data[0];
    }

    /**
     * Delete a todo
     */
    async deleteTodo(id) {
        await this.initialize();

        const { error } = await this.supabase
            .from(this.todosTable)
            .delete()
            .eq('id', id);

        if (error && error.code === '42P01') {
            return this.deleteTodoFromLocalStorage(id);
        }

        if (error) {
            console.error('Error deleting todo:', error);
            return this.deleteTodoFromLocalStorage(id);
        }
    }

    /**
     * Fallback: Get todos from localStorage
     */
    getTodosFromLocalStorage() {
        return JSON.parse(localStorage.getItem('todos') || '[]');
    }

    /**
     * Fallback: Add todo to localStorage
     */
    addTodoToLocalStorage(todo) {
        const todos = this.getTodosFromLocalStorage();
        const newTodo = { ...todo, id: Date.now() };
        todos.push(newTodo);
        localStorage.setItem('todos', JSON.stringify(todos));
        return newTodo;
    }

    /**
     * Fallback: Update todo in localStorage
     */
    updateTodoInLocalStorage(id, updates) {
        const todos = this.getTodosFromLocalStorage();
        const index = todos.findIndex(t => t.id === parseInt(id) || t.id === id);
        
        if (index >= 0) {
            todos[index] = { ...todos[index], ...updates };
            localStorage.setItem('todos', JSON.stringify(todos));
            return todos[index];
        }
        
        return null;
    }

    /**
     * Fallback: Delete todo from localStorage
     */
    deleteTodoFromLocalStorage(id) {
        const todos = this.getTodosFromLocalStorage();
        const filteredTodos = todos.filter(t => t.id !== parseInt(id) && t.id !== id);
        localStorage.setItem('todos', JSON.stringify(filteredTodos));
    }

    /* =================== REAL-TIME SUBSCRIPTIONS =================== */

    /**
     * Subscribe to real-time changes
     */
    subscribeToChanges(callback) {
        const subscription = this.supabase
            .channel('work_schedule_changes')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: this.schedulesTable 
                }, 
                callback
            )
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: this.profilesTable 
                }, 
                callback
            )
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: this.todosTable 
                }, 
                callback
            )
            .subscribe();

        return subscription;
    }

    /**
     * Unsubscribe from changes
     */
    unsubscribe(subscription) {
        this.supabase.removeChannel(subscription);
    }
}

// Create global instance
window.supabaseClient = new SupabaseClient();
