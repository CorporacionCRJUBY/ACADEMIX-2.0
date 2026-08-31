# ACADEMIX 2.0 — Correcciones aplicadas (esta sesión)

Este análisis se hizo de forma independiente (no se dio por buena la nota
`CORRECCIONES_RESUMEN.md` que traía el zip): se verificó sintaxis de los 220
archivos backend y 149 frontend, se comparó toda tabla usada en el código
contra `database/schema/schema.sql` y las migraciones Knex, se comprobó
programáticamente que cada método llamado en `routes → controllers →
services → repositories → models` existe realmente, y se intentó arrancar
el servidor y compilar el frontend de verdad.

## 🔴 Crítico — el backend no arrancaba (CORREGIDO)

**`backend/src/services/pdf.service.js`**

El código usaba la API vieja de `pdfmake` (`new PdfPrinter(fonts)` +
`.createPdfKitDocument()`), pero la dependencia instalada es
`pdfmake ^0.3.11`, que cambió su API por completo: ahora `require('pdfmake')`
devuelve una instancia singleton con `.setFonts()` y `.createPdf(docDefinition).write(path)`.
Además se importaba `pdfmake/build/pdfmake` (el bundle para **navegador**,
sin acceso a filesystem) en vez del entry point de Node.

Como este servicio se instancia al cargar el módulo
(`module.exports = new PDFService()`) y lo importan `transcripts.service.js`,
`progressReports.service.js` y `reportCards.service.js`, el error
`TypeError: PdfPrinter is not a constructor` tumbaba **todo el servidor**
al arrancar, antes incluso de intentar conectar a la base de datos.

Se reescribió el constructor y `buildPdf()` para usar la API real de
pdfmake 0.3.x, y se apuntaron las fuentes Roboto a las rutas absolutas de
los `.ttf` que trae el propio paquete (antes se referenciaban solo por
nombre de archivo, algo que solo funciona con el `vfs` del bundle de
navegador). **Verificado generando un PDF real de extremo a extremo.**

## 🟠 Docker (CORREGIDO)

- No existían `backend/Dockerfile` ni `frontend/Dockerfile` pese a que
  `docker-compose.yml` los referenciaba con `build: ./backend` / `build: ./frontend`.
  Se crearon ambos.
- `docker-compose.yml` creaba la base `academix` pero la app espera
  `academix_v2` (`DB_NAME` en `.env`). Corregido.
- El backend exponía/mapeaba el puerto `4000`, pero `server.js` escucha en
  `PORT` (5000 por defecto). Corregido a `5000:5000`.
- Se añadió `DB_HOST: db` como variable de entorno del servicio backend en
  compose, porque dentro de la red de Docker el host de la BD es el nombre
  del servicio (`db`), no `localhost` (el valor que trae `backend/.env`
  para desarrollo local sin Docker).

## 🟡 Bugs menores (CORREGIDOS)

- **`frontend/src/api/axiosClient.js`**, método `download()`: el
  interceptor de respuesta global ya desempaqueta `response.data`, así que
  dentro de `download()` la variable ya era el blob — pero el método hacía
  `return response.data` al final, y un `Blob` no tiene `.data`, así que
  siempre devolvía `undefined`. La descarga en el navegador funcionaba
  igual (se dispara por DOM), pero cualquier código que dependiera del
  valor de retorno se rompía silenciosamente. Corregido para devolver el
  blob real.
- **`backend/package.json`**, script `db:fresh`: pasaba `rollback --all`
  como argumentos extra a `migrate:latest` (por cómo funciona `npm run -- `),
  así que nunca ejecutaba un rollback real. Corregido para llamar al script
  `migrate:rollback` correcto.
- **`backend/package.json`**: los scripts `lint` y `format` invocaban
  `eslint`/`prettier`, que no estaban en `devDependencies` (fallaban con
  "command not found" tras un `npm install` limpio). Se añadieron.

## 🔴 Sesión 2 — `Uncaught SyntaxError ... CheckCircleOutline` (CORREGIDO)

**`frontend/src/layouts/MainLayout.jsx`**

El import `CheckCircleOutline as GransifIcon` desde `@mui/icons-material`
referenciaba un icono que **no existe** en la versión instalada
(`@mui/icons-material ^9.3.1`). Ese paquete sí trae `CheckCircleOutlined`,
`CheckCircleOutlineOutlined`, `CheckCircleOutlineRounded`,
`CheckCircleOutlineSharp` y `CheckCircleOutlineTwoTone`, pero no la
variante "Filled" sin sufijo de ese icono en concreto — es una omisión
real del propio paquete de iconos, no un problema de caché.

Se corrigió a `CheckCircleOutlineOutlined as GransifIcon` (mismo
pictograma, estilo "Outlined" que sí existe).

Se auditaron programáticamente **todos** los imports de `@mui/icons-material`
y `@mui/material` de los 149 archivos del frontend contra los exports
reales del paquete instalado: este era el único caso roto. También se
verificó, para cada archivo `.jsx`, que todo componente usado en JSX
esté efectivamente importado o declarado en ese mismo archivo (0 problemas).

**Nota sobre por qué esto no se vio en la sesión anterior:** la verificación
previa solo comprobaba sintaxis y que los módulos internos del proyecto se
importaran entre sí correctamente — nunca comprobó que los nombres
importados desde paquetes de terceros (`@mui/icons-material`, etc.)
existieran realmente en la versión instalada. Ese hueco ya está cubierto
en esta sesión.

**Nota sobre el arranque:** el `node_modules` que trae el zip original fue
instalado en Windows (solo incluye el binario nativo
`@rolldown/binding-win32-x64-msvc` para Vite, no el de Linux), así que en
el entorno de pruebas de este asistente (Linux) el dev server de Vite no
puede arrancar aunque el código esté sano. Si el error que reportaste
ocurrió en un navegador (mensaje `Uncaught SyntaxError` en la consola), es
decir que en tu máquina el servidor sí levantó y solo falló al cargar ese
módulo — consistente con este diagnóstico. Si sigue sin levantar después
de este fix, conviene además borrar la caché de Vite:
`rm -rf frontend/node_modules/.vite` y volver a correr `npm run dev`.


- **`backend/.env`** trae una contraseña real de base de datos en texto
  plano. Se recomienda rotarla y mantener solo un `.env.example` sin
  secretos en el repositorio.
- **`frontend`**: `vite ^8.2.2` usa el bundler rolldown y, en el paquete
  entregado, faltaba el binario nativo para Linux x64
  (`@rolldown/binding-linux-x64-gnu`), por lo que ni `vite build` ni
  `vite dev` arrancaban en este entorno de prueba (sin acceso a red para
  reinstalar). Es un problema conocido de npm con dependencias opcionales;
  si persiste tras un `rm -rf node_modules package-lock.json && npm install`
  limpio en la máquina de destino, considerar fijar `vite` a una versión
  anterior estable (ej. `^5.x`) mientras se resuelve.
- No hay ningún archivo `*.test.js`/`*.spec.js` pese a tener Jest
  configurado con 3 scripts de test — la cobertura de pruebas es
  inexistente, no un bug de código en sí.
- No se pudo probar el arranque completo contra una base de datos MySQL
  real (sin acceso a red en este entorno para instalarla). El arranque
  llega correctamente hasta el intento de conexión, que es el
  comportamiento esperado sin BD disponible.
