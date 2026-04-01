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
  constructor(message: string) {
    super(message);
    this.name = "AFIPApiError";
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
