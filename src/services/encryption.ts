import crypto from "crypto";
import {DecryptionError} from "./errors.js";

export {DecryptionError};

const ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY = process.env.ARCA_ENCRYPTION_KEY ||
  "default-secret-key-32-chars-long!!";
const IV_LENGTH = 16;

/**
 * Encrypts a text using AES-256-CBC
 * @param text - The text to encrypt
 * @return The encrypted text in format iv:encryptedData
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)),
    iv
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

/**
 * Decrypts an encrypted text using AES-256-CBC
 * @param text - The encrypted text in format iv:encryptedData
 * @return The decrypted text
 * @throws DecryptionError if decryption fails
 */
export function decrypt(text: string): string {
  const textParts = text.split(":");
  const ivPart = textParts.shift();
  if (!ivPart || textParts.length === 0) {
    throw new DecryptionError("Invalid encrypted format");
  }

  const iv = Buffer.from(ivPart, "hex");
  if (iv.length !== IV_LENGTH) {
    throw new DecryptionError("Invalid encrypted format");
  }

  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  if (encryptedText.length === 0) {
    throw new DecryptionError("Invalid encrypted format");
  }

  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)),
      iv
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch {
    throw new DecryptionError("Invalid encrypted format");
  }
}
