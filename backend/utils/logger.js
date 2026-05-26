/**
 * Winston logger configuration
 * Logs to console and files with different levels per environment
 */

const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, errors, colorize, printf, json } = format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true })
  ),
  transports: [
    // Console transport
    new transports.Console({
      format: combine(colorize(), consoleFormat),
    }),
  ],
});

// In production, also log to files
if (process.env.NODE_ENV === 'production') {
  logger.add(new transports.File({
    filename: path.join(__dirname, '../logs/error.log'),
    level: 'error',
    format: json(),
  }));
  logger.add(new transports.File({
    filename: path.join(__dirname, '../logs/combined.log'),
    format: json(),
  }));
}

module.exports = logger;
