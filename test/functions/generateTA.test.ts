import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTA } from '../../src/functions/generateTA';

vi.mock('../../src/services/afip', () => ({
  generateTAToken: vi.fn().mockResolvedValue({
    token: 'mock-token',
    sign: 'mock-sign',
    source: 'mock-source',
    destination: 'mock-dest',
    expirationTime: new Date(Date.now() + 86400000),
  }),
  getOrRefreshTAToken: vi.fn().mockResolvedValue({
    token: 'mock-token',
    sign: 'mock-sign',
    source: 'mock-source',
    destination: 'mock-dest',
    generationTime: { toDate: () => new Date() },
    expirationTime: { toDate: () => new Date(Date.now() + 86400000) },
  }),
  AFIPAuthError: class AFIPAuthError extends Error {
    constructor() { super('AFIP auth failed'); this.name = 'AFIPAuthError'; }
  },
  AFIPApiError: class AFIPApiError extends Error {
    constructor(msg: string) { super(msg); this.name = 'AFIPApiError'; }
  },
}));

describe('GenerateTA Function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should generate TA with valid encrypted credentials', async () => {
    const result = await generateTA({
      action: 'generateTA',
      encryptedCert: 'encrypted-cert-placeholder',
      encryptedKey: 'encrypted-key-placeholder',
    });
    
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('token');
    expect(result.data).toHaveProperty('sign');
  });
  
  it('should return error for missing encryptedCert', async () => {
    const result = await generateTA({
      action: 'generateTA',
      encryptedCert: '',
      encryptedKey: 'key',
    });
    
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('VALIDATION_ERROR');
  });

  it('should return error for missing encryptedKey', async () => {
    const result = await generateTA({
      action: 'generateTA',
      encryptedCert: 'cert',
      encryptedKey: '',
    });
    
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('VALIDATION_ERROR');
  });

  it('should generate TA with accessToken', async () => {
    const result = await generateTA({
      action: 'generateTA',
      accessToken: 'access-token-placeholder',
    });
    
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('token');
  });
});
