# MiniLedger

Track money you've lent to friends — who owes you, how much, and what's overdue.

- **Server:** Node.js + TypeScript + Express + PostgreSQL (`server/`)
- **App:** Expo + React Native (`app/`) — one codebase that runs as a mobile app
  and as a web app. Phone: single-column iOS-style grouped design. Desktop
  (≥1024px): a real dashboard layout — KPI stat strip, loans list beside a
  summary rail, toolbar Add Loan button, centered sign-in. Light and dark mode.
- **Login:** phone number + mock OTP (the code is printed in the server log — no SMS in this build)
- **See `FILEMAP.md`** for what every file does, and `CONTRACT.md` for the API contract.

## Prerequisites

- Node.js 20+ and npm
- PostgreSQL running locally, with two databases:

```sql
CREATE DATABASE miniledger;
CREATE DATABASE miniledger_test;
```

## Server

```bash
cd server
cp .env.example .env      # defaults work with a local Postgres (postgres/postgres)
npm install
npm run dev               # runs migrations, listens on http://localhost:4000
```

Log in from the app, then read the OTP from the server console — it looks like:

```
[OTP] phone=+919876543210 code=123456
```

Other server commands:

```bash
npm test                  # 69 tests against miniledger_test
npm run build && npm start  # production-style run from dist/
```

## App

```bash
cd app
npm install
npx expo start            # scan the QR code with Expo Go, or press i / a / w
```

The app talks to `http://localhost:4000` by default. On a **physical phone**,
localhost is the phone itself — set your computer's LAN IP in
`app/src/config.ts` first (e.g. `http://192.168.1.10:4000`) and keep the phone
on the same Wi-Fi.

Typecheck: `npx tsc --noEmit`

## Deployment

### Backend (Docker)

The whole stack — PostgreSQL + API — runs with one command:

```bash
docker compose up --build
```

The API will be at `http://localhost:4000`. PostgreSQL data is persisted in a
Docker volume. Set a real `JWT_SECRET` in the environment or `.env` before
exposing the service publicly.

### Backend (Render)

1. Push this repo to GitHub.
2. Go to https://render.com/deploy?repo=https://github.com/sahilimamk/miniledger
   (or create a new Blueprint from the repo — `render.yaml` is included).
3. Render provisions a PostgreSQL database and a web service automatically.
4. The `JWT_SECRET` is generated for you; `DATABASE_URL` is wired from the
   database. The service runs migrations on every start.

### Frontend (web)

Build the Expo web app with your deployed API URL:

```bash
cd app
EXPO_PUBLIC_API_URL=https://your-api-url.onrender.com npx expo export --platform web
```

Deploy the `dist/` folder to Netlify (a `netlify.toml` is included), Vercel, or
any static host. Set `EXPO_PUBLIC_API_URL` as an environment variable in the
hosting dashboard so it's baked in at build time.

## Notes

- Amounts are stored in the database as integer paise; the API and app speak
  decimal rupees. Totals are computed in SQL and stay exact.
- Receipt photos are stored in `server/uploads/` and served at `/uploads/...`.
- The OTP store is in-memory by design (mock auth): restarting the server
  invalidates outstanding codes. `JWT_SECRET` has a dev default — set a real
  one in `.env` for anything beyond local development.
