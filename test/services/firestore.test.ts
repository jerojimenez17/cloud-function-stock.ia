import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isTATokenExpired } from '../../src/services/firestore';

describe('Firestore Service', () => {
  describe('isTATokenExpired', () => {
    it('should return true when expirationTime is in the past', () => {
      const expiredToken = {
        token: 'test',
        sign: 'test',
        expirationTime: { toDate: () => new Date(Date.now() - 1000) },
        generationTime: { toDate: () => new Date(Date.now() - 86400000) },
        source: 'test',
        destination: 'test',
      };
      
      expect(isTATokenExpired(expiredToken as any)).toBe(true);
    });
    
    it('should return false when expirationTime is in the future (>1 hour)', () => {
      const validToken = {
        token: 'test',
        sign: 'test',
        expirationTime: { toDate: () => new Date(Date.now() + 86400000) },
        generationTime: { toDate: () => new Date() },
        source: 'test',
        destination: 'test',
      };
      
      expect(isTATokenExpired(validToken as any)).toBe(false);
    });
    
    it('should return true when less than 1 hour remaining', () => {
      const soonExpiringToken = {
        token: 'test',
        sign: 'test',
        expirationTime: { toDate: () => new Date(Date.now() + 1800000) },
        generationTime: { toDate: () => new Date() },
        source: 'test',
        destination: 'test',
      };
      
      expect(isTATokenExpired(soonExpiringToken as any)).toBe(true);
    });

    it('should return true when exactly at threshold (1 hour)', () => {
      const atThresholdToken = {
        token: 'test',
        sign: 'test',
        expirationTime: { toDate: () => new Date(Date.now() + 3600000) },
        generationTime: { toDate: () => new Date() },
        source: 'test',
        destination: 'test',
      };
      
      expect(isTATokenExpired(atThresholdToken as any)).toBe(true);
    });
  });
});
