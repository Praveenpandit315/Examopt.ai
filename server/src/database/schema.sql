-- ExamOpt AI - Relational Database Schema (SQLite)
-- Team Commit2Win - GLA HackVision 2.0 (University Master Data & Constraint Optimization)

PRAGMA foreign_keys = ON;

-- 1. Users & Authentication (Supports Firebase UID & Role Authorization)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'student')),
    full_name TEXT NOT NULL,
    firebase_uid TEXT UNIQUE DEFAULT NULL,
    account_status TEXT NOT NULL DEFAULT 'active' CHECK(account_status IN ('active', 'suspended', 'pending')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Academic Departments (University Master Data)
CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    building TEXT DEFAULT '',
    head_name TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Academic Programs / Degrees
CREATE TABLE IF NOT EXISTS academic_programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    department_id INTEGER DEFAULT NULL,
    degree_level TEXT DEFAULT 'Undergraduate',
    total_semesters INTEGER DEFAULT 6,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- 4. Student Profiles
CREATE TABLE IF NOT EXISTS student_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    roll_number TEXT UNIQUE NOT NULL,
    program TEXT NOT NULL,
    semester INTEGER NOT NULL,
    section TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Student Groups / Cohorts
CREATE TABLE IF NOT EXISTS student_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    program TEXT NOT NULL,
    semester INTEGER NOT NULL,
    section TEXT NOT NULL,
    student_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Group Memberships
CREATE TABLE IF NOT EXISTS group_memberships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, group_id),
    FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE
);

-- 7. Faculty Members
CREATE TABLE IF NOT EXISTS faculty (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    department_id INTEGER DEFAULT NULL,
    designation TEXT DEFAULT 'Assistant Professor',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- 8. Faculty Availability & Ineligibility Windows
CREATE TABLE IF NOT EXISTS faculty_availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    faculty_id INTEGER NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD
    start_time TEXT NOT NULL, -- HH:MM
    end_time TEXT NOT NULL, -- HH:MM
    is_available INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
);

-- 9. Subject Catalogue
CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    department_id INTEGER DEFAULT NULL,
    credits INTEGER DEFAULT 3,
    required_room_type TEXT DEFAULT 'classroom',
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- 10. Student Course / Paper Enrollments (Individual Registration)
CREATE TABLE IF NOT EXISTS student_course_enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_profile_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    academic_term TEXT NOT NULL, -- e.g. '2026-Odd'
    status TEXT DEFAULT 'enrolled',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_profile_id, subject_id, academic_term),
    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- 11. University Blocks / Campus Buildings
CREATE TABLE IF NOT EXISTS university_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    campus_zone TEXT DEFAULT 'Main Campus',
    total_floors INTEGER DEFAULT 4,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. Examination Venues & Rooms
CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    building TEXT NOT NULL,
    block_id INTEGER DEFAULT NULL,
    room_name TEXT NOT NULL,
    room_type TEXT NOT NULL CHECK(room_type IN ('classroom', 'computer_lab', 'specialized')),
    capacity INTEGER NOT NULL CHECK(capacity > 0),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (block_id) REFERENCES university_blocks(id) ON DELETE SET NULL
);

-- 13. Physical Room Seats (Seat Layouts)
CREATE TABLE IF NOT EXISTS room_seats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    seat_number TEXT NOT NULL, -- e.g. 'R101-A01'
    row_label TEXT NOT NULL,   -- e.g. 'A'
    column_index INTEGER NOT NULL, -- e.g. 1
    is_functional INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, seat_number),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- 14. Room Unavailability (Maintenance / Blackout Windows)
CREATE TABLE IF NOT EXISTS room_unavailability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD
    start_time TEXT NOT NULL, -- HH:MM
    end_time TEXT NOT NULL, -- HH:MM
    reason TEXT NOT NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- 15. Exam Time Slots & Institutional Windows
CREATE TABLE IF NOT EXISTS exam_time_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slot_name TEXT NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD
    start_time TEXT NOT NULL, -- HH:MM
    end_time TEXT NOT NULL, -- HH:MM
    is_blocked INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, start_time, end_time)
);

