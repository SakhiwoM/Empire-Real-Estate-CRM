# Empire Property CRM

Empire Property CRM is a local-first property management CRM for a one-person real estate startup.
It runs fully on a laptop using `localhost`, works offline, stores data in SQLite, and avoids any cloud dependency.

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express.js
- Database: SQLite using `better-sqlite3`
- Package manager: npm

## Client Machine Requirements (Non-Technical)

You have two delivery options:

### Option A: Project Folder Launcher (requires Node.js on client machine)

- Windows 10 or Windows 11
- Node.js LTS installed (recommended: Node.js 22.x LTS)
- At least 4 GB RAM (8 GB recommended)
- At least 1 GB free disk space
- A modern browser (Chrome, Edge, or Firefox)

### Option B: Portable Bundle (recommended for non-technical clients)

- Windows 10 or Windows 11
- At least 4 GB RAM (8 GB recommended)
- At least 1.5 GB free disk space (includes bundled runtime + dependencies)
- A modern browser (Chrome, Edge, or Firefox)
- No separate Node.js installation required on the client machine

Notes:

- Internet is only needed on the build machine when preparing/updating dependencies.
- Daily use runs offline on localhost.

## One-Click Launch (for Client)

From the project root folder, double-click:

- `Launch Empire Property CRM.bat`

What it does:

- Checks Node.js and npm
- Creates `server/.env` if missing
- Installs backend/frontend dependencies on first run
- Starts backend and frontend in separate windows
- Opens `http://localhost:5173`

To close the app, double-click:

- `Close Empire Property CRM.bat`

## Portable Bundle (No Node install on client machine)

Build the portable package on your machine:

1. Double-click `Create Portable Bundle.bat`
2. Wait until it finishes and shows success
3. Open the generated `portable` folder
4. Send the created bundle folder (or `.zip`) to your client

What gets generated:

- A fully self-contained package with bundled Node runtime
- Backend + frontend ready to run
- Local SQLite database and uploads folders
- Double-click launchers:
  - `Start Empire Property CRM.bat`
  - `Stop Empire Property CRM.bat`

What client does:

1. Extract the portable `.zip` (if sent as zip)
2. Open the extracted folder
3. Double-click `Start Empire Property CRM.bat`
4. Use the app at `http://localhost:5173`

No terminal commands required for your client.

## Project Structure

```text
empire-property-crm/
  server/
    src/
      db/
      routes/
      controllers/
      middleware/
      utils/
    data/
    backups/
    package.json
    .env.example
  client/
    src/
      components/
      pages/
      services/
      utils/
      App.jsx
      main.jsx
    package.json
  Launch Empire Property CRM.bat
  Close Empire Property CRM.bat
  Create Portable Bundle.bat
  Create Portable Bundle.ps1
  README.md
```

## Features Included

- Dashboard with live counts:
  - Total contacts
  - Buyers, sellers, tenants, landlords
  - Total properties
  - Available rentals and sale listings
  - Follow-ups due today and overdue
  - Upcoming viewings
- Contacts CRUD with:
  - Search by name/phone/location/type/status
  - Type/status filters
  - WhatsApp quick action (`wa.me`)
- Requirements CRUD with:
  - Contact linking
  - Filters (purpose, location, property type, urgency, status)
  - Match lookup to properties with score
- Properties CRUD with:
  - Owner linking
  - Search/filter by title/location/type/listing/status/price
  - GPS coordinates (latitude/longitude) and internal location notes
  - Property photo upload gallery (local file storage)
  - Match lookup to active requirements with score
- Follow-ups CRUD with:
  - Pending/completed/overdue/today filtering
  - Mark complete action
  - WhatsApp quick action
- Viewings CRUD with contact/property linking
- Reports:
  - Contacts by type
  - Properties by status
  - Properties by listing type
  - Follow-ups by status
  - Deals placeholder structure for future module
- Backup and export:
  - Create DB backup to `server/backups/`
  - Download latest backup
  - Export contacts/properties/follow-ups to CSV
- Security:
  - Owner-only login with secure httpOnly cookie session
  - Initial owner account setup flow (first run only)
  - Protected API routes and protected property image files
