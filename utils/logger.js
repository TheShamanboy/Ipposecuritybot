/**
 * Simple logging utility
 * @param {string} level - The log level (info, warn, error)
 * @param {string} message - The log message
 * @param {Error} [error] - Optional error object for additional details
 */
function log(level, message, error = null) {
  const timestamp = new Date().toISOString();
  
  // Format the log message
  let logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  // Log to console with appropriate color
  switch (level.toLowerCase()) {
    case 'info':
      console.log('\x1b[36m%s\x1b[0m', logMessage); // Cyan
      break;
    case 'warn':
      console.log('\x1b[33m%s\x1b[0m', logMessage); // Yellow
      break;
    case 'error':
      console.log('\x1b[31m%s\x1b[0m', logMessage); // Red
      if (error && error.stack) {
        console.log('\x1b[31m%s\x1b[0m', error.stack); // Red
      }
      break;
    default:
      console.log(logMessage);
  }
}

module.exports = { log };
