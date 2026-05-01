-- =====================================================
-- ETMS Database Schema with Role-Based Tables
-- =====================================================

-- 1. USERS TABLE (All users - Admin, Driver, Employee)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15),
    password_hash VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'driver', 'employee')),
    google_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100),
    designation VARCHAR(100),
    location VARCHAR(255),
    manager_id INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. DRIVERS TABLE
CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_expiry DATE,
    vehicle_id INTEGER,
    status VARCHAR(50) CHECK (status IN ('active', 'inactive', 'on_leave')),
    total_trips INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 5.00,
    earnings DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. VEHICLES TABLE
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    vehicle_type VARCHAR(100),
    make VARCHAR(100),
    model VARCHAR(100),
    capacity INTEGER,
    current_driver_id INTEGER REFERENCES drivers(id),
    status VARCHAR(50) CHECK (status IN ('active', 'inactive', 'maintenance')),
    maintenance_cost DECIMAL(10,2) DEFAULT 0,
    fuel_cost DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add vehicle_id foreign key to drivers
ALTER TABLE drivers 
ADD CONSTRAINT fk_driver_vehicle 
FOREIGN KEY (vehicle_id) REFERENCES vehicles(id);

-- 5. ROUTES TABLE
CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    route_name VARCHAR(255) NOT NULL,
    start_location VARCHAR(255) NOT NULL,
    end_location VARCHAR(255) NOT NULL,
    distance DECIMAL(10,2),
    estimated_duration INTEGER,
    assigned_driver_id INTEGER REFERENCES drivers(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    status VARCHAR(50) CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. TRIPS TABLE
CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    driver_id INTEGER REFERENCES drivers(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    route_id INTEGER REFERENCES routes(id),
    start_location VARCHAR(255),
    end_location VARCHAR(255),
    scheduled_time TIMESTAMP,
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    status VARCHAR(50) CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    cost DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES trips(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) CHECK (payment_method IN ('credit_card', 'debit_card', 'upi', 'wallet')),
    status VARCHAR(50) CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES trips(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    driver_id INTEGER REFERENCES drivers(id),
    feedback_type VARCHAR(50) CHECK (feedback_type IN ('appreciation', 'complaint', 'suggestion')),
    message TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. ADMIN_LOGS TABLE
CREATE TABLE IF NOT EXISTS admin_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES users(id),
    action VARCHAR(255),
    entity_type VARCHAR(100),
    entity_id INTEGER,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. DRIVER LOCATIONS TABLE - Real-time tracking
CREATE TABLE IF NOT EXISTS driver_locations (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    speed DECIMAL(5,2),
    heading DECIMAL(6,2),
    accuracy DECIMAL(6,2),
    trip_id INTEGER REFERENCES trips(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_trips_employee_id ON trips(employee_id);
CREATE INDEX idx_trips_driver_id ON trips(driver_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_routes_status ON routes(status);

-- =====================================================
-- Compatibility Columns Required By Current Backend
-- =====================================================
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS otp VARCHAR(10),
    ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP;

ALTER TABLE routes
    ADD COLUMN IF NOT EXISTS polyline TEXT,
    ADD COLUMN IF NOT EXISTS waypoints JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS max_passengers INTEGER,
    ADD COLUMN IF NOT EXISTS start_lat DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS start_lng DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS end_lat DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS end_lng DOUBLE PRECISION;

ALTER TABLE trips
    ADD COLUMN IF NOT EXISTS expected_completion_time TIMESTAMP,
    ADD COLUMN IF NOT EXISTS total_distance DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS total_duration INTEGER,
    ADD COLUMN IF NOT EXISTS match_method VARCHAR(50),
    ADD COLUMN IF NOT EXISTS otp VARCHAR(10),
    ADD COLUMN IF NOT EXISTS sequence_number INTEGER DEFAULT 1;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Admin User
INSERT INTO users (full_name, email, phone, password_hash, role, is_verified) 
VALUES ('Admin User', 'admin@etms.com', '9876543210', '$2b$10$BOeDd8LdjTbmXUQ4WuDvmO7u/M3HVI9.9CaV/.PBmJ2G2CgmReTlu', 'admin', true)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    is_verified = true;

-- Employee User
INSERT INTO users (full_name, email, phone, password_hash, role, is_verified) 
VALUES ('John Doe', 'john@company.com', '9123456789', '$2b$10$BOeDd8LdjTbmXUQ4WuDvmO7u/M3HVI9.9CaV/.PBmJ2G2CgmReTlu', 'employee', true)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    is_verified = true;

-- Driver User
INSERT INTO users (full_name, email, phone, password_hash, role, is_verified) 
VALUES ('Rajesh Kumar', 'rajesh@etms.com', '9876543210', '$2b$10$BOeDd8LdjTbmXUQ4WuDvmO7u/M3HVI9.9CaV/.PBmJ2G2CgmReTlu', 'driver', true)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    is_verified = true;

-- Add employee details
INSERT INTO employees (user_id, employee_id, department, designation, location)
SELECT id, 'EMP000', 'Engineering', 'Software Engineer', 'Bangalore'
FROM users WHERE email = 'john@company.com' AND NOT EXISTS (
    SELECT 1 FROM employees WHERE user_id = users.id
)
ON CONFLICT (employee_id) DO NOTHING;

-- Add driver details
INSERT INTO drivers (user_id, license_number, status, is_active)
SELECT id, 'DL-2025-0001', 'active', true
FROM users WHERE email = 'rajesh@etms.com' AND NOT EXISTS (
    SELECT 1 FROM drivers WHERE user_id = users.id
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
    feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('complaint', 'appreciation', 'suggestion')),
    message TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

-- Add average_rating column to drivers table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'drivers' AND column_name = 'average_rating'
    ) THEN
        ALTER TABLE drivers ADD COLUMN average_rating NUMERIC(3,2) DEFAULT 0;
    END IF;
END $$;

-- =====================================================
-- MOCK TRIP DATA (matching admin dashboard recentActivity)
-- =====================================================

-- Helper: Insert mock users if missing (for foreign key references)
INSERT INTO users (full_name, email, phone, password_hash, role) 
VALUES 
  ('Aarav Sharma', 'aarav.sharma@company.in', '9876543210', '$2a$10$xxxx', 'employee'),
  ('Rohan Patil', 'rohan.patil@company.in', '9123456789', '$2a$10$xxxx', 'employee'),
  ('Neha Kulkarni', 'neha.kulkarni@company.in', '9234567890', '$2a$10$xxxx', 'employee'),
  ('Pooja Verma', 'pooja.verma@company.in', '9345678901', '$2a$10$xxxx', 'employee'),
  ('Amit Joshi', 'amit.joshi@company.in', '9456789012', '$2a$10$xxxx', 'employee'),
  ('Ramesh Yadav', 'ramesh.yadav@etms.com', '9567890123', '$2a$10$xxxx', 'driver'),
  ('Suresh Pawar', 'suresh.pawar@etms.com', '9678901234', '$2a$10$xxxx', 'driver'),
  ('Mahesh Jadhav', 'mahesh.jadhav@etms.com', '9789012345', '$2a$10$xxxx', 'driver'),
  ('Sunil Gupta', 'sunil.gupta@etms.com', '9890123456', '$2a$10$xxxx', 'driver'),
  ('Prakash Reddy', 'prakash.reddy@etms.com', '9901234567', '$2a$10$xxxx', 'driver')
ON CONFLICT (email) DO NOTHING;

-- Helper: Insert employee/driver/vehicle links if missing
INSERT INTO employees (user_id, employee_id, department, designation, location)
SELECT u.id, 'EMP101', 'IT', 'Software Engineer', 'Andheri East, Mumbai'
FROM users u WHERE u.email = 'aarav.sharma@company.in' AND NOT EXISTS (
  SELECT 1 FROM employees e WHERE e.user_id = u.id
)
ON CONFLICT (employee_id) DO NOTHING;

INSERT INTO employees (user_id, employee_id, department, designation, location)
SELECT u.id, 'EMP102', 'HR', 'HR Executive', 'Powai, Mumbai'
FROM users u WHERE u.email = 'rohan.patil@company.in' AND NOT EXISTS (
  SELECT 1 FROM employees e WHERE e.user_id = u.id
)
ON CONFLICT (employee_id) DO NOTHING;

INSERT INTO employees (user_id, employee_id, department, designation, location)
SELECT u.id, 'EMP103', 'Finance', 'Accountant', 'Hinjewadi, Pune'
FROM users u WHERE u.email = 'neha.kulkarni@company.in' AND NOT EXISTS (
  SELECT 1 FROM employees e WHERE e.user_id = u.id
)
ON CONFLICT (employee_id) DO NOTHING;

INSERT INTO employees (user_id, employee_id, department, designation, location)
SELECT u.id, 'EMP104', 'Marketing', 'Marketing Manager', 'Whitefield, Bangalore'
FROM users u WHERE u.email = 'pooja.verma@company.in' AND NOT EXISTS (
  SELECT 1 FROM employees e WHERE e.user_id = u.id
)
ON CONFLICT (employee_id) DO NOTHING;

INSERT INTO employees (user_id, employee_id, department, designation, location)
SELECT u.id, 'EMP105', 'Operations', 'Operations Lead', 'Gachibowli, Hyderabad'
FROM users u WHERE u.email = 'amit.joshi@company.in' AND NOT EXISTS (
  SELECT 1 FROM employees e WHERE e.user_id = u.id
)
ON CONFLICT (employee_id) DO NOTHING;

INSERT INTO drivers (user_id, license_number, status, is_active)
SELECT u.id, 'DL-MH-001', 'active', true
FROM users u WHERE u.email = 'ramesh.yadav@etms.com' AND NOT EXISTS (
  SELECT 1 FROM drivers d WHERE d.user_id = u.id
);

INSERT INTO drivers (user_id, license_number, status, is_active)
SELECT u.id, 'DL-MH-002', 'active', true
FROM users u WHERE u.email = 'suresh.pawar@etms.com' AND NOT EXISTS (
  SELECT 1 FROM drivers d WHERE d.user_id = u.id
);

INSERT INTO drivers (user_id, license_number, status, is_active)
SELECT u.id, 'DL-MH-003', 'active', true
FROM users u WHERE u.email = 'mahesh.jadhav@etms.com' AND NOT EXISTS (
  SELECT 1 FROM drivers d WHERE d.user_id = u.id
);

INSERT INTO drivers (user_id, license_number, status, is_active)
SELECT u.id, 'DL-KA-001', 'active', true
FROM users u WHERE u.email = 'sunil.gupta@etms.com' AND NOT EXISTS (
  SELECT 1 FROM drivers d WHERE d.user_id = u.id
);

INSERT INTO drivers (user_id, license_number, status, is_active)
SELECT u.id, 'DL-TS-001', 'active', true
FROM users u WHERE u.email = 'prakash.reddy@etms.com' AND NOT EXISTS (
  SELECT 1 FROM drivers d WHERE d.user_id = u.id
);

-- Insert mock vehicles for drivers
INSERT INTO vehicles (vehicle_number, vehicle_type, make, model, capacity, status)
VALUES
  ('MH12AB1234', 'SUV', 'Toyota', 'Innova Crysta', 7, 'active'),
  ('MH14CD5678', 'MPV', 'Maruti', 'Ertiga', 7, 'active'),
  ('MH02EF9012', 'Van', 'Force', 'Urbania', 12, 'active'),
  ('KA05GH3456', 'Van', 'Tempo', 'Traveller', 12, 'active'),
  ('TS09IJ7890', 'SUV', 'Toyota', 'Innova Crysta', 7, 'active')
ON CONFLICT (vehicle_number) DO NOTHING;

-- Link drivers to vehicles (optional, for completeness)
UPDATE drivers SET vehicle_id = (SELECT id FROM vehicles WHERE vehicle_number = 'MH12AB1234') WHERE user_id = (SELECT id FROM users WHERE email = 'ramesh.yadav@etms.com');
UPDATE drivers SET vehicle_id = (SELECT id FROM vehicles WHERE vehicle_number = 'MH14CD5678') WHERE user_id = (SELECT id FROM users WHERE email = 'suresh.pawar@etms.com');
UPDATE drivers SET vehicle_id = (SELECT id FROM vehicles WHERE vehicle_number = 'MH02EF9012') WHERE user_id = (SELECT id FROM users WHERE email = 'mahesh.jadhav@etms.com');
UPDATE drivers SET vehicle_id = (SELECT id FROM vehicles WHERE vehicle_number = 'KA05GH3456') WHERE user_id = (SELECT id FROM users WHERE email = 'sunil.gupta@etms.com');
UPDATE drivers SET vehicle_id = (SELECT id FROM vehicles WHERE vehicle_number = 'TS09IJ7890') WHERE user_id = (SELECT id FROM users WHERE email = 'prakash.reddy@etms.com');

-- Insert mock trips matching recentActivity
INSERT INTO trips (
  employee_id, driver_id, vehicle_id,
  start_location, end_location,
  scheduled_time, status,
  created_at
)
SELECT
  e.id,
  d.id,
  v.id,
  'Andheri East',
  'BKC',
  '2026-01-10 08:30:00',
  'completed',
  NOW()
FROM employees e
JOIN users u ON u.id = e.user_id
JOIN drivers d ON d.user_id = (SELECT id FROM users WHERE email = 'ramesh.yadav@etms.com')
JOIN vehicles v ON v.vehicle_number = 'MH12AB1234'
WHERE u.email = 'aarav.sharma@company.in'
ON CONFLICT DO NOTHING;

INSERT INTO trips (
  employee_id, driver_id, vehicle_id,
  start_location, end_location,
  scheduled_time, status,
  created_at
)
SELECT
  e.id,
  d.id,
  v.id,
  'Powai',
  'Lower Parel',
  '2026-01-10 09:00:00',
  'in_progress',
  NOW()
FROM employees e
JOIN users u ON u.id = e.user_id
JOIN drivers d ON d.user_id = (SELECT id FROM users WHERE email = 'suresh.pawar@etms.com')
JOIN vehicles v ON v.vehicle_number = 'MH14CD5678'
WHERE u.email = 'rohan.patil@company.in'
ON CONFLICT DO NOTHING;

INSERT INTO trips (
  employee_id, driver_id, vehicle_id,
  start_location, end_location,
  scheduled_time, status,
  created_at
)
SELECT
  e.id,
  d.id,
  v.id,
  'Hinjewadi Phase 1',
  'Magarpatta',
  '2026-01-10 08:45:00',
  'completed',
  NOW()
FROM employees e
JOIN users u ON u.id = e.user_id
JOIN drivers d ON d.user_id = (SELECT id FROM users WHERE email = 'mahesh.jadhav@etms.com')
JOIN vehicles v ON v.vehicle_number = 'MH02EF9012'
WHERE u.email = 'neha.kulkarni@company.in'
ON CONFLICT DO NOTHING;

INSERT INTO trips (
  employee_id, driver_id, vehicle_id,
  start_location, end_location,
  scheduled_time, status,
  created_at
)
SELECT
  e.id,
  d.id,
  v.id,
  'Whitefield',
  'Electronic City',
  '2026-01-10 09:15:00',
  'scheduled',
  NOW()
FROM employees e
JOIN users u ON u.id = e.user_id
JOIN drivers d ON d.user_id = (SELECT id FROM users WHERE email = 'sunil.gupta@etms.com')
JOIN vehicles v ON v.vehicle_number = 'KA05GH3456'
WHERE u.email = 'pooja.verma@company.in'
ON CONFLICT DO NOTHING;

INSERT INTO trips (
  employee_id, driver_id, vehicle_id,
  start_location, end_location,
  scheduled_time, status,
  created_at
)
SELECT
  e.id,
  d.id,
  v.id,
  'Gachibowli',
  'HITEC City',
  '2026-01-10 08:00:00',
  'completed',
  NOW()
FROM employees e
JOIN users u ON u.id = e.user_id
JOIN drivers d ON d.user_id = (SELECT id FROM users WHERE email = 'prakash.reddy@etms.com')
JOIN vehicles v ON v.vehicle_number = 'TS09IJ7890'
WHERE u.email = 'amit.joshi@company.in'
ON CONFLICT DO NOTHING;
