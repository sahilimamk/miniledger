# MiniLedger — progress log

Public project history: what changed, in order. No private notes, machine
paths, credentials, or personal data belong in this file.

## Product

MiniLedger tracks money lent to friends: loans with friend, amount, due
date, and note; overdue / due-soon / active / repaid states; optional
receipt photo; phone + mock-OTP sign-in. Stack: Expo + React Native app,
Express + PostgreSQL API. Theme: light navy-emerald, Inter, no gradients.

## 2026-10-22

- Distinct Overview and Loans destinations (previously one route served
  both): Overview got a stat strip, Needs attention, Recent loans, View
  all, and Next due; Loans became a pure list. Shared nav-rail wiring;
  log out and delete moved to a cross-platform confirm (the native alert
  dialog is unimplemented on web, so it had silently done nothing there).
- Themed web scrollbar (thin muted thumb) to match the app theme.

## 2026-10-23

- Light navy-emerald theme pass: flat accent, white cards, soft navy-grey
  elevation, zero gradients.
- Themed confirm dialogs for log out and delete; auto-hiding scrollbar;
  Add Loan field hierarchy (friend + amount required, phone / note
  optional, due date picker); card size variance, top accent bars, and
  share bars kept. Overview is a real dashboard route, distinct from Loans.

## 2026-10-27

- Demo OTP gate: the server returns a sign-in code only when explicitly
  in demo mode (`DEMO_AUTH=true`); otherwise it returns `{ ok, demo:
  false }` and logs nothing. The client shows a code only when the server
  explicitly declares `demo: true` — a legacy response carrying a code
  with no flag has its code discarded, never rendered or logged.
- Sign-in repair: desktop two-column auth layout with info panel, visible
  Phone number label, country-code selector (+91 default, full-number
  normalization), focus rings on inputs / code boxes / buttons, contrast
  fixes, reduced-motion support; expired codes unlock resend immediately.
- Quality pass: strict demo-code rule (above); OTP boxes tap-to-focus fix
  on web (digit boxes no longer intercept taps meant for the hidden
  input); form focus / contrast polish (readable placeholders, emerald
  focus borders, 44px targets, section header roles, toast live region,
  reduced-motion respected by counters, row entrances, and the FAB pulse);
  AddLoan receipt / photo failures use toasts instead of the
  web-unimplemented alert dialog, and a saved loan always navigates back;
  duplicated country codes typed into the phone field are normalized
  away; the date-picker month controls no longer close the modal; the
  country-picker dismiss layer is no longer a keyboard trap; remaining
  focus rings added (demo banner, FAB, desktop Add / View-all buttons,
  loan-detail actions, error retry, date-picker controls, toast dismiss);
  white-on-emerald buttons and WhatsApp action darkened to AA contrast;
  loan-detail phone editor focus border and readable placeholder;
  dashboard loads loans and summary independently so a summary-only
  failure no longer hides loaded loans; large money figures shrink to
  fit instead of overflowing at narrow desktop widths.
- Wide-screen auth layout: above 1440px the auth shell scales up (form
  620, panel 460) so the sign-in page no longer reads as a narrow strip
  in the middle of a large screen.
- Verification: app typecheck clean, server tests 76/76, Expo web export
  clean; auth screenshots at 375 / 768 / 890 / 1280 / 1440 / 1920 and
  dashboard / loans / detail / add-loan at 375 / 1280 with zero
  horizontal overflow; demo banner present with a demo-on server, absent
  for legacy and demo-off responses at all auth widths.
