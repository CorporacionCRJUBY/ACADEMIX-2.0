// FILE: backend/src/utils/pdfHelpers.js
const fs = require('fs');
const path = require('path');

/**
 * Crea un directorio para archivos PDF si no existe
 */
const ensurePdfDirectory = () => {
  const pdfDir = path.resolve(__dirname, '../../uploads/pdfs');
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }
  return pdfDir;
};

/**
 * Genera un nombre de archivo único para PDF
 */
const generatePdfFilename = (prefix, id, version = 1) => {
  const timestamp = Date.now();
  return `${prefix}_${id}_v${version}_${timestamp}.pdf`;
};

/**
 * Limpia archivos PDF antiguos (mayores a N días)
 */
const cleanOldPdfs = (days = 30) => {
  const pdfDir = ensurePdfDirectory();
  const files = fs.readdirSync(pdfDir);
  const now = Date.now();
  const maxAge = days * 24 * 60 * 60 * 1000;

  for (const file of files) {
    const filePath = path.join(pdfDir, file);
    const stats = fs.statSync(filePath);
    if (now - stats.mtimeMs > maxAge) {
      fs.unlinkSync(filePath);
    }
  }
};

/**
 * Verifica si un archivo PDF existe
 */
const pdfExists = (filename) => {
  const pdfDir = ensurePdfDirectory();
  const filePath = path.join(pdfDir, filename);
  return fs.existsSync(filePath);
};

/**
 * Obtiene la ruta completa de un archivo PDF
 */
const getPdfPath = (filename) => {
  const pdfDir = ensurePdfDirectory();
  return path.join(pdfDir, filename);
};

/**
 * Lee un archivo PDF como stream
 */
const getPdfStream = (filename) => {
  const filePath = getPdfPath(filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`PDF file not found: ${filename}`);
  }
  return fs.createReadStream(filePath);
};

/**
 * Elimina un archivo PDF
 */
const deletePdf = (filename) => {
  const filePath = getPdfPath(filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
};

/**
 * Genera contenido HTML para PDF (para usar con librerías)
 */
const generatePdfHtml = (template, data) => {
  // Placeholder - en implementación real, usar handlebars o similar
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          h1 { color: #333; }
        </style>
      </head>
      <body>
        <h1>${template}</h1>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      </body>
    </html>
  `;
};

module.exports = {
  ensurePdfDirectory,
  generatePdfFilename,
  cleanOldPdfs,
  pdfExists,
  getPdfPath,
  getPdfStream,
  deletePdf,
  generatePdfHtml,
};