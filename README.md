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

The API runs at `http://localhost:5008`; the web app runs at `http://localhost:5182`. For access from another device on the same network, find this computer's LAN IP (for example, with `ipconfig`) and open `http://<LAN-IP>:5182`. Vite proxies the browser's `/api` requests to the backend, so the frontend does not need to be rebuilt for that IP. Windows Firewall must allow inbound TCP traffic on port `5182`.

Seed accounts are development-only: `owner` and `employee`, both using password `broom-dev-2026`. Never reuse this password outside local development.

## Part 1 API

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/inventory`
- `POST /api/inventory/opening-stock` (OWNER)
- `GET|POST /api/washing` (POST is OWNER-only)
- `GET|POST /api/laborers` and `GET|POST /api/labor`
- `GET|POST /api/purchases`
- `GET|POST /api/production`
- `GET|POST /api/customers`
- `GET|POST /api/sales`
- `GET|POST /api/payments`
- `GET /api/customers/:id/balance`
- `GET /api/customers/:id/debts`

All responses use `{ success, message, data }` on success and `{ success, message, error }` on failure.

Part 2 transactions lock inventory rows and write their business record, inventory ledger entries, labor/payment records, and audit event inside one MySQL transaction. Sale balances are calculated from the immutable sale total minus separate payment rows.

## Mobile Readiness

The REST API, service layer, and MySQL database are independent of the React frontend. A future Flutter application can use the same authenticated JSON endpoints without moving business rules into the mobile client.
