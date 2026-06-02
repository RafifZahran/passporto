-- PassPorto PostgreSQL DDL Schema
-- Modernized Government Passport Application System MVP

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Auth & E-KYC Data)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nik VARCHAR(16) UNIQUE, -- National ID Number, filled during e-KYC/OCR
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'citizen', -- 'citizen', 'officer', 'admin'
    is_verified BOOLEAN NOT NULL DEFAULT FALSE, -- e-KYC status
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Immigration Offices Table (Kanim Locations)
CREATE TABLE immigration_offices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'KANIM_JAKSEL', 'KANIM_SOETTA'
    address TEXT NOT NULL,
    latitude NUMERIC(10, 8) NOT NULL, -- Geofencing coordinate
    longitude NUMERIC(11, 8) NOT NULL, -- Geofencing coordinate
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Quota Slots Table (Real-time Availability)
CREATE TABLE quota_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    office_id UUID NOT NULL REFERENCES immigration_offices(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 0,
    filled INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Prevent duplicate slots for the same office and date
    CONSTRAINT uq_office_date UNIQUE (office_id, date),
    -- Ensure filled quota never exceeds capacity (database-level guard against ghost quotas)
    CONSTRAINT chk_quota_limit CHECK (filled <= capacity)
);

-- 4. Applications Table (Passport Applications)
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    office_id UUID NOT NULL REFERENCES immigration_offices(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES quota_slots(id) ON DELETE SET NULL,
    nik VARCHAR(16) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    address TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Verified', 'Printing', 'Ready'
    queue_number VARCHAR(20), -- Generated post-geofencing check-in
    checked_in_at TIMESTAMP WITH TIME ZONE, -- Check-in timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Payments Table (Asynchronous Webhook & Status Tracking)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID UNIQUE NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Verified', 'Failed'
    reference_id VARCHAR(100) UNIQUE NOT NULL, -- Used to map transaction in webhook
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Waitlists Table (Real-time Slot Alerts)
CREATE TABLE waitlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    office_id UUID NOT NULL REFERENCES immigration_offices(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_notified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_office_date UNIQUE (user_id, office_id, date)
);

-- Indexes for performance and quick search
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_nik ON users(nik);
CREATE INDEX idx_quota_slots_date ON quota_slots(office_id, date);
CREATE INDEX idx_applications_user ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_payments_reference ON payments(reference_id);
CREATE INDEX idx_waitlists_search ON waitlists(office_id, date, is_notified);
