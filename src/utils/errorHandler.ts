import { toast } from "sonner";
import logger from '@/utils/logger';

interface ErrorOptions {
  showToast?: boolean;
  toastTitle?: string;
  toastMessage?: string;
  logToConsole?: boolean;
}

/**
 * Centralized error handler for API calls and other async operations
 * 
 * @param error The error object
 * @param options Configuration options for error handling
 * @returns The original error for further processing if needed
 */
export const handleError = (
  error: unknown, 
  options: ErrorOptions = {
    showToast: true,
    toastTitle: "Error",
    toastMessage: "An unexpected error occurred. Please try again.",
    logToConsole: true
  }
): unknown => {
  // Default options
  const {
    showToast = true,
    toastTitle = "Error",
    toastMessage,
    logToConsole = true
  } = options;

  // Get error message
  let errorMessage = "An unexpected error occurred";
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = String((error as { message: unknown }).message);
  }

  // Log to console if enabled
  if (logToConsole) {
    logger.error("Error caught by handleError:", error);
  }

  // Show toast notification if enabled
  if (showToast) {
    toast.error(toastTitle, {
      description: toastMessage || errorMessage,
      duration: 5000,
    });
  }

  // Return the original error for further processing
  return error;
};

/**
 * Wrap an async function with error handling
 * 
 * @param fn The async function to wrap
 * @param options Error handling options
 * @returns A wrapped function with error handling
 */
export const withErrorHandling = <T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  options?: ErrorOptions
) => {
  return async (...args: Args): Promise<T | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, options);
      return undefined;
    }
  };
}; 