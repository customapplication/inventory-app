# Inventory Manager

Inventory, orders and invoicing for a phone-accessory business. One HTML file,
no server, no account, no subscription. It installs on a phone, works with no
signal, and keeps its records encrypted on the device.

This is the web version of a desktop app that previously needed Python and a
local file server. Every feature came across; the storage layer was replaced.

---

## What it does

- **Products** — SKU generation from a template, barcodes (Code128), scannable QR
  codes, a bundled catalogue of 16 brands and 671 phone models, custom columns
- **Bulk Product Builder** — a four-step wizard that generates thousands of
  variants across models and colours in one pass
- **Customers and suppliers** with full order history
- **Sales and purchase orders** — line items, per-order or per-item shipping and
  packaging, manual tax override, invoice generation with a configurable template;
  order numbers are a short series per device (`SO-A-00042`), given when the
  order is saved and checked against GST's 16-character limit
- **Dashboard** — KPIs in Indian currency format, monthly sales and
  revenue-by-category charts, filters by year, month and category
- **Reports** — inventory, sales, purchase, profit and product analysis, each
  with configurable filters and pagination. Profit is sales minus the cost of the
  goods actually sold (each product's average cost when it was sold), so a month
  in which you restock does not show a loss
- **Users and roles** — Admin, Manager, Staff and custom roles with per-module
  permissions. Staff sign in with a PIN; administrators sign in on a new device
  with a strong password and keep a quick PIN on each device
- **WhatsApp Message** — filter the catalogue and generate the broadcast the shop
  sends to its groups: models grouped by brand, optional stock counts and a 🆕
  marker for recent arrivals, with the title, community link and English/Hindi
  sign-off saved once and shared across devices
- **Activity log** with 14 tracking toggles and field-level change history
- **Export** to CSV, Excel and PDF; JSON backup and restore (a restore keeps the
  device's own sync connection, counters and your login)
- Dark mode, keyboard shortcuts, column resize and reorder, Excel-style column
  filters

## On a phone

Wide tables do not survive a 375px screen, so below the mobile breakpoint every
list — products, customers, suppliers, sales, purchases — is re-presented as a
tappable card gallery: thumbnail, headline, and the key figures as chips.
Tapping a card opens the normal edit form, which becomes a full-height sheet in
a single full-width column that scrolls top to bottom. Nothing scrolls sideways.

The cards are generated from the same rendered table, so they follow your column
configuration automatically — rename a column and the chip label changes, hide
one and the chip disappears. Desktop is untouched and still shows the full table.

Colours are chosen from a row of tappable swatches rather than the device colour
wheel, which is awkward on a phone and cannot supply the colour's *name* — and
the name is what reaches the label and the WhatsApp message.

## How the data is handled

- Records are stored in the browser's IndexedDB as **AES-256-GCM ciphertext**.
- Each device has its own random key, locked under your PIN or password with
  **PBKDF2-SHA256, 210,000 iterations**, and held in memory only while the app
  is unlocked.
- Unlocking *is* decryption. On the device, a wrong PIN cannot produce readable
  data.
- So that the same PIN works on every synced device, a **fingerprint** of it
  travels with your account in the synced settings. Since 3.16 that fingerprint
  is salted and deliberately slow (PBKDF2, 310,000 rounds). That slows guessing
  but cannot make a 4–6 digit PIN safe from someone who has your Sheet or a
  backup and a fast computer — so **an administrator's PIN never travels at
  all**: administrators sign in on a new device with a password of 8+
  characters (letters and numbers), and their PIN is a quick way in on the
  device where it was set. For staff, a longer PIN is the easy improvement.
- A copy of the key is also locked under each pair of your security answers,
  which is what makes "forgot my PIN" recovery possible without a backdoor. The
  answers travel the same way, so recovery works on any synced device.
- Deletions leave tombstones, so a record deleted on one device stays deleted
  everywhere instead of being resurrected by the next sync.

**There is no recovery beyond the security questions, by design.** If the PIN
(or, for an administrator, the password) is forgotten and the questions were
never set, the data is unrecoverable.

## Optional multi-device sync

A free Google Apps Script web app, backed by a Sheet you own, keeps devices in
step. No OAuth, nothing to renew, and it leaves you with a spreadsheet you can
read. Records merge individually; for the same record the most recent edit wins.

Because it is readable, **the Sheet holds your records in plain form** — the
encryption is on the devices. Share it with nobody, and turn on 2-step
verification for the Google account that owns it. Sign-in fingerprints are kept
out of its readable tabs (Code.gs v6).

Sync is **incremental**: each collection is an append-only log in which the row
number is the revision, so a device uploads only what changed since it last
synced — about 630 bytes for a single edit, whether you hold 300 records or
three lakh. Photos go to a folder in the same Drive account and are cached
locally, so they cost nothing per sync and still work offline.

Sync runs automatically for every user regardless of role; only the endpoint
itself is admin-only, and it lives in Settings → Data.

**Archiving** moves old records out of the live set so unlock and sync stay fast
as the years accumulate. It is manual and per collection — orders, activity log,
products, customers, suppliers — filtered by date range and, where it makes
sense, order type, status, category or brand. Archived records go to a separate
spreadsheet in the same Drive (its own 10-million-cell budget, so capacity is
effectively unbounded), an encrypted batch on the device, and optionally a
downloaded file. Reports have an **Include archived records** toggle that is
strictly read-only. Only the root administrator can archive, and any batch can
be restored.

**Compaction** is the counterpart and runs automatically: the append-only log
gains a row per edit, so it is periodically rewritten to keep only the newest row
per record. Schedule and per-collection thresholds live in Settings → Data. The
activity log is never compacted — it is an audit trail.

## Install it

| Device | How |
|---|---|
| Android (Chrome) | ⋮ → **Add to Home screen** |
| iPhone / iPad | **Safari only** → Share → **Add to Home Screen** |
| Desktop | install icon in the address bar |

On iPhone, install *first* and enter data inside the installed icon — the
installed app has its own storage, separate from Safari.

## Running it locally

```bash
python -m http.server 8140
```

Then open <http://localhost:8140/index.html>, or just run `run.bat`.

It must be served over `http://localhost` or `https` — opening `index.html`
straight off the disk gives the browser no Web Crypto and no service worker, and
the app will tell you so rather than failing obscurely.

## Files

```
index.html                 the whole app
sw.js                      service worker — bump CACHE on every release
manifest.webmanifest       PWA manifest
icon*.png, icon.svg        icons (iOS reads only apple-touch-icon.png)
build_icons.py             regenerates the icons — `python build_icons.py`
sheets-sync/Code.gs        Apps Script sync backend — paste into Google
run.bat                    local test server

docs/SETUP-GUIDE.md        deploy, install, sync, archive, troubleshoot
docs/HOSTING.md            free hosts other than GitHub Pages, and how to move
docs/MIGRATION.md          hand this to anyone moving off the desktop app
docs/CONTEXT.md            architecture and invariants, for whoever works on this next
docs/README.md             this file
```
