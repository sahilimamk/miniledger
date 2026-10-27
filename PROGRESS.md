# MiniLedger — progress log

Timestamped work log (BTASM convention). Newest entries last.

## 2026-10-22

- ~03:35 IST — v7 deployed to the ThinkPad (`~/Desktop/MiniProj/miniledger-v7`,
  API :4000 / Expo web :8083) and verified live from the laptop. Zip:
  `your_files/miniledger-v7.zip`. Full v7 details in FILEMAP.md.
- ~05:05 IST — Sahil approved the v8 "Remind on WhatsApp" feature and asked
  for a complete project brief for Claude. Brief written to the Jarvis Bridge
  mailbox: `gdrive:Jarvis Bridge/claude/MINILEDGER_BRIEF.md`; FROM_MUSE.md
  updated to point at it.
- ~05:15 IST — TO_MUSE.md (from Claude via Sahil) picked up: frontend-only
  layout pass, ship as a new version, screenshot-verified at ~1366px and
  ~400px. Sequenced AFTER v8 so it never touches v8's backend/feature work.
- ~05:19 IST — v8 server done: migration `002_friend_phone.sql`
  (`loans.friend_phone TEXT`), validators (10–15 digits, spaces stripped),
  create/PATCH support, 4 new tests — suite 73/73 green. Local note: this
  VM's Postgres had been reset again (cluster down, password unset);
  repaired by restarting the cluster and re-setting the postgres password.
- ~05:21 IST — v8 app done: optional "Friend's phone" field in Add Loan
  (validated, normalized before send); Loan Detail shows a Phone row when
  set, a green "Remind on WhatsApp" action for unpaid loans with a phone
  (opens wa.me with a polite prefilled message — overdue and not-yet-due
  variants — never auto-sends), and an inline add-phone editor for loans
  without one. App `tsc --noEmit` clean; local API restarted on the new
  build (migration applied at boot).
- ~05:23 IST — v8 web export running for the screenshot pass.
- ~06:35 IST — v8 verified end-to-end (API round-trip + full puppeteer UI
  flow; screenshots v8-*.png). Deployed to the ThinkPad as
  `~/Desktop/MiniProj/miniledger-v8` (zip in Drive + your_files) and verified
  live from the laptop: web 200, OTP 200 with correct CORS header, API log
  shows migration 002 applied to his real DB. v7 folder untouched.
- ~05:35 IST — v8 deployed + verified live on the ThinkPad (see above).
  Sahil asked "did u eve made any fucking changes" — answered with the v8
  screenshots; the home screen is intentionally unchanged, the feature
  lives in Add Loan + Loan Detail.
- ~06:40–07:15 IST — v9 layout pass (TO_MUSE 2026-10-22) built: NavRail app
  shell ≥900px (new components/NavRail.tsx, hooks/useRailLayout.ts,
  Screen nav prop; stack headers hide in rail mode), StatStrip rewritten
  as 4 icon stat cards with a rose warning state for Overdue, "At a
  glance" removed → Next due card (+ all-clear state), shared
  theme/elevation.ts card shadows (LoanRow, GroupedSection, stat cards,
  desktop cards), TextField/DateField leading icons, receipt dropzone
  slimmed to a row, Save pinned in a sticky footer, empty-state icon
  swapped to people. Palette/Inter/gradient untouched; backend untouched.
- ~07:20 IST — v9 screenshot loop complete at 1366 + 400 against every
  TO_MUSE item (screenshots v9-desktop-{loans,addloan,detail,empty}.png,
  v9-mobile-{loans,addloan}.png). One iteration: empty-state card now
  spans full width (rail hidden when there are no loans). App tsc clean.
- ~07:30 IST — miniledger-v9.zip shipped to Drive; laptop deploy launched.
- ~07:35 IST — v9 deployed to the ThinkPad (`~/Desktop/MiniProj/miniledger-v9`)
  and verified live from the laptop: web 200, OTP 200, API listening, bundle
  compiled. MINILEDGER_BRIEF.md updated (v9 current, §6 shell notes, §9
  shipped) and re-uploaded to the bridge mailbox; FROM_MUSE.md updated.
  TO_MUSE layout pass: CLOSED.
- ~07:47 IST — v10 stat-card color pass (Sahil's spec, relaying the laptop
  review): icons corrected (Still to be repaid = clock, Total lent =
  wallet, Repaid = filled check, Overdue = warning triangle), badge tints
  split from value colors (violet / blue-grey #8494B8 / green / rose, rose
  muted to grey at ₹0), dark card fill lifted #13161D → #181C28, shadows
  strengthened (0.5 opacity, 20 radius). Verified locally with real
  overdue/upcoming/repaid data: screenshots v10-desktop-loans.png,
  v10-statrow-closeup.png, v10-mobile-loans.png — Overdue card red with a
  real overdue loan, all four badges distinct, cards visibly above the bg.
