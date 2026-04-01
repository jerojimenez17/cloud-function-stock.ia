import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAFIPVoucher } from '../../src/index';

interface MockResponse {
  statusCode: number;
  headers: Record<string, string | string[]>;
  body: any;
  sent: boolean;
  send: (data: any) => MockResponse;
  status: (code: number) => MockResponse;
  set: (header: string, value: string | string[]) => MockResponse;
}

function createMockResponse(): MockResponse {
  const response = {
    statusCode: 200,
    headers: {} as Record<string, string | string[]>,
    body: null as any,
    sent: false,
    send: function(data: any) {
      this.body = data;
      this.sent = true;
      return this;
    },
    status: function(code: number) {
      this.statusCode = code;
      return this;
    },
    set: function(header: string, value: string | string[]) {
      this.headers[header] = value;
      return this;
    },
  };

  return response as MockResponse;
}

function createMockRequest(method: string = 'POST', body: any = {}, headers: Record<string, string> = {}) {
  return {
    method,
    body,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  };
}

describe('createAFIPVoucher HTTP Handler', () => {
  let mockResponse: MockResponse;

  beforeEach(() => {
    vi.clearAllMocks();
    mockResponse = createMockResponse();
  });

  describe('OPTIONS preflight requests', () => {
    it('should handle OPTIONS request with CORS headers', async () => {
      const mockRequest = createMockRequest('OPTIONS', {}, { origin: 'https://renata-three.vercel.app' });

      await createAFIPVoucher(mockRequest as any, mockResponse as any);

      expect(mockResponse.statusCode).toBe(204);
      expect(mockResponse.sent).toBe(true);
      expect(mockResponse.headers['Access-Control-Allow-Origin']).toBe('https://renata-three.vercel.app');
      expect(mockResponse.headers['Access-Control-Allow-Methods']).toBe('POST, OPTIONS');
      expect(mockResponse.headers['Access-Control-Allow-Headers']).toBe('Content-Type, Authorization');
    });

    it('should handle OPTIONS request from localhost', async () => {
      const mockRequest = createMockRequest('OPTIONS', {}, { origin: 'http://localhost:3000' });

      await createAFIPVoucher(mockRequest as any, mockResponse as any);

      expect(mockResponse.statusCode).toBe(204);
      expect(mockResponse.headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000');
    });

    it('should handle OPTIONS request with unknown origin (fallback)', async () => {
      const mockRequest = createMockRequest('OPTIONS', {}, { origin: 'https://unknown-site.com' });

      await createAFIPVoucher(mockRequest as any, mockResponse as any);

      expect(mockResponse.statusCode).toBe(204);
      expect(mockResponse.headers['Access-Control-Allow-Origin']).toBe('https://renata-three.vercel.app');
    });

    it('should handle OPTIONS request without origin header', async () => {
      const mockRequest = createMockRequest('OPTIONS', {}, {});

      await createAFIPVoucher(mockRequest as any, mockResponse as any);

      expect(mockResponse.statusCode).toBe(204);
      expect(mockResponse.headers['Access-Control-Allow-Origin']).toBe('https://renata-three.vercel.app');
    });
  });

  describe('CORS handling for POST requests', () => {
    it('should set CORS headers for valid origin', async () => {
      const mockRequest = createMockRequest(
        'POST',
        {
          action: 'createVoucher',
          cuit: '20393425920',
          encryptedCert: 'cert-placeholder',
          encryptedKey: 'key-placeholder',
          billState: {
            billType: 'Factura A',
            typeDocument: 'CUIT',
            documentNumber: '20123456789',
            IVACondition: 'Responsable Inscripto',
            products: [{ price: 1000, amount: 1 }],
            discount: 0,
          },
        },
        { origin: 'https://renata-three.vercel.app' }
      );

      await createAFIPVoucher(mockRequest as any, mockResponse as any);

      expect(mockResponse.headers['Access-Control-Allow-Origin']).toBe('https://renata-three.vercel.app');
      expect(mockResponse.headers['Access-Control-Allow-Methods']).toBe('POST, OPTIONS');
      expect(mockResponse.headers['Access-Control-Allow-Headers']).toBe('Content-Type, Authorization');
    });

    it('should set fallback CORS origin for unknown origin', async () => {
      const mockRequest = createMockRequest(
        'POST',
        {
          action: 'createVoucher',
          cuit: '20393425920',
          encryptedCert: 'cert-placeholder',
          encryptedKey: 'key-placeholder',
          billState: {
            billType: 'Factura A',
            typeDocument: 'CUIT',
            documentNumber: '20123456789',
            IVACondition: 'Responsable Inscripto',
            products: [{ price: 1000, amount: 1 }],
            discount: 0,
          },
        },
        { origin: 'https://malicious-site.com' }
      );

      await createAFIPVoucher(mockRequest as any, mockResponse as any);

      expect(mockResponse.headers['Access-Control-Allow-Origin']).toBe('https://renata-three.vercel.app');
    });

    it('should set fallback CORS origin when no origin header present', async () => {
      const mockRequest = createMockRequest(
        'POST',
        {
          action: 'createVoucher',
          cuit: '20393425920',
          encryptedCert: 'cert-placeholder',
          encryptedKey: 'key-placeholder',
          billState: {
            billType: 'Factura A',
            typeDocument: 'CUIT',
            documentNumber: '20123456789',
            IVACondition: 'Responsable Inscripto',
            products: [{ price: 1000, amount: 1 }],
            discount: 0,
          },
        },
        {}
      );

      await createAFIPVoucher(mockRequest as any, mockResponse as any);

      expect(mockResponse.headers['Access-Control-Allow-Origin']).toBe('https://renata-three.vercel.app');
    });
  });

  describe('Request body validation', () => {
    it('should return 400 for missing billState', async () => {
      const mockRequest = createMockRequest(
        'POST',
        {
          action: 'createVoucher',
          cuit: '20393425920',
          encryptedCert: 'cert-placeholder',
          encryptedKey: 'key-placeholder',
        },
        { origin: 'https://renata-three.vercel.app' }
      );

      await createAFIPVoucher(mockRequest as any, mockResponse as any);

      expect(mockResponse.statusCode).toBe(400);
      expect(mockResponse.sent).toBe(true);
    });

    it('should return 400 for missing authentication credentials', async () => {
      const mockRequest = createMockRequest(
        'POST',
        {
          action: 'createVoucher',
          billState: {
            billType: 'Factura A',
            typeDocument: 'CUIT',
            documentNumber: '20123456789',
            IVACondition: 'Responsable Inscripto',
            products: [{ price: 1000, amount: 1 }],
            discount: 0,
          },
        },
        { origin: 'https://renata-three.vercel.app' }
      );

      await createAFIPVoucher(mockRequest as any, mockResponse as any);

      expect(mockResponse.statusCode).toBe(400);
      expect(mockResponse.sent).toBe(true);
    });

    it('should return 400 for invalid billState products (empty array)', async () => {
      const mockRequest = createMockRequest(
        'POST',
        {
          action: 'createVoucher',
          cuit: '20393425920',
          encryptedCert: 'cert-placeholder',
          encryptedKey: 'key-placeholder',
          billState: {
            billType: 'Factura A',
            typeDocument: 'CUIT',
            documentNumber: '20123456789',
            IVACondition: 'Responsable Inscripto',
            products: [],
            discount: 0,
          },
        },
        { origin: 'https://renata-three.vercel.app' }
      );

      await createAFIPVoucher(mockRequest as any, mockResponse as any);

      expect(mockResponse.statusCode).toBe(400);
      expect(mockResponse.sent).toBe(true);
    });

    it('should handle unknown billType by defaulting to Factura C', async () => {
      const mockRequest = createMockRequest(
        'POST',
        {
          action: 'createVoucher',
          cuit: '20393425920',
          encryptedCert: 'cert-placeholder',
          encryptedKey: 'key-placeholder',
          billState: {
            billType: 'Factura X',
            typeDocument: 'CUIT',
            documentNumber: '20123456789',
            IVACondition: 'Responsable Inscripto',
            products: [{ price: 1000, amount: 1 }],
            discount: 0,
          },
        },
        { origin: 'https://renata-three.vercel.app' }
      );

      await createAFIPVoucher(mockRequest as any, mockResponse as any);

      expect(mockResponse.statusCode).toBe(200);
      expect(mockResponse.body).toHaveProperty('CAE');
    });
  });

  describe('Successful voucher creation', () => {
    it('should return 200 with CAE data on successful creation', async () => {
      const mockRequest = createMockRequest(
        'POST',
        {
          action: 'createVoucher',
          cuit: '20393425920',
          encryptedCert: 'cert-placeholder',
          encryptedKey: 'key-placeholder',
          billState: {
            billType: 'Factura A',
            typeDocument: 'CUIT',
            documentNumber: '20123456789',
            IVACondition: 'Responsable Inscripto',
            products: [{ price: 1000, amount: 1 }],
            discount: 0,
          },
        },
        { origin: 'https://renata-three.vercel.app' }
      );

      await createAFIPVoucher(mockRequest as any, mockResponse as any);

      expect(mockResponse.statusCode).toBe(200);
      expect(mockResponse.sent).toBe(true);
      expect(mockResponse.body).toHaveProperty('CAE');
      expect(mockResponse.body).toHaveProperty('CAEFchVto');
    });

    it('should handle TipoFactura B correctly', async () => {
      const mockRequest = createMockRequest(
        'POST',
        {
          action: 'createVoucher',
          cuit: '20393425920',
          encryptedCert: 'cert-placeholder',
          encryptedKey: 'key-placeholder',
          billState: {
            billType: 'Factura B',
            typeDocument: 'DNI',
            documentNumber: 12345678,
            IVACondition: 'Consumidor Final',
            products: [{ price: 500, amount: 2 }],
            discount: 5,
          },
        },
        { origin: 'http://localhost:3000' }
      );

      await createAFIPVoucher(mockRequest as any, mockResponse as any);

      expect(mockResponse.statusCode).toBe(200);
      expect(mockResponse.body).toHaveProperty('CAE');
    });

    it('should handle TipoFactura C correctly', async () => {
      const mockRequest = createMockRequest(
        'POST',
        {
          action: 'createVoucher',
          cuit: '20393425920',
          encryptedCert: 'cert-placeholder',
          encryptedKey: 'key-placeholder',
          billState: {
            billType: 'Factura C',
            typeDocument: 'CUIT',
            documentNumber: '20123456789',
            IVACondition: 'Responsable Inscripto',
            products: [{ price: 2000, amount: 1 }],
            discount: 0,
          },
        },
        { origin: 'https://renata-three.vercel.app' }
      );

      await createAFIPVoucher(mockRequest as any, mockResponse as any);

      expect(mockResponse.statusCode).toBe(200);
      expect(mockResponse.body).toHaveProperty('CAE');
    });

    it('should handle nota credito (nroAsociado) correctly', async () => {
      const mockRequest = createMockRequest(
        'POST',
        {
          action: 'createVoucher',
          cuit: '20393425920',
          encryptedCert: 'cert-placeholder',
          encryptedKey: 'key-placeholder',
          billState: {
            billType: 'Factura A',
            typeDocument: 'CUIT',
            documentNumber: '20123456789',
            IVACondition: 'Responsable Inscripto',
            products: [{ price: 1000, amount: 1 }],
            discount: 0,
            nroAsociado: 10,
          },
        },
        { origin: 'https://renata-three.vercel.app' }
      );

      await createAFIPVoucher(mockRequest as any, mockResponse as any);

      expect(mockResponse.statusCode).toBe(200);
      expect(mockResponse.body).toHaveProperty('CAE');
    });
  });

  describe('Error handling', () => {
    it('should return 400 for validation errors (invalid encryptedCert)', async () => {
      const invalidRequest = createMockRequest(
        'POST',
        {
          action: 'createVoucher',
          cuit: '20393425920',
          encryptedCert: '',
          encryptedKey: 'key-placeholder',
          billState: {
            billType: 'Factura A',
            typeDocument: 'CUIT',
            documentNumber: '20123456789',
            IVACondition: 'Responsable Inscripto',
            products: [{ price: 1000, amount: 1 }],
            discount: 0,
          },
        },
        { origin: 'https://renata-three.vercel.app' }
      );

      await createAFIPVoucher(invalidRequest as any, mockResponse as any);

      expect(mockResponse.statusCode).toBe(400);
      expect(mockResponse.sent).toBe(true);
    });
  });

  describe('HTTP method restrictions', () => {
    it('should reject non-POST, non-OPTIONS methods', async () => {
      const mockRequest = createMockRequest('GET', {}, { origin: 'https://renata-three.vercel.app' });

      await createAFIPVoucher(mockRequest as any, mockResponse as any);

      expect(mockResponse.statusCode).toBe(400);
      expect(mockResponse.sent).toBe(true);
    });

    it('should reject PUT requests', async () => {
      const mockRequest = createMockRequest('PUT', {}, { origin: 'https://renata-three.vercel.app' });

      await createAFIPVoucher(mockRequest as any, mockResponse as any);

      expect(mockResponse.statusCode).toBe(400);
      expect(mockResponse.sent).toBe(true);
    });

    it('should reject DELETE requests', async () => {
      const mockRequest = createMockRequest('DELETE', {}, { origin: 'https://renata-three.vercel.app' });

      await createAFIPVoucher(mockRequest as any, mockResponse as any);

      expect(mockResponse.statusCode).toBe(400);
      expect(mockResponse.sent).toBe(true);
    });
  });
});
