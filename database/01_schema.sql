-- ========================================================
-- VEHICLE SERVICE CENTER DATABASE SCHEMA
-- Database: vehicle_service_prod
-- ========================================================

CREATE TABLE customer (
	customer_id SERIAL PRIMARY KEY,
	full_name VARCHAR(150) NOT NULL,
	phone VARCHAR(20), 
	email VARCHAR(150) UNIQUE,
	address TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vehicle (
	vehicle_id SERIAL PRIMARY KEY,
	vin VARCHAR(17) NOT NULL UNIQUE, -- Vehicle Identification Number
	license_plate VARCHAR(20) NOT NULL UNIQUE,
	make VARCHAR(80) NOT NULL,
	model VARCHAR(80) NOT NULL,
	year INT NOT NULL CHECK (year BETWEEN 1900 AND 2100),
	customer_id INT NOT NULL REFERENCES customer(customer_id) ON DELETE RESTRICT
);

CREATE TABLE mechanic (
	mechanic_id SERIAL PRIMARY KEY,
	full_name VARCHAR(50) NOT NULL,
	specialization VARCHAR(100),
	phone VARCHAR(20),
	hourly_rate NUMERIC(10,2) NOT NULL CHECK (hourly_rate > 0),
	status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave'))
);

CREATE TABLE service_job (
	job_id SERIAL PRIMARY KEY,
	vehicle_id INT NOT NULL REFERENCES vehicle(vehicle_id) ON DELETE RESTRICT,
	mechanic_id INT REFERENCES mechanic(mechanic_id) ON DELETE SET NULL,
	job_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
	total_labor_cost NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total_labor_cost >= 0),
	total_parts_cost NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total_parts_cost >= 0)
);

CREATE TABLE service_item (
	item_id SERIAL PRIMARY KEY,
	job_id INT NOT NULL REFERENCES service_job(job_id) ON DELETE CASCADE,
	description TEXT NOT NULL,
	labor_cost NUMERIC(10,2) NOT NULL CHECK (labor_cost >= 0)
);

CREATE TABLE inventory_part (
	part_id SERIAL PRIMARY KEY,
	part_name VARCHAR(150) NOT NULL,
	part_number VARCHAR(50) NOT NULL UNIQUE,
	unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price > 0),
	quantity_in_stock INT NOT NULL DEFAULT 0 CHECK (quantity_in_stock >= 0),
	reorder_level INT NOT NULL DEFAULT 0 CHECK (reorder_level >= 0)
);

CREATE TABLE job_part_usage (
	usage_id SERIAL PRIMARY KEY,
	job_id INT NOT NULL REFERENCES service_job(job_id) ON DELETE CASCADE,
	part_id INT NOT NULL REFERENCES inventory_part(part_id) ON DELETE RESTRICT,
	quantity_used INT NOT NULL CHECK (quantity_used > 0),
	unit_price_applied NUMERIC(10,2) NOT NULL CHECK (unit_price_applied >= 0),
	subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0)
);

CREATE TABLE invoice (
	invoice_id SERIAL PRIMARY KEY,
	job_id INT NOT NULL UNIQUE REFERENCES service_job(job_id) ON DELETE RESTRICT,
	invoice_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
	grand_total NUMERIC(10,2) NOT NULL CHECK (grand_total >= 0),
	payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid'))
);

CREATE TABLE payment (
	payment_id SERIAL PRIMARY KEY,
	invoice_id INT NOT NULL REFERENCES invoice(invoice_id) ON DELETE RESTRICT,
	payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	amount_paid NUMERIC(10,2) NOT NULL CHECK (amount_paid > 0),
	payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'mobile_banking'))
);

CREATE TABLE user_account (
	user_id SERIAL PRIMARY KEY,
	username VARCHAR(50) NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	role VARCHAR(30) NOT NULL CHECK (role IN ('system_admin', 'service_advisor', 'mechanic', 'customer')),
	customer_id INT REFERENCES customer(customer_id) ON DELETE SET NULL 
);

CREATE TABLE audit_log (
	audit_id SERIAL PRIMARY KEY,
	user_id INT REFERENCES user_account(user_id) ON DELETE SET NULL,
	operation VARCHAR(10) NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
	table_name VARCHAR(50) NOT NULL,
	record_id INT,
	action_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	old_value JSONB,
	new_value JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_vin ON vehicle(vin);
CREATE INDEX IF NOT EXISTS idx_vehicle_customer ON vehicle(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_job_status ON service_job(status);
CREATE INDEX IF NOT EXISTS idx_service_job_vehicle ON service_job(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_service_job_mechanic ON service_job(mechanic_id);
CREATE INDEX IF NOT EXISTS idx_job_part_usage_composite ON job_part_usage(job_id, part_id);
CREATE INDEX IF NOT EXISTS idx_inventory_part_number ON inventory_part(part_number);
CREATE INDEX IF NOT EXISTS idx_invoice_job ON invoice(job_id);
CREATE INDEX IF NOT EXISTS idx_payment_invoice ON payment(invoice_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