- ~07:52 IST — miniledger-v10.zip to Drive; laptop deploy launched.
- ~07:55 IST — v10 deployed + verified live (web 200). Seeded Sahil's REAL
  DB (it was empty — zero loans, which is why his Overdue card always read
  ₹0) with 3 test loans via the laptop API: "TEST Overdue - delete me"
  ₹101 due 2026-10-01 (id e4ece3c7…), "TEST Upcoming - delete me" ₹202 due
  2026-12-01 (id 190acae5…), "TEST Repaid - delete me" ₹303 due 2026-09-15,
  repaid (id 952e7e37…). Summary after: lent 606 / repaid 303 / overdue 101.
  Brief + FROM_MUSE updated to v10.

## 2026-10-23

- ~01:52 IST — v11 started on Sahil's spec: fix Overview=Loans (same page)
  and dead Log out first, then a reference-driven visual pass. Root causes
  found by reading the source: the MainStack had exactly ONE content route
  ("Loans") — no Overview route existed, and every screen's rail handler
  ignored the 'overview' key; and Log out confirmed via RN Alert.alert,
  which is unimplemented on web, so the callback never ran.
- ~02:00 IST — v11 built. New Overview route + OverviewScreen +
  OverviewDesktop (stat cards, Needs attention, Recent ≤4, View all, Next
  due); LoansDesktop rewritten as a pure list; shared rail wiring in
  hooks/useMainNav.ts; utils/confirm.ts (window.confirm on web) applied to
  Log out (rail + headers) and Loan Detail's Delete. Stat cards
  differentiated per the corporate-fintech system in marvkr/better-design:
  top accent bars, hero/active-overdue cards flex 1.3 with deeper padding
  and type, share bars, uppercase labels, radius 12, cardShadow retuned +
  prominentShadow; palette untouched. tsc clean; impeccable detect clean.
- ~02:05 IST — local verification (sandbox PG16 + seeded demo loans):
  screenshots v11-desktop-overview.png, v11-desktop-loans.png,
  v11-statrow-closeup.png, v11-desktop-loggedout.png (logout → Login
  proven), v11-mobile-overview.png, v11-mobile-loans.png — Overview and
  Loans visibly distinct at both widths.
- ~02:10 IST — miniledger-v11.zip to Drive (root + Jarvis Bridge);
  deployed to the ThinkPad (`~/Desktop/MiniProj/miniledger-v11`) and
  verified from the laptop: web 200, bundle compiled (1008 modules),
  OTP POST 200 with allow-origin echo, processes running from the v11
  folders. Brief (§3, §9) + FROM_MUSE updated to v11. Functionality
  audit (search/filter, sort control, list-level repay, inline edit,
  archive) reported to Sahil — report only, nothing built.
- ~02:42 IST — v12 (Sahil's spec): themed web scrollbar. Default browser
  scrollbar (white track/thumb) clashed with the dark theme. New
  theme/scrollbar.ts injected from App.tsx (web-only): global
  ::-webkit-scrollbar 8px, transparent track, thumb #4E4A6B muted
  violet-grey rounded, hover #665F8C; Firefox scrollbar-width/color.
  Verification detour: first screenshots showed NO bar at all — computed
  style proved the CSS live (pseudo width 8px) but Puppeteer's default
  launch args include --hide-scrollbars; relaunching with
  ignoreDefaultArgs painted it. Screenshots v12-desktop-{overview,loans}-
  scrolled.png (+ edge strips) show the thin muted thumb mid-scroll at
  1366px. tsc clean.
- ~02:50 IST — miniledger-v12.zip to Drive (root + Jarvis Bridge);
  deployed to the ThinkPad (`~/Desktop/MiniProj/miniledger-v12`) and
  verified from the laptop: SETUP-DONE, web 200, OTP 200 + allow-origin,
  bundle compiled (988 modules), processes in the v12 folders. Brief
  (§2–§4, §7, §9) + FROM_MUSE + FILEMAP + MEMORY updated to v12.

## 2026-10-27

- ~18:00 IST — Quality pass on branch uiux/2026-10-27-responsive-signin (PR #1, after 631b567):
  strict demo-code rule (a code is shown ONLY when the server explicitly declares
  demo: true; legacy code-without-flag responses are discarded client-side, never
  rendered/logged — CONTRACT.md updated, server contract unchanged and already
  tested 76/76); OTP boxes tap-to-focus fix on web (digit boxes pointer-transparent
  so taps reach the hidden input, verified live); form focus/contrast polish
  (TextField + DateField focus states, readable placeholders, 44px targets,
  section headers, toast live region, FAB pulse respects reduced motion).
  Verified: app tsc clean, server tests 76/76, Expo web export clean; auth
  screenshots at 375/768/890/1280/1440 + dashboard/loans/detail/add-loan at
  375/1280, zero horizontal overflow; demo banner present with a demo-on server,
  absent for legacy and demo-off responses at all four auth widths.
