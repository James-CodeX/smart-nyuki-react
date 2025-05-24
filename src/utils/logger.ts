/**
 * Logger utility to handle logging in different environments
 * In production, all logs are suppressed
 * In development, logs are displayed as normal
 */

const isProduction = process.env.NODE_ENV === 'production';

const logger = {
  log: (...args: any[]): void => {
    if (!isProduction) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]): void => {
    if (!isProduction) {
      console.error(...args);
    }
  },
  
  warn: (...args: any[]): void => {
    if (!isProduction) {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]): void => {
    if (!isProduction) {
      console.info(...args);
    }
  }
};

export default logger; 