const registerProcessGuards = ({ initLogging }) => {
  const logger = initLogging();

  process.on('uncaughtException', (error) => {
    logger.logError('uncaught_exception', error);
  });

  process.on('unhandledRejection', (reason) => {
    logger.logError('unhandled_rejection', reason);
  });
};

module.exports = { registerProcessGuards };
