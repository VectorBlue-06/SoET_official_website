# Supabase Database Setup for Admin Dashboard

## Required Tables

### 1. admin_users (Already exists)
This table stores admin user credentials.

```sql
-- This should already exist from previous setup
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow authenticated users to read admin_users"
ON admin_users FOR SELECT
USING (auth.role() = 'authenticated');
```

### 2. announcements
This table stores all announcements that admin can manage.

```sql
CREATE TABLE IF NOT EXISTS announcements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Admission', 'Exam', 'Event', 'Notice', 'Important')),
    description TEXT NOT NULL,
    date DATE NOT NULL,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Policies for announcements
-- Allow everyone to read announcements
CREATE POLICY "Allow public read access to announcements"
ON announcements FOR SELECT
USING (true);

-- Allow authenticated users (admins) to insert announcements
CREATE POLICY "Allow authenticated users to insert announcements"
ON announcements FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users (admins) to update announcements
CREATE POLICY "Allow authenticated users to update announcements"
ON announcements FOR UPDATE
USING (auth.role() = 'authenticated');

-- Allow authenticated users (admins) to delete announcements
CREATE POLICY "Allow authenticated users to delete announcements"
ON announcements FOR DELETE
USING (auth.role() = 'authenticated');

-- Create index for better performance
CREATE INDEX idx_announcements_date ON announcements(date DESC);
CREATE INDEX idx_announcements_category ON announcements(category);
```

### 3. students
This table stores student information organized by branch and semester.

```sql
CREATE TABLE IF NOT EXISTS students (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    enrollment_no TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    branch TEXT NOT NULL CHECK (branch IN (
        'Computer Science',
        'Electronics',
        'Mechanical',
        'Civil',
        'Electrical',
        'Information Technology'
    )),
    semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 8),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Policies for students
-- Allow everyone to read students (for public display)
CREATE POLICY "Allow public read access to students"
ON students FOR SELECT
USING (true);

-- Allow authenticated users (admins) to insert students
CREATE POLICY "Allow authenticated users to insert students"
ON students FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users (admins) to update students
CREATE POLICY "Allow authenticated users to update students"
ON students FOR UPDATE
USING (auth.role() = 'authenticated');

-- Allow authenticated users (admins) to delete students
CREATE POLICY "Allow authenticated users to delete students"
ON students FOR DELETE
USING (auth.role() = 'authenticated');

-- Create indexes for better query performance
CREATE INDEX idx_students_branch ON students(branch);
CREATE INDEX idx_students_semester ON students(semester);
CREATE INDEX idx_students_enrollment ON students(enrollment_no);
CREATE INDEX idx_students_branch_semester ON students(branch, semester);
```

## Setup Instructions

1. **Access Supabase Dashboard**
   - Go to https://supabase.com
   - Login to your project
   - Navigate to "SQL Editor"

2. **Create Tables**
   - Copy and paste each CREATE TABLE statement above
   - Run them one by one
   - Verify tables are created in "Table Editor"

3. **Insert Sample Data (Optional)**

```sql
-- Sample announcements
INSERT INTO announcements (title, category, description, date, link) VALUES
('New Admission Open 2025-26', 'Admission', 'Applications are now open for B.Tech and M.Tech programs for the academic year 2025-26. Last date to apply: March 31, 2025.', '2025-01-15', 'https://vikram.mponline.gov.in'),
('End Semester Exam Schedule', 'Exam', 'End semester examinations for all branches will commence from April 15, 2025. Time table will be announced soon.', '2025-03-10', NULL),
('Annual Tech Fest - Code_d_Code 2025', 'Event', 'Join us for the biggest technical fest of the year! Exciting competitions, workshops, and guest lectures. Register now!', '2025-02-20', NULL);

-- Sample students
INSERT INTO students (name, enrollment_no, email, phone, branch, semester, address) VALUES
('Rahul Sharma', '2024CS001', 'rahul.sharma@soet.ac.in', '+91 9876543210', 'Computer Science', 5, 'Ujjain, MP'),
('Priya Patel', '2024CS002', 'priya.patel@soet.ac.in', '+91 9876543211', 'Computer Science', 5, 'Indore, MP'),
('Amit Kumar', '2024ME001', 'amit.kumar@soet.ac.in', '+91 9876543212', 'Mechanical', 3, 'Bhopal, MP'),
('Sneha Verma', '2024EC001', 'sneha.verma@soet.ac.in', '+91 9876543213', 'Electronics', 7, 'Ujjain, MP');
```

4. **Verify Setup**
   - Check that all tables appear in "Table Editor"
   - Verify RLS policies are enabled
   - Test by inserting sample data

## Important Notes

- **Authentication**: Make sure you have admin users set up in Supabase Authentication with emails matching the `admin_users` table
- **RLS Policies**: Row Level Security ensures only authenticated admins can modify data
- **Indexes**: Created indexes improve query performance for filtering by branch and semester
- **Data Validation**: CHECK constraints ensure data integrity for categories and semesters

## Troubleshooting

If you encounter errors:
1. Check if tables already exist (drop and recreate if needed)
2. Verify Supabase project is active
3. Ensure RLS is enabled on all tables
4. Check that authentication is properly configured
