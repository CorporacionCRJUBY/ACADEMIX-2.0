# ACADEMIX 2.0 — Installation & Setup Guide

## Requirements
- Node.js >= 18.0.0
- MySQL >= 8.0 or MariaDB >= 10.5
- npm >= 9.0.0

## Quick Start Installation

1. **Clone & Install Dependencies:**
   ```bash
   # Root
   npm install
   # Backend
   cd backend && npm install
   # Frontend
   cd ../frontend && npm install
   ```

2. **Configure Environment:**
   Configure `backend/.env`:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=academix_v2
   JWT_SECRET=your_secret_key_2026
   ```

3. **Run Database Migrations & Seeds:**
   ```bash
   cd backend
   npx knex migrate:latest --knexfile src/config/knexfile.js
   npx knex seed:run --knexfile src/config/knexfile.js
   ```

4. **Start Application:**
   ```bash
   # Start backend (Port 5000)
   cd backend && npm run dev

   # Start frontend (Port 5173)
   cd frontend && npm run dev
   ```
