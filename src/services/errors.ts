/**
 * Custom error class for AFIP authentication failures
 */
export class AFIPAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AFIPAuthError";
  }
}

/**
 * Custom error class for AFIP API errors
 */
export class AFIPApiError extends Error {
  public details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "AFIPApiError";
    this.details = details;
  }
}

/**
 * Custom error class for decryption failures
 */
export class DecryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DecryptionError";
  }
}
