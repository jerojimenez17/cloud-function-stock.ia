import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';

describe('Afip Service - Refactoring Requirements', () => {
  describe('afip.ts should NOT have getTAFromAccessToken', () => {
    it('should NOT have getTAFromAccessToken function', () => {
      const content = fs.readFileSync('./src/services/afip.ts', 'utf-8');
      expect(content).not.toContain('getTAFromAccessToken');
    });
  });

  describe('afip.ts should NOT call firestore functions', () => {
    it('should NOT call saveTAToken', () => {
      const content = fs.readFileSync('./src/services/afip.ts', 'utf-8');
      expect(content).not.toContain('saveTAToken');
    });

    it('should NOT call getTAToken', () => {
      const content = fs.readFileSync('./src/services/afip.ts', 'utf-8');
      expect(content).not.toContain('getTAToken');
    });
  });
});

describe('TAToken Type - Uses Native Date', () => {
  it('should NOT import Timestamp from firebase-admin/firestore', () => {
    const content = fs.readFileSync('./src/types/arca.ts', 'utf-8');
    expect(content).not.toContain('firebase-admin/firestore');
    expect(content).not.toContain('Timestamp');
  });

  it('should use Date type for generationTime', () => {
    const content = fs.readFileSync('./src/types/arca.ts', 'utf-8');
    const match = content.match(/generationTime:\s*(\w+)/);
    expect(match?.[1]).toBe('Date');
  });

  it('should use Date type for expirationTime', () => {
    const content = fs.readFileSync('./src/types/arca.ts', 'utf-8');
    const match = content.match(/expirationTime:\s*(\w+)/);
    expect(match?.[1]).toBe('Date');
  });
});

describe('Firestore Service - Functions Removed', () => {
  const firestorePath = './src/services/firestore.ts';

  it('should NOT export saveTAToken (file deleted or function removed)', () => {
    if (!fs.existsSync(firestorePath)) {
      expect(true).toBe(true);
      return;
    }
    const content = fs.readFileSync(firestorePath, 'utf-8');
    expect(content).not.toMatch(/export\s+async\s+function\s+saveTAToken/);
  });

  it('should NOT export getTAToken (file deleted or function removed)', () => {
    if (!fs.existsSync(firestorePath)) {
      expect(true).toBe(true);
      return;
    }
    const content = fs.readFileSync(firestorePath, 'utf-8');
    expect(content).not.toMatch(/export\s+async\s+function\s+getTAToken/);
  });

  it('should NOT export isTATokenExpired (file deleted or function removed)', () => {
    if (!fs.existsSync(firestorePath)) {
      expect(true).toBe(true);
      return;
    }
    const content = fs.readFileSync(firestorePath, 'utf-8');
    expect(content).not.toMatch(/export\s+function\s+isTATokenExpired/);
  });
});

describe('firestore.test.ts should be deleted', () => {
  it('test/services/firestore.test.ts should not exist', () => {
    expect(fs.existsSync('./test/services/firestore.test.ts')).toBe(false);
  });
});
