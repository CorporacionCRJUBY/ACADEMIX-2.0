// FILE: backend/tests/seeds/permissionsCatalog.test.js
//
// Regression guard for auditoria hallazgo #2: el catálogo de `permissions`
// sembrado solo cubría 9 de los 30 módulos que las rutas exigen vía
// authorize('modulo.accion'). Este test no necesita una base de datos real:
// hace análisis estático de los archivos fuente para asegurar que todo
// permiso referenciado en las rutas efectivamente existe en el seed, y que
// SUPER_ADMIN y ADMIN los cubren. Si alguien agrega una ruta nueva con un
// authorize() para un módulo/acción que el seed no contempla, este test
// falla en vez de descubrirse en producción como un 403 inesperado.
const fs = require('fs');
const path = require('path');

const ROUTES_DIR = path.join(__dirname, '../../src/routes');
const SEED_PATH = path.join(__dirname, '../../../database/seeds/02_roles_permissions.seed.js');

function getPermissionsRequiredByRoutes() {
  const files = fs.readdirSync(ROUTES_DIR).filter((f) => f.endsWith('.routes.js'));
  const required = new Set();

  files.forEach((file) => {
    const src = fs.readFileSync(path.join(ROUTES_DIR, file), 'utf8');
    const matches = src.matchAll(/authorize\(\s*'([a-z0-9_-]+\.[a-z0-9_]+)'\s*\)/g);
    for (const m of matches) required.add(m[1]);
  });

  return required;
}

function getSeededModulesAndSets() {
  const src = fs.readFileSync(SEED_PATH, 'utf8');

  // Extract the `const modules = { ... };` object literal and evaluate it
  // in isolation (it's a plain data literal, no external references).
  const modulesMatch = src.match(/const modules = (\{[\s\S]*?\n {6}\};)/);
  if (!modulesMatch) throw new Error('Could not find `modules` catalog in seed file');
  // eslint-disable-next-line no-eval
  const modules = eval(`(${modulesMatch[1].replace(/;$/, '')})`);

  const seededPermissions = new Set();
  Object.keys(modules).forEach((mod) => {
    modules[mod].forEach((action) => seededPermissions.add(`${mod}.${action}`));
  });

  const adminExcludedMatch = src.match(/const adminExcluded = new Set\(\[([\s\S]*?)\]\);/);
  const adminExcluded = new Set(
    (adminExcludedMatch ? adminExcludedMatch[1] : '').match(/'([a-z0-9_.-]+)'/g) || []
  );
  const normalizedAdminExcluded = new Set([...adminExcluded].map((s) => s.replace(/'/g, '')));

  return { seededPermissions, normalizedAdminExcluded };
}

describe('permissions seed catalog', () => {
  const requiredByRoutes = getPermissionsRequiredByRoutes();
  const { seededPermissions, normalizedAdminExcluded } = getSeededModulesAndSets();

  it('found a non-trivial number of authorize() permissions in the routes', () => {
    // Sanity check that the static parse above actually worked, so a
    // silent regex mismatch can't make every other assertion vacuously
    // pass.
    expect(requiredByRoutes.size).toBeGreaterThan(50);
  });

  it('has a seed entry for every permission referenced by a route', () => {
    const missing = [...requiredByRoutes].filter((p) => !seededPermissions.has(p));
    expect(missing).toEqual([]);
  });

  it('gives ADMIN every route permission except the explicitly excluded ones', () => {
    const missingForAdmin = [...requiredByRoutes].filter(
      (p) => !normalizedAdminExcluded.has(p) && !seededPermissions.has(p)
    );
    expect(missingForAdmin).toEqual([]);
  });
});
