# Architecture

The system uses a layered API-first design:

`React/Vite -> Express routes -> controllers -> services -> repositories/MySQL`

Controllers translate HTTP requests and responses. Services own business rules and database transactions. Repositories own query details. The frontend stores only the JWT and display state; MySQL is the source of truth.

## Inventory rules

- Raw Pinanitan and Washed Pinanitan use `BANGAN`.
- Bamboo Handle and Finished Broom use `PIECE`.
- Poly Cord stores a configurable unit such as `METER` or `ROLL`.
- Opening stock creates an `OPENING_STOCK` ledger row and updates the cached balance atomically.
- Future washing and production workflows must use `withTransaction`, lock inventory rows, validate balances, and write both business and ledger records before commit.

## Authentication

Passwords are stored as bcrypt hashes. Login returns a short-lived JWT containing the user id and role. Protected routes use bearer-token authentication, and role-sensitive actions use authorization middleware.

## Future modules

The schema includes foundations for suppliers, purchases, washing, labor, production, audit logs, sales, payments, deliveries, expenses, and reporting extensions. Part 2 can add services and routes without coupling them to the browser.

## Part 2 transaction relationships

- Washing consumes Raw Pinanitan in `BANGAN`, produces Washed Pinanitan in `BANGAN`, and optionally creates a linked labor record.
- Purchases create a purchase and purchase item, then increase the selected raw/processed material balance and write a `PURCHASE` ledger entry.
- Production consumes three actual quantities, including Poly Cord in its configured unit, writes material rows, creates any number of linked labor records, and produces Finished Broom in `PIECE`.
- Sales write immutable sale and sale-item rows, consume Finished Broom inventory regardless of payment status, and optionally create an initial payment.
- Payments are separate rows. A customer balance is `completed sale totals - payment totals`, so receipt history is never hidden by changing the original sale.

## Part 2 endpoints

`/api/washing`, `/api/laborers`, `/api/labor`, `/api/purchases`, `/api/production`, `/api/customers`, `/api/sales`, and `/api/payments` expose the workflow JSON contracts. Customer receivables are available through `/api/customers/:id/balance` and `/api/customers/:id/debts`.
