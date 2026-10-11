# ApexCare: Vehicle Service Center Management System

A full-stack web application for running a vehicle workshop: customers and vehicles, service job cards, mechanic assignment, parts inventory, invoicing and payments, and an audit trail. Built with React, Express, and PostgreSQL, with business logic (triggers, views, functions, procedures) kept inside the database.

## Features

- Role-based access for four roles: `system_admin`, `service_advisor`, `mechanic`, `customer`
- JWT authentication with bcrypt-hashed passwords
- Service jobs: create job cards, assign mechanics, update status, record labor items and parts used
- Inventory: spare parts catalogue with stock levels and a low-stock view
- Billing: invoice generation per job, tax calculation, and payment tracking (unpaid / partial / paid)
- Audit log: invoice changes are captured automatically by a database trigger (admin only)
- Dashboard with workshop statistics

## Tech Stack

| Layer | Technology |
| ---   | ---        |
| Frontend | React 19, Vite, lucide-react |
| Backend | Node.js, Express 5, `pg` (connection pool, raw parameterized SQL), `jsonwebtoken`, `bcryptjs` |
| Database | PostgreSQL |

## Project Structure

```text
vehicle-service-center/
├── client/      React frontend (Vite dev server on port 3000)
├── server/      Express REST API (port 5000)
└── database/
    ├── 01_schema.sql              Tables, constraints, indexes
    ├── 02_seed.sql                Sample data and demo accounts
    └── 03_triggers_and_views.sql  Triggers, views, functions, procedures
```

## Database

Eleven tables: `customer`, `vehicle`, `mechanic`, `service_job`, `service_item`, `inventory_part`, `job_part_usage`, `invoice`, `payment`, `user_account`, `audit_log`.

Database objects in `03_triggers_and_views.sql`:

- Triggers: `trigger_update_part_stock` deducts stock when a part is used on a job; `trigger_audit_invoice_changes` logs invoice updates and deletions with old and new values
- Views: `active_service_jobs_view`, `low_stock_parts_view`
- Functions: `calculate_job_total`, `get_customer_total_spend`
- Procedures: `create_service_job`, `process_invoice_payment`

## Getting Started

### Prerequisites

- Node.js 18 or newer
- PostgreSQL 14 or newer

### 1. Set up the database

```bash
createdb -U postgres vehicle_service_prod
psql -U postgres -d vehicle_service_prod -f database/01_schema.sql
psql -U postgres -d vehicle_service_prod -f database/02_seed.sql
psql -U postgres -d vehicle_service_prod -f database/03_triggers_and_views.sql
```

Run the scripts in this order and only once. Re-running the seed against a populated database will fail on unique constraints.

### 2. Start the API

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Edit `server/.env` and set `DB_PASSWORD` to your Postgres password. If you used a different database name, update `DB_NAME` too. The API runs on `http://localhost:5000`, and `http://localhost:5000/api/health` should return `{"status":"OK"}`.

Useful scripts in `server/`:

- `npm run test-db` checks the database connection and prints table row counts
- `npm run reset-pwd` resets every user's password to `password123`

### 3. Start the frontend

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:3000`. Vite proxies `/api` requests to the backend on port 5000, so start the API first.

## Demo Accounts

All seeded accounts use the password `password123`.

| Username | Role |
| --- | --- |
| `admin1` | System Admin |
| `advisor1` | Service Advisor |
| `mech_acc1` | Mechanic |
| `cust_rahim` | Customer |

If login fails with "Invalid username or password", run `npm run reset-pwd` in `server/`.

## API Overview

| Route | Purpose |
| --- | --- |
| `/api/auth` | Login, registration, current user |
| `/api/dashboard` | Dashboard statistics |
| `/api/customers`, `/api/vehicles` | Customer and vehicle records |
| `/api/jobs` | Job cards, status updates, labor items, parts used |
| `/api/mechanics` | Mechanic records |
| `/api/inventory` | Spare parts and low-stock list |
| `/api/invoices` | Invoice generation and payments |
| `/api/audit` | Audit log (system admin only) |
| `/api/health` | Health check |

Write operations are restricted by role. Creating customers, vehicles, mechanics, parts, jobs, and invoices is limited to system admins and service advisors. Mechanics can update job status and record items and parts. Only system admins can read the audit log.

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `5000` | API port |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | none | Database password |
| `DB_HOST` | `localhost` | Database host |
| `DB_PORT` | `5432` | Database port |
| `DB_NAME` | `vehicle_service_prod` | Database name |
| `JWT_SECRET` | built-in fallback | Secret for signing tokens; set your own in production |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |

## Troubleshooting

- **Login page shows "Request failed with status 502":** the backend is not running or not reachable on port 5000. Start it with `npm run dev` in `server/` and check `/api/health`.
- **Server prints "running" and then exits:** the port is probably already in use. Find the process with `ss -ltnp | grep 5000`, or change `PORT` in `server/.env` and the proxy target in `client/vite.config.js`.