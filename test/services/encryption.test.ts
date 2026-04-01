import { describe, it, expect, beforeEach } from 'vitest';
import { encrypt, decrypt } from '../../src/services/encryption';

describe('Encryption Service', () => {
  describe('encrypt', () => {
    it('should encrypt a string and return iv:encrypted format', () => {
      const plaintext = 'test certificate content';
      const encrypted = encrypt(plaintext);
      
      expect(encrypted).toMatch(/^[a-f0-9]+:[a-f0-9]+$/);
    });
    
    it('should produce different ciphertext for same input (due to random IV)', () => {
      const plaintext = 'test content';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);
      
      expect(encrypted1).not.toBe(encrypted2);
    });
  });
  
  describe('decrypt', () => {
    it('should decrypt encrypted text back to original', () => {
      const original = 'certificate content';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(original);
    });
    
    it('should throw error for invalid encrypted format', () => {
      expect(() => decrypt('invalid')).toThrow('Invalid encrypted format');
    });
  });
});
