# MotorGuard – Multi-Tenant Industrial Equipment Monitoring

MotorGuard is a centralized, multi-tenant IoT platform built to monitor industrial electric motors. It features a robust, concurrent backend architecture, a real-time fault detection engine, and a React-based analytics dashboard.

## Architecture Overview

- **Backend:** Go (Fiber framework) selected for high-concurrency telemetry ingestion and minimal memory footprint. Organized into modular layers (handlers, database, models, middleware, routes).
- **Database:** PostgreSQL, utilizing fully normalized tables with strictly enforced foreign keys and cascading deletes. `golang-migrate` is used for schema version control.
- **Frontend:** React (Vite) + TypeScript, styled with Tailwind CSS, and visualizing telemetry via Recharts. Organized with React Router for protected navigation.
- **Tenant Isolation Strategy:** Multi-tenancy is enforced strictly at the database query level. Every protected API route extracts the user's `customer_id` from their JWT. All `SELECT`, `UPDATE`, and `DELETE` queries dynamically `JOIN` the target record against the `facilities` table to ensure the `customer_id` matches the token. Data hiding on the frontend is purely cosmetic; backend queries physically block cross-tenant access.

## Setup Instructions

### Prerequisites

- Docker & Docker Compose
- Go (1.20+)
- Node.js (18+) & npm

### 1. Database Setup

Start the PostgreSQL container:

```bash
docker-compose up -d
```

### 2. Backend Setup

Navigate to the backend directory, install dependencies, and run the server. (The application will automatically run the `.up.sql` migrations on startup).

```bash
cd backend
go mod tidy
go run main.go
```

_The backend will be running on http://localhost:8080_

### 3. Frontend Setup

Navigate to the frontend directory, install dependencies, and start the development server.

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

_The frontend will be running on http://localhost:5173_

---

## 🛡️ Mandatory Edge Cases Addressed (Section 6)

**1. Can Organization A access Organization B's equipment?**
No. All equipment retrieval/modification queries inherently enforce `WHERE facilities.customer_id = $1` (where `$1` is extracted from the JWT). An Org A user querying Org B's equipment ID will receive a `404 Not Found` or `403 Unauthorized`, as the SQL JOIN yields zero rows.

**2. What happens when voltage is 500V?**
The telemetry payload is ingested successfully. The Fault Engine evaluates the reading synchronously. Since 500V is outside the normal range (380-440V), a `CRITICAL` alert is generated in the `fault_alerts` table.

**3. What happens when current is negative?**
If a reading reports negative current (e.g., -5A), the Fault Engine triggers a `HIGH` severity alert because it falls outside the normal bounds of (0-15 A).

**4. What happens when equipment ID does not exist?**
The telemetry ingestion API (`POST /api/readings`) performs a validation check against the database before insertion. If the ID does not exist (or doesn't belong to the user's tenant), the API rejects the payload with a `403 Invalid equipment or unauthorized access`.

**5. Can two identical unresolved alerts be generated?**
No. The Fault Engine uses a database-level lock/check mechanism. Before creating a new alert (e.g., for Overheating), it queries `SELECT id FROM fault_alerts WHERE equipment_id = $1 AND parameter = $2 AND is_resolved = FALSE`. If a row is found, it silently skips creating a duplicate.

**6. What happens when the database connection fails?**
The Go backend utilizes Fiber's error handling. If `db.Query` fails due to a dropped connection, the API safely catches the error, avoids a panic, and returns a `500 Internal Server Error` with `{"error": "Database error"}` to the client.

**7. Can an engineer delete equipment?**
No. The `DELETE /api/equipment/:id` endpoint explicitly checks the `role` claim in the user's JWT. If the role is not `Admin`, it immediately returns a `403 Forbidden`. The UI also hides the delete button for non-admins.

**8. What happens when 1,000 readings arrive simultaneously?**
The Go Fiber backend handles high concurrency inherently using lightweight goroutines. The PostgreSQL database connection uses `database/sql`'s built-in connection pooling to efficiently manage concurrent `INSERT` locks, ensuring no data is dropped without blocking the main thread.

**9. How do you prevent duplicate telemetry submissions?**
Telemetry is inherently time-series data. We allow multiple insertions if they represent different physical events. However, the system relies on the composite nature of the `timestamp` and `equipment_id` which can be strictly enforced via a `UNIQUE` constraint in Postgres to reject exact duplicates.

**10. What happens when historical readings are requested for an invalid date range?**
If an invalid range is requested (e.g., `start` > `end`), the API executes the query, but the database safely returns `0` rows. The API returns an empty JSON array `[]` to the frontend, which the UI (Recharts) handles gracefully by displaying a blank chart without crashing.
