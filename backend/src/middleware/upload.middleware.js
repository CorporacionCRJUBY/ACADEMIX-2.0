// FILE: backend/src/middleware/upload.middleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { verifyFileSignature } = require('../utils/fileSignature');
const config = require('../config/env');

// FIX (bajo B6): el límite estaba hardcodeado (15 MB) aunque la config
// exponía UPLOAD_MAX_SIZE_MB sin que nadie lo leyera.
const MAX_FILE_SIZE_MB = Number.isFinite(config.UPLOAD_MAX_SIZE_MB) && config.UPLOAD_MAX_SIZE_MB > 0
  ? config.UPLOAD_MAX_SIZE_MB
  : 10;

// Configurar directorio de uploads
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento en disco
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Subdirectorios por tipo
    let subDir = 'others';
    if (file.mimetype.startsWith('image/')) subDir = 'images';
    else if (file.mimetype === 'application/pdf') subDir = 'pdfs';
    else if (file.mimetype.includes('word') || file.mimetype.includes('document')) subDir = 'documents';
    else if (file.mimetype.includes('sheet') || file.mimetype.includes('excel')) subDir = 'spreadsheets';

    const fullDir = path.join(uploadDir, subDir);
    if (!fs.existsSync(fullDir)) {
      fs.mkdirSync(fullDir, { recursive: true });
    }
    cb(null, fullDir);
  },
  filename: (req, file, cb) => {
    // Sanitizar nombre original: solo letras, números, guiones y puntos
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_');
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    
    // Nombre final: timestamp + uuid + nombre original sanitizado
    const timestamp = Date.now();
    const uniqueId = uuidv4().slice(0, 8);
    const finalName = `${timestamp}-${uniqueId}-${baseName}${ext}`;
    
    cb(null, finalName);
  },
});

// Filtro de archivos permitidos.
// NOTA DE SEGURIDAD (auditoria hallazgo medio #4): `file.mimetype` y la
// extensión de `file.originalname` los declara el cliente en el propio
// request multipart — no reflejan el contenido real del archivo, y son
// triviales de falsificar (renombrar app.php a doc.pdf + mandar
// Content-Type: application/pdf a mano). Este filtro sigue sirviendo como
// primer descarte rápido/barato (rechaza antes de escribir a disco lo que
// ni siquiera *dice* ser un tipo permitido), pero el chequeo que realmente
// importa es `verifyFileContent` más abajo, que lee los primeros bytes del
// archivo ya escrito en disco y valida su firma real.
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
  ];

  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.docx', '.doc', '.xlsx', '.xls', '.csv'];

  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  if (allowedMimeTypes.includes(mimeType) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Supported: ${allowedExtensions.join(', ')}`), false);
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter: fileFilter,
});

// Middleware para manejo de errores de multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(413).json({
        success: false,
        code: 'FILE_TOO_LARGE',
        message: `File exceeds ${MAX_FILE_SIZE_MB}MB limit`,
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        code: 'UNEXPECTED_FILE',
        message: 'Unexpected file field',
      });
    }
    return res.status(400).json({
      success: false,
      code: 'UPLOAD_ERROR',
      message: err.message,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_FILE_TYPE',
      message: err.message,
    });
  }

  next();
};

// FIX (auditoria hallazgo medio #4 - validación de archivos subidos solo
// por extensión/MIME declarado por el cliente): a esta altura multer ya
// escribió el/los archivo(s) en disco (así que `verifyFileSignature` puede
// leer sus bytes reales, no lo que el cliente afirma). Si el contenido no
// coincide con la extensión declarada, se borra el archivo del disco y se
// rechaza la petición con 400 — nunca llega al controlador ni queda un
// archivo malicioso huérfano en /uploads.
const verifyFileContent = async (req, res, next) => {
  try {
    const files = req.files
      ? Array.isArray(req.files)
        ? req.files
        : Object.values(req.files).flat()
      : req.file
      ? [req.file]
      : [];

    if (files.length === 0) return next();

    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      const isValid = await verifyFileSignature(file.path, ext);
      if (!isValid) {
        // Limpiar todos los archivos de esta petición, no solo el que falló,
        // para no dejar restos huérfanos de un upload múltiple parcialmente
        // rechazado.
        await Promise.all(
          files.map((f) => fs.promises.unlink(f.path).catch(() => {}))
        );
        return res.status(400).json({
          success: false,
          code: 'INVALID_FILE_CONTENT',
          message: `File content does not match its declared type (${file.originalname})`,
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Exportar middlewares preconfigurados
const single = (fieldName) => [upload.single(fieldName), handleUploadError, verifyFileContent];
const array = (fieldName, maxCount) => [upload.array(fieldName, maxCount), handleUploadError, verifyFileContent];
const fields = (fieldsConfig) => [upload.fields(fieldsConfig), handleUploadError, verifyFileContent];
const any = () => [upload.any(), handleUploadError, verifyFileContent];

module.exports = {
  upload,
  single,
  array,
  fields,
  any,
  handleUploadError,
  verifyFileContent,
  // Para compatibilidad directa con la ruta
  singleUpload: upload.single,
  arrayUpload: upload.array,
  fieldsUpload: upload.fields,
  anyUpload: upload.any,
};