- Theme:
  - Light mode and dark mode toggle

## How to Install Node.js

1. Go to the official Node.js website: `https://nodejs.org`
2. Download and install the current LTS version (recommended).
3. Confirm installation:

```bash
node -v
npm -v
```

## Backend Setup and Run

1. Open a terminal.
2. Go to the server folder:

```bash
cd server
```

3. Install dependencies:

```bash
npm install
```

4. Create `.env` from `.env.example` and keep:

```env
PORT=5000
HOST=127.0.0.1
CLIENT_URL=http://localhost:5173
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d
AUTH_COOKIE_NAME=empire_crm_session
```

5. Start backend:

```bash
npm run dev
```

Backend runs at:

`http://localhost:5000`

## Frontend Setup and Run

1. Open a second terminal.
2. Go to the client folder:

```bash
cd client
```

3. Install dependencies:

```bash
npm install
```

4. Start frontend:

```bash
npm run dev
```

Frontend runs at:

`http://localhost:5173`

## Open the App

Open your browser and visit:

`http://localhost:5173`

On first launch, create the owner account on the setup screen.

The frontend talks to backend API on:

`http://localhost:5000/api`

## SQLite Database Location

The SQLite database file is stored at:

`server/data/empire_property_crm.db`

It is auto-created on first backend start.

In portable bundles, database path is:

`app/server/data/empire_property_crm.db`

Uploaded property photos are stored at:

`server/uploads/properties/`

In portable bundles, uploads path is:

`app/server/uploads/properties/`

## Database Backup

### From UI

Go to **Backup/Export** page and click:

- `Backup Database`
- `Download Latest Backup` (optional)

### From API

Create backup:

`POST http://localhost:5000/api/backup`

Download latest backup:

`GET http://localhost:5000/api/backup/latest`

Backups are saved in:

`server/backups/`

In portable bundles, backups path is:

`app/server/backups/`

Backups are never auto-deleted.

## CSV Export Endpoints

- Contacts CSV: `GET /api/export/contacts`
- Properties CSV: `GET /api/export/properties`
- Follow-ups CSV: `GET /api/export/follow-ups`

## Main API Endpoints

### Contacts

- `GET /api/contacts`
- `GET /api/contacts/:id`
- `POST /api/contacts`
- `PUT /api/contacts/:id`
- `DELETE /api/contacts/:id`

### Requirements

- `GET /api/requirements`
- `GET /api/requirements/:id`
- `POST /api/requirements`
- `PUT /api/requirements/:id`
- `DELETE /api/requirements/:id`
- `GET /api/requirements/:id/matches`

### Auth

- `GET /api/auth/status`
- `POST /api/auth/setup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Properties

- `GET /api/properties`
- `GET /api/properties/:id`
- `POST /api/properties`
- `PUT /api/properties/:id`
- `DELETE /api/properties/:id`
- `GET /api/properties/:id/matches`
- `GET /api/properties/:id/images`
- `POST /api/properties/:id/images` (multipart form-data, field name: `images`)
- `DELETE /api/properties/:id/images/:imageId`

### Follow-ups

- `GET /api/follow-ups`
- `GET /api/follow-ups/:id`
- `POST /api/follow-ups`
- `PUT /api/follow-ups/:id`
- `DELETE /api/follow-ups/:id`
- `PATCH /api/follow-ups/:id/complete`

### Viewings

- `GET /api/viewings`
- `GET /api/viewings/:id`
- `POST /api/viewings`
- `PUT /api/viewings/:id`
- `DELETE /api/viewings/:id`

### Dashboard

- `GET /api/dashboard`

### Reports

- `GET /api/reports`

## Offline and Local-Only Notes

- No cloud service is required.
- No paid API is required.
- Designed for local `localhost` usage and offline operation.
- Server binds to `127.0.0.1` by default so it stays local to your laptop.

## Migration Readiness

The app is structured so it can later be hosted:

- Clear API layer in Express
- SQLite data layer can be swapped to hosted DB later
- Frontend API base URL is configurable (`VITE_API_BASE_URL`)
- Monorepo-style split between client and server
