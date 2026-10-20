# MiniLedger — Shared API Contract (owned by Lead Architect)

Product: track money lent to friends. One user lends money; each entry is a loan
to a friend with an amount and a due date; a loan is either pending or repaid.
Overdue = pending AND due_date < today (server-local date).

## Money

- API speaks decimal rupees as JSON numbers (e.g. 250.50).
- DB stores integer paise in `amount_cents` (BIGINT) — never floats in the DB.
- Conversion lives in one place: server `src/utils/money.ts`, app `src/utils/format.ts`.

## Auth (mock OTP)

- `POST /auth/request-otp` body `{ "phone": "+919876543210" }`
  → `200 { "ok": true }`. Server generates a 6-digit OTP, stores it in an
  in-memory map with a 5-minute expiry, and prints it to the server log
  (mock — no SMS). Phone must be 10–15 digits, optional leading `+`.
- `POST /auth/verify-otp` body `{ "phone": "...", "code": "123456" }`
  → `200 { "token": "<jwt>", "user": { "id": "<uuid>", "phone": "..." } }`.
  User row is created on first verify. Wrong/expired code → `401`.
- All routes below require header `Authorization: Bearer <token>`.
  Missing/invalid token → `401 { "error": "unauthorized" }`.

## Loans

Loan JSON (exact field names, camelCase):

```json
{
  "id": "uuid",
  "friendName": "Aman",
  "amount": 250.5,
  "dueDate": "2026-11-01",
  "note": "for books",
  "receiptUrl": "/uploads/abc.jpg",
  "repaid": false,
  "repaidAt": null,
  "isOverdue": false,
  "createdAt": "2026-10-21T16:00:00.000Z"
}
```

`note` and `receiptUrl` may be `null`. `isOverdue` is computed by the server.

- `POST /loans` body `{ friendName, amount, dueDate, note? }` → `201` loan.
  Validation: friendName non-empty, ≤ 80 chars; amount > 0, ≤ 10,000,000,
  max 2 decimal places; dueDate valid `YYYY-MM-DD`. Violations → `400 { "error": "<msg>" }`.
- `GET /loans` → `200 { "loans": [ ... ] }`, newest first.
- `GET /loans/:id` → loan or `404`.
- `PATCH /loans/:id` body any of `{ friendName, amount, dueDate, note }` → updated loan.
- `POST /loans/:id/repay` → loan with `repaid: true`, `repaidAt` set. Repaying twice → `409`.
- `DELETE /loans/:id` → `204`. Missing → `404`.
- `POST /loans/:id/receipt` multipart form field `receipt` (image, ≤ 5 MB)
  → `200` updated loan with `receiptUrl`. Files stored under `server/uploads/`,
  served at `/uploads/<file>`.

A user only ever sees their own loans (every query filters by user_id).

## Summary

- `GET /summary` →

```json
{
  "totalLent": 1000.0,
  "totalRepaid": 400.0,
  "outstanding": 600.0,
  "overdueAmount": 150.0,
  "counts": { "total": 4, "repaid": 1, "pending": 3, "overdue": 1 }
}
```

## Errors

All errors: `{ "error": "<human readable message>" }` with a sensible status code.

## Data model (PostgreSQL)

- `users(id UUID PK DEFAULT gen_random_uuid(), phone TEXT UNIQUE NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`
- `loans(id UUID PK DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, friend_name TEXT NOT NULL, amount_cents BIGINT NOT NULL CHECK (amount_cents > 0), due_date DATE NOT NULL, note TEXT, receipt_url TEXT, repaid_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`

## Environment (server)

`.env`: `DATABASE_URL` (default `postgres://postgres:postgres@localhost:5432/miniledger`),
`PORT` (default 4000), `JWT_SECRET` (dev default allowed, documented as dev-only).
Tests use `DATABASE_URL_TEST` → database `miniledger_test`.
