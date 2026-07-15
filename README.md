# Student Accommodation Portal

## What's built (Phase 1)
- **Public listings portal** — no login. Live "room board" showing every room across both properties, color-coded open/occupied, plus a per-property table with price, floor, and type.
- Placeholder pages for tenant login and manager login (nav links work, pages are stubs).

## Run it in VS Code
1. Open this folder in VS Code.
2. Open a terminal (`` Ctrl+` ``).
3. `npm install`
4. `npm start`
5. Open `http://localhost:3000` in your browser.

## Where the data lives
`data/properties.json` — replace the sample rooms, prices, and addresses with your real data. The site reads this file on every request, so just save the file and refresh the browser (no restart needed).

## Project structure
```
server.js              Express app entry point
routes/public.js        API: GET /api/public/summary, GET /api/public/properties
data/properties.json    Room + property data (swap for a real DB later)
public/                 Frontend: index.html, css/style.css, js/main.js
public/tenant-login.html   Placeholder — Phase 2
public/manager-login.html  Placeholder — Phase 2
```

## What's next (in build order)
1. **Tenant portal** — email + password auth, account statement view (paid up / behind — you flag this manually for now), chatbot for payments/room viewing/complaints.
2. **Manager dashboard** — occupancy analytics, payment status across all tenants, complaint queue.
3. **AI automation** — chatbot backend (likely Claude API) wired into both the public and tenant portals; automated complaint triage/routing for managers.

Each phase will need a real database (Postgres or SQLite) and an auth layer — the current JSON-file setup is intentionally disposable so we don't lock in the wrong data model before tenant/manager auth requirements are nailed down.
