# AP GUPPY WORLD — Billing Studio

A premium, aquarium-themed billing web app for a small guppy/fish business.
Plain **HTML + CSS + Bootstrap 5 + JavaScript** on the front, **Google Sheets + Google Apps Script** as the backend. No Python, no React/Vue/Angular, no build step.

Open `index.html` and it runs immediately with **empty states** — no dummy data. Import your Excel file or connect a Google Sheet to fill it with real records.

---

## What's inside

```
ap-guppy-world-web/
├── index.html          ← the whole app (single page)
├── css/style.css       ← theme (Poppins, gradients, aquarium look)
├── js/
│   ├── config.js       ← where the backend URL lives
│   ├── ui.js           ← formatting, badges, toast, modal
│   ├── api.js          ← backend calls (offline + live modes)
│   ├── views.js        ← every screen (dashboard, billing, …)
│   └── app.js          ← routing, sidebar, global search
├── backend/Code.gs     ← paste this into Google Apps Script
└── README.md
```

## Features

- **Dashboard** — six gradient stat cards (today/month sales & profit, customers, orders) + recent orders table with status badges.
- **Billing** — notebook-style entry: customer auto-search by mobile, order & price sections, notes, colored status dropdown, courier list, auto-suggested profit (Paid − Cost), Save / Save & Print / Clear.
- **Customer auto-search** — type a mobile number and the name, location, order count, total purchase, last purchase and recent orders appear instantly.
- **Customers** — searchable directory → each opens a **timeline** of every order.
- **Reports** — daily/monthly/overall cards, monthly sales-vs-profit bar chart, order-status doughnut, monthly breakdown, top customers, **Export Excel** (real `.xlsx` via SheetJS).
- **Import Excel** — from the **header button** or **Settings ▸ Data**. Brings in customers + order history, saves into Google Sheets, skips duplicates. If the file has multiple sheets it uses the **2026** sheet and ignores **2025**; dates in dd-mm-yyyy, yyyy-mm-dd or Excel-date format are all parsed.
- **Empty states everywhere** — the app shows "No data available / No customers found / No reports available" until you import or add real data.
- **Editable notes & status** — open any past bill to change its **Status** or **add a note** at any time. Notes are **never overwritten**: each entry is appended with the date & time, and status changes are logged to the same history (shown on the customer timeline).
- **Backup / Restore** — Settings ▸ Data. Backup downloads a full JSON copy of all data; Restore loads it back.
- **Fish Varieties** — your master list (Short Code, Full Variety Name, Pair Price, Notes) with add / edit / delete / search. New varieties are available in the billing reference. Courier options also live here and feed the billing dropdown.
- **Global search** in the header across customers and bills.
- Fully responsive; sidebar collapses on mobile; respects reduced-motion.

Pricing is always **manual** — the GP list is reference only, never applied automatically.

---

## Connect the Google Sheet backend (10 minutes)

1. Create a new **Google Sheet** (any name).
2. **Extensions ▸ Apps Script**. Delete the sample code.
3. Open `backend/Code.gs` from this project, copy **all** of it, paste into the script editor, and **Save**.
4. **Deploy ▸ New deployment ▸ Web app**:
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
   - Click **Deploy** and authorize when prompted.
5. Copy the **Web app URL** (ends in `/exec`).
6. Open the app → **Settings ▸ Google Sheets Connection** → paste the URL → **Save Connection** → **Test Connection**. The URL is stored in the browser and reconnects automatically on every start — the owner only sets it once.

The script creates the `Bills`, `Customers`, `GPList` and `Settings` tabs automatically on first use. You never have to touch the sheet structure by hand.

> The app POSTs a plain-text JSON string, so there is **no CORS preflight** — this is why "Who has access: Anyone" is required and works without extra headers.

---

## Hosting the frontend (free)

It's all static files, so any of these work:

- **GitHub Pages** — push the folder to a repo, enable Pages. (Matches the existing `resventerprises.in` setup.)
- **Netlify / Cloudflare Pages** — drag-and-drop the folder.
- **Local** — just open `index.html`. (The saved backend URL lives in that browser's local storage.)

The backend URL is stored per-browser via Settings, so you can host once and connect each device individually — or hard-code it in `js/config.js` (`DEFAULT_API_URL`) before deploying.

---

## Branding

The official **AP GUPPY WORLD** logo appears only in the **top-left of the sidebar** (compact ~34px mark). Assets live in `assets/` (`logo-mark.png` for the sidebar, `favicon.png` for the browser tab). To swap it, replace `assets/logo-mark.png` with a similar-shaped image — it scales by height without stretching.

## Keyboard shortcuts (built for all-day billing)

- **Ctrl + Enter** — Save bill
- **Ctrl + Shift + Enter** — Save & Print
- **/** — jump to global search
- **Alt + N** — new bill

The billing page renders instantly (couriers load in the background) and auto-focuses the mobile field, so you can start typing the moment it opens.

## Notes

- **Offline mode** (no backend URL) shows empty states and keeps anything you add in-memory only until you refresh — connect a Sheet to store data permanently.
- **Excel import** matches columns by header name in any order: `Date, Customer Name, Contact Number, Location, Bought Items, Price Details, Paid Amount, Courier, Status, Notes, Cost, Profit`.
- CDN libraries used: Bootstrap 5, Bootstrap Icons, Poppins (Google Fonts), Chart.js, SheetJS.
