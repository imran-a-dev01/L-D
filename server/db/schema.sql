-- Enable Foreign Key constraints
PRAGMA foreign_keys = ON;

-- ============================================================================
-- 1. AUTHENTICATION & RBAC (Role-Based Access Control)
-- ============================================================================

CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,               -- 'SUPER_ADMIN', 'LND_ADMIN', 'PRACTICE_LEAD', 'EMPLOYEE'
    name TEXT NOT NULL UNIQUE,          -- 'Super Administrator', 'L&D Administrator', etc.
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY,               -- 'employee:create', 'employee:read', 'employee:update', 'employee:delete', 'skill:manage', etc.
    module TEXT NOT NULL,              -- 'WORKFORCE', 'TAXONOMY', 'ANALYTICS', 'SYSTEM'
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id TEXT NOT NULL,
    permission_id TEXT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,               -- 'USR_001', 'USR_002', etc.
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,       -- bcrypt hash
    role_id TEXT NOT NULL,
    employee_id TEXT UNIQUE,          -- Optional linked employee profile
    status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE', 'LOCKED')),
    last_login_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- 2. MASTER REFERENCE & DROPDOWN LOOKUP TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS business_units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS designations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    grade_level INTEGER
);

CREATE TABLE IF NOT EXISTS owlsure_designations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS current_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS deployable_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS managers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL DEFAULT '',
    UNIQUE(name, email)
);

CREATE TABLE IF NOT EXISTS skill_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS domains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    is_standard INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS proficiency_levels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS profile_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- ============================================================================
-- 3. CORE EMPLOYEE & SKILLS TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,               -- e.g. 'EMP001', 'EMP002'
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    designation TEXT NOT NULL,
    business_unit TEXT NOT NULL,
    reporting_manager TEXT NOT NULL,
    reporting_manager_email TEXT DEFAULT '',
    current_project TEXT,
    current_customer TEXT,
    location TEXT NOT NULL,
    total_experience REAL NOT NULL DEFAULT 0.0,
    current_role TEXT NOT NULL,
    owlsure_designation TEXT NOT NULL,
    profile_completion INTEGER DEFAULT 0 CHECK(profile_completion BETWEEN 0 AND 100),
    status TEXT DEFAULT 'In Progress' CHECK(status IN ('Complete', 'In Progress', 'Needs Review')),
    avatar_color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_deployable_roles (
    employee_id TEXT NOT NULL,
    role_name TEXT NOT NULL,
    PRIMARY KEY (employee_id, role_name),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,               -- 'react', 'spring-boot', 'aws', etc.
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    is_verified INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_skills (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    skill_name TEXT NOT NULL,
    category TEXT NOT NULL,
    proficiency TEXT NOT NULL CHECK(proficiency IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
    experience_years REAL NOT NULL DEFAULT 0.0,
    last_used TEXT NOT NULL,
    last_project TEXT,
    specialization TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, skill_name, category),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS employee_immediate_technologies (
    employee_id TEXT NOT NULL,
    technology_name TEXT NOT NULL,
    PRIMARY KEY (employee_id, technology_name),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS employee_learning_technologies (
    employee_id TEXT NOT NULL,
    technology_name TEXT NOT NULL,
    PRIMARY KEY (employee_id, technology_name),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS employee_domain_expertise (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    domain TEXT NOT NULL,
    custom_domain TEXT,
    experience_years REAL NOT NULL DEFAULT 0.0,
    proficiency TEXT NOT NULL CHECK(proficiency IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
    last_used TEXT NOT NULL,
    last_project TEXT,
    specialization TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- ============================================================================
-- 4. DAILY SNAPSHOTS (for trend computation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS daily_snapshots (
    snapshot_date TEXT NOT NULL UNIQUE,
    total_employees INTEGER NOT NULL DEFAULT 0,
    avg_completion REAL NOT NULL DEFAULT 0,
    verified_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. ROLE COMPETENCY REQUIREMENTS (for future skill gap analysis)
-- ============================================================================

CREATE TABLE IF NOT EXISTS role_competency_requirements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name TEXT NOT NULL,
    skill_name TEXT NOT NULL,
    min_proficiency TEXT NOT NULL CHECK(min_proficiency IN ('Beginner','Intermediate','Advanced','Expert')),
    is_mandatory INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_name, skill_name)
);

-- ============================================================================
-- 6. PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_bu ON employees(business_unit);
CREATE INDEX IF NOT EXISTS idx_employees_location ON employees(location);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employee_skills_emp ON employee_skills(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_skills_name ON employee_skills(skill_name);
CREATE INDEX IF NOT EXISTS idx_employee_domain_emp ON employee_domain_expertise(employee_id);
