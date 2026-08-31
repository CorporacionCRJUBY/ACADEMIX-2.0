// FILE: backend/src/utils/logger.js
const fs = require('fs');
const path = require('path');

// Crear directorio de logs si no existe
const logDir = path.resolve(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

const getLogLevel = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;
};

const getTimestamp = () => {
  return new Date().toISOString();
};

const writeLog = (level, message, meta = {}) => {
  const currentLevel = getLogLevel();
  const levels = Object.values(LOG_LEVELS);
  const currentIndex = levels.indexOf(currentLevel);
  const messageIndex = levels.indexOf(level);
  
  if (messageIndex > currentIndex) return;

  const logEntry = {
    timestamp: getTimestamp(),
    level,
    message,
    ...meta,
  };

  // Console output
  const color = level === 'ERROR' ? '\x1b[31m' :
                level === 'WARN' ? '\x1b[33m' :
                level === 'INFO' ? '\x1b[32m' : '\x1b[36m';
  const displayMessage = typeof message === 'string' ? message : JSON.stringify(message);
  console.log(`${color}[${level}]${'\x1b[0m'} ${getTimestamp()} - ${displayMessage}`);

  // File output (solo para ERROR y WARN en producción)
  if (level === 'ERROR' || level === 'WARN') {
    const logFile = path.join(logDir, `${level.toLowerCase()}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }

  // Archivo general de logs
  const generalLog = path.join(logDir, 'app.log');
  fs.appendFileSync(generalLog, JSON.stringify(logEntry) + '\n');
};

const logger = {
  error: (message, meta = {}) => writeLog(LOG_LEVELS.ERROR, message, meta),
  warn: (message, meta = {}) => writeLog(LOG_LEVELS.WARN, message, meta),
  info: (message, meta = {}) => writeLog(LOG_LEVELS.INFO, message, meta),
  debug: (message, meta = {}) => writeLog(LOG_LEVELS.DEBUG, message, meta),
};

module.exports = logger;