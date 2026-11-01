# Your Bank – Online Banking Platform (MERN)

React (Vite) + Node/Express + MongoDB + JWT. 3D UI built with CSS 3D transforms (tilt cards, flipping bank card, rotating vault cube, floating background cubes).

## Features
- Register / login (JWT, bcrypt) with a unique account number and virtual debit card
- Deposit, withdraw, transfer by account number (receiver name is verified first)
- Saved beneficiaries, transaction history with search, filters, pagination and CSV export
- Dashboard with 6-month income vs spending chart
- Card controls: flip, freeze / unfreeze, replace
- Loans: EMI calculator, instant approval, pay EMI, progress tracking
- Bill payments (electricity, water, mobile, internet, gas, DTH, insurance)
- Profile update and password change

New accounts receive a demo welcome bonus of ₹5,000.

## Admin access
An admin account is created automatically the first time the server starts (or run `npm run seed --prefix server`):

- Email: `admin@yourbank.com`
- Password: `Admin@123`

Change `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `server/.env` **before first start** (and change the password for any real use). If a user with `ADMIN_EMAIL` already exists, they are promoted to admin.

Admins get an extra sidebar section with:
- **Admin overview** – customer count, total deposits, transaction count, active loans, 7-day volume chart, newest customers
- **Manage users** – search, view details, suspend / reactivate, grant or remove admin, credit or debit a balance (reason required, logged as a transaction), delete a user
- **All activity** – every transaction (search and type filter) and every loan

Suspended users cannot log in. Admins cannot suspend, demote or delete themselves. All `/api/admin` routes require an admin JWT.

## Requirements
Node.js 18+ and MongoDB running locally (or a MongoDB Atlas URI).

## Run
```bash
npm run install-all          # installs root, server and client dependencies
# edit server/.env if your MongoDB URI is different
npm run dev                  # API on :5000, web app on :5173
```
Open http://localhost:5173 and create an account.

## Production
```bash
npm run build                # builds client/dist
NODE_ENV=production npm start   # Express serves API + built client on :5000
```

## Environment (server/.env)
| Variable | Purpose |
| --- | --- |
| PORT | API port (default 5000) |
| MONGO_URI | MongoDB connection string |
| JWT_SECRET | Secret for signing tokens (change it!) |
| CLIENT_URL | Allowed CORS origin (default http://localhost:5173) |

## API overview
`/api/auth` register, login, me, profile, password · `/api/bank` summary, transactions, deposit, withdraw, transfer, lookup, bills/pay · `/api/beneficiaries` · `/api/loans` · `/api/card` · `/api/admin` (admin only)

Money changes use atomic conditional updates (`balance >= amount`), so balances can never go negative.
This is a demo project: no real money or payment network is involved.
