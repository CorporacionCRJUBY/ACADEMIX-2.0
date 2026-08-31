// FILE: backend/src/utils/fileSignature.js
// FIX (auditoria hallazgo medio #4 - validación de archivos subidos solo
// por extensión/MIME declarado por el cliente): `fileFilter` en
// middleware/upload.middleware.js solo mira `file.originalname` (extensión)
// y `file.mimetype`, dos valores que el cliente controla por completo (los
// manda el navegador a partir de lo que dice el propio request multipart,
// no de una inspección real del archivo). Cualquiera puede renombrar un
// `.php`/`.exe`/`.html` a `documento.pdf` y mandar `Content-Type:
// application/pdf` a mano para pasar ese filtro.
//
// Este módulo verifica el contenido real del archivo ya escrito en disco,
// leyendo sus primeros bytes ("magic numbers"/firma) y comparándolos con
// los formatos que Academix realmente permite. No depende de un paquete
// externo (evita fricción CJS/ESM con librerías tipo `file-type`, que en
// sus versiones recientes son ESM-only) — la lista de formatos permitidos
// es fija y pequeña, así que un mapa de firmas propio es suficiente y fácil
// de auditar.
const fs = require('fs');

const SIGNATURES = {
  pdf: [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }], // %PDF
  jpeg: [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  png: [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  // .docx/.xlsx son contenedores ZIP (Office Open XML): comparten firma PK.
  zipOfficeXml: [
    { offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] },
    { offset: 0, bytes: [0x50, 0x4b, 0x05, 0x06] }, // zip vacío
    { offset: 0, bytes: [0x50, 0x4b, 0x07, 0x08] }, // zip "spanned"
  ],
  // .doc/.xls legacy (OLE Compound File Binary Format).
  oleCompound: [{ offset: 0, bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }],
};

// Firmas de tipos peligrosos que nunca deben aceptarse disfrazados de un
// tipo permitido (ejecutables, scripts), usadas para el chequeo especial
// de .csv (que no tiene una firma binaria propia — es texto plano).
const DANGEROUS_SIGNATURES = [
  [0x4d, 0x5a], // MZ - ejecutable Windows (.exe, .dll)
  [0x7f, 0x45, 0x4c, 0x46], // ELF - ejecutable Linux
  [0x23, 0x21], // "#!" - shebang de script
];

const matchesSignature = (buffer, signature) =>
  signature.every((sig) =>
    sig.bytes.every((byte, i) => buffer[sig.offset + i] === byte)
  );

const matchesAny = (buffer, signatureList) =>
  signatureList.some((sig) =>
    sig.bytes.every((byte, i) => buffer[sig.offset + i] === byte)
  );

// Extensión -> qué firma(s) debe cumplir el contenido real del archivo.
const EXTENSION_SIGNATURE_MAP = {
  '.pdf': ['pdf'],
  '.jpg': ['jpeg'],
  '.jpeg': ['jpeg'],
  '.png': ['png'],
  '.docx': ['zipOfficeXml'],
  '.xlsx': ['zipOfficeXml'],
  '.doc': ['oleCompound'],
  '.xls': ['oleCompound'],
  // .csv se valida aparte, en isValidCsvContent().
};

/**
 * Heurística para .csv: no hay firma binaria fija, así que en vez de
 * "aceptar todo lo que diga ser .csv", verificamos que el contenido sea
 * texto plano razonable y no arranque con la firma de un ejecutable/script
 * ni contenga bytes nulos (fuerte indicio de archivo binario, no CSV).
 * @param {Buffer} buffer
 */
const isValidCsvContent = (buffer) => {
  if (DANGEROUS_SIGNATURES.some((sig) => matchesSignature(buffer, [{ offset: 0, bytes: sig }]))) {
    return false;
  }
  if (buffer.includes(0x00)) return false; // bytes nulos -> no es texto plano
  return true;
};

/**
 * Verifica que el contenido real de un archivo en disco coincida con lo
 * que su extensión dice que es.
 * @param {string} filePath - ruta al archivo ya guardado por multer
 * @param {string} extension - extensión en minúsculas, con punto (p. ej. '.pdf')
 * @returns {Promise<boolean>}
 */
const verifyFileSignature = async (filePath, extension) => {
  const ext = extension.toLowerCase();

  if (ext === '.csv') {
    const buffer = await readHead(filePath, 512);
    return isValidCsvContent(buffer);
  }

  const signatureKeys = EXTENSION_SIGNATURE_MAP[ext];
  if (!signatureKeys) return false; // extensión no reconocida -> rechazar

  const buffer = await readHead(filePath, 16);
  return signatureKeys.some((key) => matchesAny(buffer, SIGNATURES[key]));
};

const readHead = (filePath, length) =>
  new Promise((resolve, reject) => {
    const buffer = Buffer.alloc(length);
    fs.open(filePath, 'r', (err, fd) => {
      if (err) return reject(err);
      fs.read(fd, buffer, 0, length, 0, (readErr, bytesRead) => {
        fs.close(fd, () => {
          if (readErr) return reject(readErr);
          resolve(buffer.subarray(0, bytesRead));
        });
      });
    });
  });

module.exports = { verifyFileSignature };
