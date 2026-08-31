// FILE: backend/src/server.js
const app = require('./app');
const config = require('./config/env');
const db = require('./config/database');
const { startJobs } = require('./jobs');
const logger = require('./utils/logger');

const PORT = config.PORT || 3000;

/**
 * Inicializa el servidor
 */
const startServer = async () => {
  try {
    // Verificar conexión a base de datos
    await db.raw('SELECT 1');
    logger.info('✅ Conexión a base de datos establecida');

    // Iniciar jobs programados
    startJobs();
    logger.info('✅ Jobs programados iniciados');

    // Iniciar servidor
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
      logger.info(`📁 Entorno: ${config.NODE_ENV}`);
      logger.info(`🕒 ${new Date().toISOString()}`);
    });

    // Manejo de señales de terminación
    const shutdown = async (signal) => {
      logger.info(`\n📴 Recibida señal ${signal}, cerrando servidor...`);
      
      server.close(async () => {
        logger.info('✅ Servidor HTTP cerrado');
        
        try {
          await db.destroy();
          logger.info('✅ Conexión a base de datos cerrada');
        } catch (err) {
          logger.error('❌ Error al cerrar base de datos:', err);
        }
        
        process.exit(0);
      });

      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        logger.error('❌ Forzando cierre del servidor');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Manejo de errores no capturados
    process.on('uncaughtException', (error) => {
      logger.error('❌ Excepción no capturada:', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('❌ Promesa rechazada no manejada:', reason);
      shutdown('unhandledRejection');
    });

    return server;
  } catch (error) {
    logger.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Solo iniciar si no estamos en modo test
if (require.main === module) {
  startServer();
}

module.exports = { startServer };