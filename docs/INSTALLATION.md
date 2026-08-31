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
   Copia `backend/.env.example` a `backend/.env` y ajusta los valores.
   Mínimo requerido:
   ```env
   NODE_ENV=development
   PORT=5000

   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=academix_v2

   # JWT: secreto del access token y secreto aparte para refresh tokens.
   # En producción (NODE_ENV=production) ambos son obligatorios y el
   # servidor no arranca si faltan o si se usan valores por defecto.
   JWT_SECRET=change_me_to_a_long_random_string
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_SECRET=change_me_to_a_different_long_random_string

   # Clave maestra para cifrar en reposo los secretos TOTP del 2FA
   # (AES-256-GCM). Obligatoria en producción. Generar con:
   #   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ENCRYPTION_KEY=change_me_to_64_hex_chars

   # Retención de activity_logs/audit_logs en días. Opcional; default 730.
   AUDIT_RETENTION_DAYS=730

   # Límite de tamaño para bodies JSON/urlencoded. Opcional; default 2mb.
   JSON_BODY_LIMIT=2mb
   ```

3. **Run Database Migrations & Seeds:**
   ```bash
   cd backend
   npm run migrate
   npm run seed
   ```

4. **Start Application:**
   ```bash
   # Start backend (Port 5000)
   cd backend && npm run dev

   # Start frontend (Port 5173)
   cd frontend && npm run dev
   ```
