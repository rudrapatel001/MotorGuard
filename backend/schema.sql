-- backend/schema.sql

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Engineer', 'Viewer')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE facilities (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE equipment (
    id SERIAL PRIMARY KEY,
    facility_id INT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    motor_type VARCHAR(100),
    rated_voltage NUMERIC,
    rated_current NUMERIC,
    rated_rpm INT,
    installation_date DATE,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE electrical_readings (
    id SERIAL PRIMARY KEY,
    equipment_id INT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    voltage NUMERIC NOT NULL,
    current NUMERIC NOT NULL,
    frequency NUMERIC NOT NULL,
    temperature NUMERIC NOT NULL,
    vibration NUMERIC NOT NULL,
    timestamp TIMESTAMP NOT NULL
);

CREATE TABLE fault_alerts (
    id SERIAL PRIMARY KEY,
    equipment_id INT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    parameter VARCHAR(50) NOT NULL, -- e.g., 'voltage', 'temperature'
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by INT REFERENCES users(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Essential Indexes for performance and tenant isolation
CREATE INDEX idx_users_customer ON users(customer_id);
CREATE INDEX idx_facilities_customer ON facilities(customer_id);
CREATE INDEX idx_equipment_facility ON equipment(facility_id);
CREATE INDEX idx_readings_equipment_time ON electrical_readings(equipment_id, timestamp DESC);
CREATE INDEX idx_alerts_unresolved ON fault_alerts(equipment_id, parameter) WHERE is_resolved = FALSE;