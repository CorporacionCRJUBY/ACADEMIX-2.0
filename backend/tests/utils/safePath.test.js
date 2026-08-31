// FILE: backend/tests/utils/safePath.test.js
const path = require('path');
const os = require('os');
const { resolveWithinRoot } = require('../../src/utils/safePath');

// Raíz de prueba portátil (no depende de C:\ ni de /).
const root = path.join(os.tmpdir(), 'academix-test-uploads');

describe('resolveWithinRoot() (contención de rutas C1-C3)', () => {
  it('accepts a simple relative file inside root', () => {
    const resolved = resolveWithinRoot(root, 'documents/file.pdf');
    expect(resolved).toBe(path.join(root, 'documents', 'file.pdf'));
  });

  it('strips the legacy /uploads/ URL prefix', () => {
    const resolved = resolveWithinRoot(root, '/uploads/documents/file.pdf');
    expect(resolved).toBe(path.join(root, 'documents', 'file.pdf'));
  });

  it('accepts the root itself', () => {
    expect(resolveWithinRoot(root, '.')).toBe(path.resolve(root));
  });

  it('rejects classic ../ traversal', () => {
    expect(() => resolveWithinRoot(root, '../../etc/passwd')).toThrow('Invalid file reference');
  });

  it('rejects traversal hidden inside a deeper path', () => {
    expect(() => resolveWithinRoot(root, 'documents/../../../etc/passwd')).toThrow('Invalid file reference');
  });

  it('rejects absolute paths outside root', () => {
    const outside = path.resolve(root, '..', 'otro-directorio', 'file.pdf');
    expect(() => resolveWithinRoot(root, outside)).toThrow('Invalid file reference');
  });

  it('rejects a sibling directory with a matching prefix (uploads-evil)', () => {
    // Si la validación fuera startsWith(root) sin el separador, un
    // directorio hermano llamado "<root>-evil" colaría. Debe rechazarlo.
    const evilRoot = `${path.resolve(root)}-evil`;
    const candidate = path.relative(path.resolve(root), path.join(evilRoot, 'file.pdf'));
    expect(() => resolveWithinRoot(root, candidate)).toThrow('Invalid file reference');
  });

  it('rejects empty, null and non-string candidates with 400', () => {
    expect(() => resolveWithinRoot(root, '')).toThrow('Invalid file reference');
    expect(() => resolveWithinRoot(root, null)).toThrow('Invalid file reference');
    expect(() => resolveWithinRoot(root, 123)).toThrow('Invalid file reference');
  });

  it('throws an AppError with status 400 (not a raw error)', () => {
    try {
      resolveWithinRoot(root, '../secreto.txt');
      throw new Error('debería haber lanzado');
    } catch (err) {
      expect(err.status).toBe(400);
      // Mensaje genérico: no revela la ruta real ni el motivo interno.
      expect(err.message).toBe('Invalid file reference');
    }
  });
});