-- 16. Named Session Presets (Regular Semester, Mid-Semester, Practical, Custom)
CREATE TABLE IF NOT EXISTS session_presets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    preset_name TEXT UNIQUE NOT NULL,
    preset_type TEXT NOT NULL CHECK(preset_type IN ('regular', 'mid_term', 'practical', 'custom')),
    description TEXT DEFAULT '',
    config_json TEXT NOT NULL DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 17. Exam Sessions (Scope Configuration for Scheduling)
CREATE TABLE IF NOT EXISTS exam_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    academic_term TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    departments_filter TEXT DEFAULT '[]', -- JSON array of department codes
    programs_filter TEXT DEFAULT '[]',    -- JSON array of program codes
    semesters_filter TEXT DEFAULT '[]',   -- JSON array of semester numbers
    allowed_blocks_filter TEXT DEFAULT '[]', -- JSON array of block codes
    daily_start_time TEXT DEFAULT '09:00',
    daily_end_time TEXT DEFAULT '17:00',
    slot_duration_minutes INTEGER DEFAULT 120,
    break_duration_minutes INTEGER DEFAULT 30,
    allowed_days TEXT DEFAULT '["Mon","Tue","Wed","Thu","Fri","Sat"]',
    is_deadline_mandatory INTEGER NOT NULL DEFAULT 0,
    preset_id INTEGER DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'configured', 'scheduled', 'published', 'archived')),
    published_schedule_id INTEGER DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (preset_id) REFERENCES session_presets(id) ON DELETE SET NULL,
    FOREIGN KEY (published_schedule_id) REFERENCES schedule_versions(id) ON DELETE SET NULL
);

-- 18. Scheduled Examinations / Papers
CREATE TABLE IF NOT EXISTS examinations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    subject_id INTEGER NOT NULL,
    program TEXT NOT NULL,
    semester INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 120,
    required_room_type TEXT NOT NULL DEFAULT 'classroom' CHECK(required_room_type IN ('classroom', 'computer_lab', 'specialized')),
    block_id INTEGER DEFAULT NULL,
    fixed_date TEXT DEFAULT NULL,
    fixed_start_time TEXT DEFAULT NULL,
    fixed_room_id INTEGER DEFAULT NULL,
    session_id INTEGER DEFAULT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (block_id) REFERENCES university_blocks(id) ON DELETE SET NULL,
    FOREIGN KEY (fixed_room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE SET NULL
);

-- 19. Exam - Group Associations (Many-to-Many)
CREATE TABLE IF NOT EXISTS exam_group_relations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    UNIQUE(exam_id, group_id),
    FOREIGN KEY (exam_id) REFERENCES examinations(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE
);

-- 20. Individual Student Enrollments in Exams
CREATE TABLE IF NOT EXISTS exam_enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    UNIQUE(exam_id, student_id),
    FOREIGN KEY (exam_id) REFERENCES examinations(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
);

-- 21. Institutional Rules & Constraints Configuration
CREATE TABLE IF NOT EXISTS institutional_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_key TEXT UNIQUE NOT NULL,
    rule_name TEXT NOT NULL,
    rule_value TEXT NOT NULL,
    description TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1
);

-- 22. Schedule Versions (Draft, Approved, Published, Archived)
CREATE TABLE IF NOT EXISTS schedule_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    strategy TEXT NOT NULL CHECK(strategy IN ('first_fit', 'smart_backtracking', 'rescue', 'manual')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'approved', 'published', 'archived')),
    session_id INTEGER DEFAULT NULL,
    total_exams INTEGER NOT NULL DEFAULT 0,
    scheduled_exams INTEGER NOT NULL DEFAULT 0,
    unscheduled_exams INTEGER NOT NULL DEFAULT 0,
    hard_conflicts INTEGER NOT NULL DEFAULT 0,
    seating_utilization REAL NOT NULL DEFAULT 0.0,
    execution_time_ms REAL NOT NULL DEFAULT 0.0,
    created_by INTEGER NOT NULL,
    published_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE SET NULL
);

