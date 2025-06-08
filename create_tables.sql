-- Create work_schedules table
CREATE TABLE IF NOT EXISTS work_schedules (
    id SERIAL PRIMARY KEY,
    member_name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_member_date_slot UNIQUE(member_name, date, time_slot)
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    member_name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    theme_preference VARCHAR(10) DEFAULT 'light',
    language_preference VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
    label VARCHAR(20) DEFAULT 'feature' CHECK (label IN ('feature', 'bug', 'improvement', 'urgent', 'design', 'documentation', 'testing', 'maintenance')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date DATE,
    assignees TEXT[], -- Array of assignee names
    images TEXT[], -- Array of image URLs/data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some sample data for testing
INSERT INTO work_schedules (member_name, date, time_slot) VALUES
('Mikey', CURRENT_DATE, 'Morning'),
('Pringlessman', CURRENT_DATE + 1, 'Afternoon')
ON CONFLICT (member_name, date, time_slot) DO NOTHING;

INSERT INTO user_profiles (member_name, display_name) VALUES
('Mikey', 'Mikey'),
('Pringlessman', 'Pringlessman')
ON CONFLICT (member_name) DO NOTHING;

INSERT INTO todos (title, description, status, label, priority, due_date, assignees, images) VALUES
('Setup Supabase Database', 'Create all necessary tables for the work schedule application', 'done', 'feature', 'high', CURRENT_DATE - 2, ARRAY['Mikey'], ARRAY[]::TEXT[]),
('Add Profile Pictures', 'Allow users to upload and manage profile pictures', 'in-progress', 'feature', 'medium', CURRENT_DATE + 3, ARRAY['Pringlessman'], ARRAY[]::TEXT[]),
('Test Todo Board', 'Verify drag and drop functionality works correctly', 'todo', 'testing', 'low', CURRENT_DATE + 7, ARRAY['Mikey', 'Pringlessman'], ARRAY[]::TEXT[]),
('Fix Dark Theme Issues', 'Resolve contrast problems in dark mode', 'todo', 'bug', 'high', CURRENT_DATE + 1, ARRAY[]::TEXT[], ARRAY[]::TEXT[]),
('Update Documentation', 'Add comprehensive user guide', 'todo', 'documentation', 'low', CURRENT_DATE + 14, ARRAY['Pringlessman'], ARRAY[]::TEXT[])
ON CONFLICT DO NOTHING;