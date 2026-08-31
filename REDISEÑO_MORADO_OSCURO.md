# Rediseño visual — Aurora Violeta Nocturna

Este documento resume el cambio de diseño aplicado a ACADEMIX 2.0 para que
coincida con la referencia visual (`Diseño_para_programa_académico.zip`,
tema morado oscuro con acentos glow).

## Qué se cambió (solo visual, cero lógica de negocio tocada)

1. **`frontend/src/App.jsx`** — El tema central de MUI (`createTheme`) fue
   reescrito: paleta de colores, tipografía (Inter + Fraunces para títulos +
   JetBrains Mono para encabezados de tabla) y los `styleOverrides` de cada
   componente (botones, tarjetas, tablas, drawer, appbar, diálogos, chips,
   inputs, etc.). Las rutas, providers, imports y lógica de la app (líneas
   ~495 en adelante) no se tocaron.
2. **`frontend/src/index.css`** — Tokens CSS (`:root`) actualizados al mismo
   esquema oscuro, además del fondo con glow radial morado/magenta.
3. **`frontend/index.html`** — Se agregaron las fuentes Fraunces y
   JetBrains Mono (Google Fonts) usadas por el nuevo tema.
4. **Páginas con colores fijos en claro** (no dependían del tema central,
   así que no habrían cambiado solas): se ajustaron a equivalentes oscuros
   para que no queden "parches claros" rotos visualmente:
   - `features/attendance/pages/MonthlyAttendancePage.jsx`
   - `features/students/pages/StudentRecordPage.jsx`
   - `pages/ForbiddenPage.jsx`
   - `pages/NotFound.jsx`

## Qué NO se tocó (para no romper nada)

- **Backend completo** (`backend/`): controladores, servicios, rutas,
  middlewares, jobs, PDF, auth — sin cambios.
- **Base de datos** (`database/`): schema, migraciones, seeds — sin cambios.
- **Lógica de frontend**: hooks, contexts, servicios de API, i18n,
  validaciones, RBAC/permisos, rutas de React Router — sin cambios.
- La estructura de navegación (acordeones del sidebar, agrupaciones,
  permisos de admin) se mantuvo intacta; solo cambió su apariencia porque
  usa los componentes de MUI que ahora están re-temados.

## Por qué este enfoque es seguro

Tu app ya estaba construida con un **sistema de tema centralizado** (MUI
`theme` + variables CSS), así que ~90% del restyle se logra cambiando esos
tokens una sola vez: todas las páginas de `features/*` (más de 40 módulos)
heredan automáticamente el nuevo look porque usan `<Card>`, `<Paper>`,
`<Table>`, `<Button>`, `<Drawer>`, etc. de MUI en vez de estilos sueltos.
Esto evita tener que tocar (y arriesgar romper) cada una de las 100+
páginas individualmente.

## Verificación

Se corrió `npm install` + `npm run build` en `frontend/` después de los
cambios: **build exitoso, sin errores** (solo un warning normal de tamaño
de chunk, no relacionado con este cambio).

## Cómo probarlo tú

```bash
cd frontend
npm install
npm run dev       # entorno local
# o
npm run build     # build de producción, igual al que ya se validó aquí
```

El backend se levanta igual que antes (`cd backend && npm install && npm run dev`,
o `docker-compose up`), no requiere ningún cambio.
