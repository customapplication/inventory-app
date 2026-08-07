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
  packaging, manual tax override, invoice generation with a configurable template
- **Dashboard** — KPIs in Indian currency format, monthly sales and
  revenue-by-category charts, filters by year, month and category
- **Reports** — inventory, sales, purchase, profit and product analysis, each
  with configurable filters and pagination
- **Users and roles** — Admin, Manager, Staff and custom roles with per-module
  permissions
- **Activity log** with 14 tracking toggles and field-level change history
- **Export** to CSV, Excel and PDF; JSON backup and restore
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

## How the data is handled

- Records are stored in the browser's IndexedDB as **AES-256-GCM ciphertext**.
- The key is derived from your PIN with **PBKDF2-SHA256, 210,000 iterations**,
  and is held in memory only while the app is unlocked.
- Unlocking *is* decryption. A wrong PIN cannot produce readable data, so there
  is no stored password hash to attack.
- The PIN also unwraps a copy of the key stored against your security answers,
  which is what makes "forgot my PIN" recovery possible without a backdoor.
- Deletions leave tombstones, so a record deleted on one device stays deleted
  everywhere instead of being resurrected by the next sync.

**There is no PIN recovery beyond the security questions, by design.** If the
PIN is forgotten and the questions were never set, the data is unrecoverable.

## Optional multi-device sync

A free Google Apps Script web app, backed by a Sheet you own, keeps devices in
step. No OAuth, nothing to renew, and it leaves you with a spreadsheet you can
read. Records merge individually; for the same record the most recent edit wins.

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

Setup is in [`SETUP-GUIDE.md`](SETUP-GUIDE.md) § 4. The script is
[`sheets-sync/Code.gs`](sheets-sync/Code.gs) — it goes to Google, never into
this repository.

## Install it

| Device | How |
|---|---|
| Android (Chrome) | ⋮ → **Add to Home screen** |
| iPhone / iPad | **Safari only** → Share → **Add to Home Screen** |
| Desktop | install icon in the address bar |

On iPhone, install *first* and enter data inside the installed icon — the
installed app has its own storage, separate from Safari.

## Why this repository is public

Free GitHub Pages is publicly readable whatever the repository's visibility, and
gated Pages is an Enterprise feature. That is fine here: **these files contain no
data.** They are the program. Records live encrypted in each owner's browser.
Anyone who finds the URL sees an empty app asking for a PIN.

Never commit a sync URL or secret. Together they are a password to your data.

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
SETUP-GUIDE.md             deploy, install, sync, archive, troubleshoot
HOSTING.md                 free hosts other than GitHub Pages, and how to move
MIGRATION.md               hand this to anyone moving off the desktop app
CONTEXT.md                 architecture and invariants, for whoever works on this next
run.bat                    local test server
```

## Updating

Change `index.html`, bump `CACHE` in `sw.js`, upload both. Skip the bump and
phones keep serving the old code. In-app: **Settings → About → Check for update**