-- 23. Schedule Assignments
CREATE TABLE IF NOT EXISTS schedule_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_version_id INTEGER NOT NULL,
    exam_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    exam_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    is_valid INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(schedule_version_id, exam_id),
    FOREIGN KEY (schedule_version_id) REFERENCES schedule_versions(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES examinations(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- 24. Individual Student Seat Allocations (Post-Scheduling)
CREATE TABLE IF NOT EXISTS student_seat_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_assignment_id INTEGER NOT NULL,
    student_profile_id INTEGER NOT NULL,
    seat_id INTEGER NOT NULL,
    seat_label TEXT NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(schedule_assignment_id, student_profile_id),
    UNIQUE(schedule_assignment_id, seat_id),
    FOREIGN KEY (schedule_assignment_id) REFERENCES schedule_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES room_seats(id) ON DELETE CASCADE
);

-- 25. Scheduling Conflict Logs & Diagnostics
CREATE TABLE IF NOT EXISTS scheduling_conflicts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_version_id INTEGER NOT NULL,
    conflict_code TEXT NOT NULL,
    conflict_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('high', 'medium', 'low')),
    affected_exam_ids_json TEXT NOT NULL DEFAULT '[]',
    affected_room_id INTEGER DEFAULT NULL,
    affected_group_id INTEGER DEFAULT NULL,
    reason TEXT NOT NULL,
    evidence TEXT NOT NULL,
    possible_steps TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_version_id) REFERENCES schedule_versions(id) ON DELETE CASCADE,
    FOREIGN KEY (affected_room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    FOREIGN KEY (affected_group_id) REFERENCES student_groups(id) ON DELETE SET NULL
);

-- 26. In-App Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT NULL, -- NULL = broadcast to all users
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('info', 'warning', 'reschedule', 'publish')),
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 27. University Data Hub: Import Batches
CREATE TABLE IF NOT EXISTS data_import_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_code TEXT UNIQUE NOT NULL,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK(file_type IN ('csv', 'xlsx', 'zip')),
    entity_type TEXT NOT NULL,
    total_records INTEGER NOT NULL DEFAULT 0,
    valid_records INTEGER NOT NULL DEFAULT 0,
    error_records INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'staged' CHECK(status IN ('staged', 'committed', 'rejected', 'failed')),
    summary_json TEXT DEFAULT '{}',
    created_by INTEGER DEFAULT NULL,
    committed_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 28. University Data Hub: Staging Records
CREATE TABLE IF NOT EXISTS data_import_staging (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER NOT NULL,
    row_index INTEGER NOT NULL,
    entity_type TEXT NOT NULL,
    raw_data_json TEXT NOT NULL,
    is_valid INTEGER NOT NULL DEFAULT 1,
    error_message TEXT DEFAULT NULL,
    FOREIGN KEY (batch_id) REFERENCES data_import_batches(id) ON DELETE CASCADE
);

-- 29. University Data Hub: Saved Column Mappings
CREATE TABLE IF NOT EXISTS import_column_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    source_column TEXT NOT NULL,
    target_field TEXT NOT NULL,
    is_saved_template INTEGER NOT NULL DEFAULT 1,
    UNIQUE(entity_type, source_column)
);

-- 30. Audit Logs & Publication History
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT DEFAULT NULL,
    details_json TEXT DEFAULT '{}',
    ip_address TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_assignments_version ON schedule_assignments(schedule_version_id);
CREATE INDEX IF NOT EXISTS idx_assignments_date_room ON schedule_assignments(exam_date, room_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_exam ON exam_enrollments(exam_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON exam_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_stu ON student_course_enrollments(student_profile_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_sub ON student_course_enrollments(subject_id);
CREATE INDEX IF NOT EXISTS idx_unavailability_room ON room_unavailability(room_id, date);
CREATE INDEX IF NOT EXISTS idx_staging_batch ON data_import_staging(batch_id);
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
CREATE INDEX IF NOT EXISTS idx_programs_code ON academic_programs(code);
CREATE INDEX IF NOT EXISTS idx_faculty_code ON faculty(code);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_code ON exam_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_seats_room ON room_seats(room_id);
CREATE INDEX IF NOT EXISTS idx_student_seats_assign ON student_seat_assignments(schedule_assignment_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
