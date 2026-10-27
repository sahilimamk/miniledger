# MiniLedger — File Map (what is what)

Every file has one job. To change a behaviour, edit the one file listed for it.

## Root

| File | What it is |
|---|---|
| `CONTRACT.md` | The fixed API contract between app and server. Change this first if the API changes. |
| `README.md` | Setup and run instructions. |
| `FILEMAP.md` | This file. |

## Server — `server/` (Node.js + TypeScript + PostgreSQL)

| File | What it does |
|---|---|
| `src/index.ts` | Entry point only: runs migrations, starts listening. |
| `src/app.ts` | Assembles the Express app: JSON parsing, `/uploads` static files, routes, error handler. |
| `src/config/env.ts` | Reads environment variables (`DATABASE_URL`, `PORT`, `JWT_SECRET`) with dev defaults. |
| `src/db/pool.ts` | The PostgreSQL connection pool. Also makes `DATE` columns come back as plain `YYYY-MM-DD` strings (no timezone drift). |
| `src/db/migrate.ts` | Runs any unapplied `.sql` files from `migrations/` in order. |
| `migrations/001_init.sql` | Creates the `users` and `loans` tables. |
| `src/middleware/auth.ts` | Checks the JWT on protected routes; rejects with 401. Also confirms the user in the token actually exists. |
| `src/middleware/cors.ts` | CORS headers so the web build can call the API from a browser (native apps don't need it). |
| `src/middleware/upload.ts` | Receipt photo upload rules: images only, max 5 MB, saved to `uploads/`. |
| `src/middleware/errorHandler.ts` | Turns errors into the `{ "error": "..." }` JSON shape. |
| `src/modules/auth/auth.routes.ts` | `POST /auth/request-otp`, `POST /auth/verify-otp`. |
| `src/modules/auth/auth.service.ts` | OTP logic: 6-digit code, 5-minute expiry, stored in memory, printed to the server log with `[OTP]` prefix. Issues the JWT. |
| `src/modules/auth/auth.validators.ts` | Phone number validation. |
| `src/modules/loans/loans.routes.ts` | Loan endpoints: create, list, get, edit, repay, delete, receipt upload. |
| `src/modules/loans/loans.service.ts` | All loan SQL. Every query is scoped to the logged-in user. Computes `isOverdue`. |
| `src/modules/loans/loans.validators.ts` | Loan input rules: name length, amount range/decimals, valid date. |
| `src/modules/loans/loans.types.ts` | Loan types shared inside the server. |
| `src/modules/summary/summary.routes.ts` | `GET /summary`. |
| `src/modules/summary/summary.service.ts` | The summary maths (total lent / repaid / outstanding / overdue) as one SQL aggregate. |
| `src/utils/money.ts` | The single rupees ↔ paise conversion point. Amounts are stored as integer paise so totals never drift. |
| `src/utils/imageSniff.ts` | Checks a receipt file's actual bytes (magic numbers) — only real JPEG/PNG/WebP/GIF images pass, whatever the file claims to be. |
| `src/utils/dates.ts` | "Today" and overdue logic. |
| `src/utils/httpError.ts` | Small error type carrying an HTTP status. |
| `src/utils/validate.ts` | Shared helper that turns validation failures into 400 responses. |
| `tests/auth.test.ts` | OTP + login tests (12). |
| `tests/loans.test.ts` | Loan CRUD, validation, repay, isolation, receipt tests (35). |
| `tests/summary.test.ts` | Summary maths tests (5). |
| `tests/regressions.test.ts` | One test per defect found in adversarial QA (15): forged tokens, disguised uploads, OTP brute-force limit, sub-paise amounts, oversized bodies, receipt file cleanup, ancient dates. |
| `tests/helpers.ts` | Test setup: fresh DB, login helper. |
| `uploads/` | Receipt photos land here (gitignored except `.gitkeep`). |

## App — `app/` (Expo + React Native)

| File | What it does |
|---|---|
| `App.tsx` | Entry point only: providers + navigator. |
| `src/config.ts` | `API_BASE_URL` — where the app finds the server. Change this to your computer's LAN IP to run on a physical phone. |
| `src/navigation/RootNavigator.tsx` | Chooses login screens vs main screens based on whether you're logged in. |
| `src/navigation/types.ts` | Screen names and their parameters. |
| `src/api/types.ts` | `User`, `Loan`, `Summary` types — mirror `CONTRACT.md`. |
| `src/api/client.ts` | Fetch wrapper: adds the login token, turns server errors into readable messages. |
| `src/api/auth.ts` | `requestOtp`, `verifyOtp` calls. |
| `src/api/loans.ts` | Loan calls: list, create, edit, repay, delete, receipt upload, summary. |
| `src/auth/AuthContext.tsx` | Login state for the whole app; restores the session on launch. |
| `src/auth/storage.ts` | Saves the session token on the device. |
| `src/screens/LoginScreen.tsx` | Phone number entry → sends OTP. Country-code selector (default +91) + national number, visible label, focus-ring card, desktop side panel via AuthLayout. |
| `src/screens/OtpScreen.tsx` | Six digit boxes over one hidden input; auto-submits on the 6th digit; 60s resend countdown; invalid vs expired inline errors; masked number + edit-number action; demo banner ONLY when the server explicitly declared demo mode (legacy code-without-flag is discarded, never shown); desktop side panel via AuthLayout. |
| `src/components/AuthLayout.tsx` | Shared auth shell: centered form on narrow screens; form + product-info side panel at ≥1024px. |
| `src/components/CountryCodePicker.tsx` | Country-code selector (RN Modal list, no new dependency). |
| `src/hooks/usePrefersReducedMotion.ts` | `prefers-reduced-motion` hook (web matchMedia; false on native). |
| `src/components/SummaryCard.tsx` | Wallet-style hero card (phone): real LinearGradient, count-up outstanding amount, repaid progress bar, frosted "Next due" strip, icon stat row below. |
| `src/components/Avatar.tsx` | Circular initials badge with a two-colour gradient pair hashed from the borrower's name. |
| `src/components/CountUp.tsx` | Money figure that counts up (ease-out, rAF) — hero amounts on SummaryCard + desktop StatStrip. |
| `src/components/DriftingBlobs.tsx` | Auth screens' ambient background: two faint colour blobs drifting on slow Reanimated loops. |
| `src/components/LoansSkeleton.tsx` | Loans-home loading placeholder shaped like the real screen, gently pulsing. |
| `src/screens/LoansScreen.tsx` | The Loans route (v11): the full loan list only — no summary/hero (that's Overview's job). Pull to refresh, + button; desktop renders LoansDesktop. |
| `src/screens/OverviewScreen.tsx` | The Overview route (v11): dashboard — loads loans + summary; desktop renders OverviewDesktop, phone shows SummaryCard + Needs attention + recent loans + View all loans. |
| `src/components/OverviewDesktop.tsx` | Desktop Overview (v11): page head, StatStrip, Needs attention + Recent loans (≤4) + View all, Next due rail card. Owns GroupedCard/SectionTitle/AttentionRow. |
| `src/screens/AddLoanScreen.tsx` | Add-a-loan form (friend, amount, due date, note, optional receipt photo). |
| `src/screens/LoanDetailScreen.tsx` | One loan: details, receipt photo, Mark Repaid, Delete (with confirmation). |
| `src/components/SummaryCard.tsx` | Wallet-style gradient hero card (phone): outstanding amount, repaid progress bar, icon stat row below. |
| `src/components/LoanRow.tsx` | One loan row: initials avatar, name + due date, status dot, colour-coded amount; Reanimated cascade-in + press spring; web keyboard focus ring (tintText outline). |
| `src/components/Avatar.tsx` | Circular initials badge; colour hashed from the borrower's name. |
| `src/components/Entrance.tsx` | One-shot entrance wrapper on Reanimated (FadeInDown spring, stagger via delay). |
| `src/components/Toast.tsx` | Burnt-style toast system: ToastProvider + useToast().show() — top pill, icon badge, auto-dismiss; host sits above the navigator. Success (2.6s) + error variant (red, 5s, tap to dismiss) for form/action errors; blocking choices stay on Alert, load failures keep the retry banner. Toast text is a polite live region so screen readers announce it. |
| `src/components/GlassFieldCard.tsx` | Auth field card with real glassmorphism: expo-blur frosts the gradient blobs through a translucent wash. |
| `src/components/GroupedSection.tsx` | The iOS inset-grouped card container used everywhere. |
| `src/components/Screen.tsx` | Page wrapper: safe areas + grouped background. Narrow: centered column (680px forms/auth, 1080px dashboard). ≥900px with a `nav` prop: app shell — NavRail on the left, content centered beside it (stack header hides). |
| `src/components/StatStrip.tsx` | Desktop KPI row (Overview only, v11): four stat cards, differentiated — semantic top accent bar each; hero (outstanding) and active-overdue cards larger (flex 1.3, bigger type/padding, prominentShadow); share bars for outstanding/repaid/overdue; uppercase tracked labels; radius 12. |
| `src/components/LoansDesktop.tsx` | Desktop Loans page (v11): pure list — page head with count line (N loans · M pending · K overdue) + Add Loan button, full LoanRow list, empty state. No stat cards (they live on Overview). |
| `src/utils/confirm.ts` | `confirmAction` (v11): cross-platform confirm dialog — Alert on native, `window.confirm` on web (RN Alert is a no-op on web; this is why Log out/Delete appeared dead). |
| `src/hooks/useMainNav.ts` | `mainNav(navigation, active)` (v11): shared rail wiring for the main screens — Overview/Loans/Add are real routes. |
| `src/hooks/useIsWide.ts` | Desktop breakpoint hook (≥1024px) that switches layouts; below it nothing changes. |
| `src/components/NavRail.tsx` | App-shell rail (≥900px): gradient brand, Overview / Loans / Add Loan destinations (active item gets a tint accent tick, v11), signed-in phone + Log out at the bottom (confirm via `utils/confirm.ts`). Rail items are 44px targets with web keyboard focus rings; account line uses the readable secondary label. |
| `src/hooks/useRailLayout.ts` | Rail breakpoint hook (≥900px) — the shell breakpoint, below the 1024px dashboard breakpoint. |
| `src/theme/elevation.ts` | Shared card shadows: `cardShadow` (v11 retune: 0/4/14, 0.38 dark) + `prominentShadow` for hero/alert cards. |
| `src/theme/scrollbar.ts` | Web-only global scrollbar theme (v12): injects one stylesheet from App.tsx — 8px thin, transparent track, muted violet-grey thumb #4E4A6B (hover #665F8C), rounded; webkit pseudo-elements + Firefox scrollbar-width/color. No-op on native. |
| `src/components/TextField.tsx` | Form field: stacked label over a filled well, optional leading icon (v9), inline error under. Focus turns the border emerald; placeholder uses the readable secondary label. |
| `src/components/PrimaryButton.tsx` | The main button (and destructive variant). |
| `src/components/EmptyState.tsx` | "No loans yet" style placeholder. |
| `src/components/LoadingView.tsx` | Full-screen spinner. |
| `src/components/ErrorBanner.tsx` | Red error strip. |
| `src/components/AppIcon.tsx` | Icons: real SF Symbols on iOS, Ionicons elsewhere. |
| `src/theme/colors.ts` | iOS system colours, light and dark palettes. Change the look here. |
| `src/theme/spacing.ts` | Spacing scale. |
| `src/theme/typography.ts` | Text sizes/weights (system font — SF Pro on iOS). |
| `src/theme/useTheme.ts` | Picks the light/dark palette from the device setting. |
| `src/utils/format.ts` | ₹ formatting with Indian digit grouping (`₹12,34,567.50`) and date display. |
| `src/utils/validation.ts` | Form validation mirroring the server rules. |
