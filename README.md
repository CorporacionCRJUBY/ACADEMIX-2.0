# ACADEMIX 2.0

Integral academic-administrative platform for New Direction Academy.

- Stack: React + Vite (frontend) · Node.js + Express (backend) · MySQL/MariaDB
- Default language: English (switchable to Spanish from SUPER_ADMIN > Settings > Language)
- Academic Year: 2026-2027

## Structure

- `backend/` — REST API (controllers, services, repositories, models, routes, validators, middleware, audit, jobs)
- `frontend/` — React + Vite SPA (Responsive/PWA)
- `database/` — migrations, seeds, schema reference, backups
- `docs/` — project documentation (see docs/)

## Getting started

See `docs/INSTALLATION.md`.

## Reference templates

- `NEW HIGH SCHOOL TRANSCRIPT TEMPLATE 26-27.xlsx` — Official Transcript layout
- `RP 26-27 TEMPLATE.xlsx` — Progress Report / Report Card layout

## Development phases

See the Master Development Plan (FASE 1 - FASE 18) for the build order:
audit -> database foundation -> auth/RBAC -> i18n -> students -> teachers ->
attendance -> grades -> academic history -> report card -> credits/GPA ->
transcript -> scholarships -> graduation/GRANSIF -> report center -> audit ->
responsive/PWA -> testing.
