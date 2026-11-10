# Broom Business Management System

Part 1 establishes an API-first foundation for a broom manufacturing business. It preserves the business unit `BANGAN` for raw and washed Pinanitan, tracks inventory through an auditable ledger, and provides a responsive React admin shell.

## Structure

- `backend/`: Express REST API, services, repositories, controllers, middleware, and configuration.
- `frontend/`: React/Vite web application. It consumes the backend API and contains no authoritative business calculations.
- `database/`: MySQL schema, development seed data, and future migrations.
- `docs/`: architecture and mobile-readiness notes.

## Run Locally

Prerequisites: Node.js 20+, npm, and MySQL 8+.

1. Create the database with `mysql -u root -p < database/schema.sql`.
2. Apply development definitions with `mysql -u root -p KevsBroom < database/seed.sql`.
3. Copy `backend/.env.example` to `backend/.env` and set local values.
4. Run `npm run install:all` from the project root.
5. Start the API with `npm run dev:backend`.
6. Start the web app with `npm run dev:frontend`.

The API runs at `http://localhost:5008`; the web app runs at `http://localhost:5182`. The frontend uses same-origin `/api` requests and Vite proxies them to the backend. For access from another device on the same network, find this computer's LAN IP (for example, with `ipconfig`) and open `http://<LAN-IP>:5182`; Windows Firewall must allow inbound TCP traffic on port `5182`. When deploying the frontend and API separately, set `VITE_API_URL` to the API base (including `/api`) and set the backend `CLIENT_URL` to the frontend origin.

Seed accounts are development-only: `owner` and `employee`, both using password `broom-dev-2026`. Never reuse this password outside local development.

## API

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/inventory`
- `POST /api/inventory/opening-stock` (OWNER)
- `GET|POST /api/washing`, `/api/laborers`, `/api/labor`, `/api/purchases`, `/api/production`, `/api/customers`, `/api/sales`, and `/api/payments`
- `GET|POST /api/suppliers`
- `GET|POST|PUT /api/deliveries`
- `GET|POST /api/expenses`, including gasoline entries
- `GET|POST /api/employee-advances` and `POST /api/employee-advances/:id/payments`
- `GET /api/reports/{dashboard,daily,monthly,yearly,inventory,production}` and `GET /api/history`
- `GET /api/customers/:id/balance` and `/api/customers/:id/debts`

All write operations that change stock, sales, customers, suppliers, labor, or employee advances require the OWNER role. Authenticated employees can view records and manage deliveries and expenses.

All responses use `{ success, message, data }` on success and `{ success, message, error }` on failure.

Part 2 transactions lock inventory rows and write their business record, inventory ledger entries, labor/payment records, and audit event inside one MySQL transaction. Sale balances are calculated from the immutable sale total minus separate payment rows.

## Mobile Readiness

The REST API, service layer, and MySQL database are independent of the React frontend. A future Flutter application can use the same authenticated JSON endpoints without moving business rules into the mobile client.
