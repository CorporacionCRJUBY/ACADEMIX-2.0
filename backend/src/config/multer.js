// FILE: backend/src/config/multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('./env');

// Asegurar que el directorio de uploads existe
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento en disco
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Subdirectorios según tipo de archivo (opcional)
    let subDir = '';
    if (file.mimetype.startsWith('image/')) subDir = 'images';
    else if (file.mimetype.startsWith('application/pdf')) subDir = 'pdfs';
    else subDir = 'others';

    const fullDir = path.join(uploadDir, subDir);
    if (!fs.existsSync(fullDir)) {
      fs.mkdirSync(fullDir, { recursive: true });
    }
    cb(null, fullDir);
  },
  filename: (req, file, cb) => {
    // Nombre único: timestamp + random + extensión original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// Límite de tamaño (desde env)
const maxSize = config.UPLOAD_MAX_SIZE_MB * 1024 * 1024;

// Exportamos la instancia de multer con la configuración base
// La lógica de filtro por tipo de archivo vive en middleware/upload.middleware.js
// Acá solo mantenemos la configuración de almacenamiento y límite.
const upload = multer({
  storage,
  limits: { fileSize: maxSize },
});

module.exports = {
  upload,
  uploadDir,
  maxSize,
};