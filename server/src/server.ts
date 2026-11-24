import { app } from './app';
import { env } from './config/env';
import { disconnectDatabase } from './config/database';
import { logger } from './utils/logger';

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Sweety API server running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
  logger.info(`📡 Health endpoint available at http://localhost:${env.PORT}/api/health`);
  logger.info(`🔒 Allowed CORS origin: ${env.CLIENT_URL}`);
});

// Graceful shutdown handling
async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await disconnectDatabase();
      logger.info('Database connection closed.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during database disconnect:', err);
      process.exit(1);
    }
  });

  // Force close if graceful shutdown takes too long
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
