import { describe, it, expect } from 'vitest';
import { FunctionRequestSchema, validateRequest, BillStateSchema, ProductSchema } from '../../src/utils/validation';

describe('Validation Utils', () => {
  describe('ProductSchema', () => {
    it('should validate valid product', () => {
      const validProduct = { price: 1000, amount: 2 };
      const result = ProductSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it('should reject negative price', () => {
      const invalidProduct = { price: -100, amount: 2 };
      const result = ProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    it('should reject zero units', () => {
      const invalidProduct = { price: 1000, amount: 0 };
      const result = ProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    it('should reject negative units', () => {
      const invalidProduct = { price: 1000, units: -1 };
      const result = ProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });
  });

  describe('BillStateSchema', () => {
    it('should validate complete billState', () => {
      const validBillState = {
        billType: 'Factura A',
        typeDocument: 'CUIT',
        documentNumber: '20123456789',
        IVACondition: 'Responsable Inscripto',
        products: [{ price: 1000, amount: 2 }],
        discount: 10,
      };

      const result = BillStateSchema.safeParse(validBillState);
      expect(result.success).toBe(true);
    });

    it('should validate billState with optional nroAsociado', () => {
      const validBillState = {
        billType: 'Factura B',
        typeDocument: 'DNI',
        documentNumber: 12345678,
        IVACondition: 'Consumidor Final',
        products: [{ price: 500, amount: 1 }],
        discount: 0,
        nroAsociado: 5,
      };

      const result = BillStateSchema.safeParse(validBillState);
      expect(result.success).toBe(true);
    });

    it('should validate billState with number documentNumber', () => {
      const validBillState = {
        billType: 'Factura C',
        typeDocument: 'CUIT',
        documentNumber: 20123456789,
        IVACondition: 'Responsable Inscripto',
        products: [{ price: 2000, amount: 1 }],
        discount: 0,
      };

      const result = BillStateSchema.safeParse(validBillState);
      expect(result.success).toBe(true);
    });

    it('should default discount to 0 if not provided', () => {
      const validBillState = {
        billType: 'Factura A',
        typeDocument: 'CUIT',
        documentNumber: '20123456789',
        IVACondition: 'Responsable Inscripto',
        products: [{ price: 1000, amount: 1 }],
      };

      const result = BillStateSchema.safeParse(validBillState);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.discount).toBe(0);
      }
    });

    it('should reject invalid tipoFactura', () => {
      const invalidBillState = {
        tipoFactura: 'D' as any,
        typeDocument: 'CUIT',
        documentNumber: '20123456789',
        IVACondition: 'Responsable Inscripto',
        products: [{ price: 1000, amount: 1 }],
      };

      const result = BillStateSchema.safeParse(invalidBillState);
      expect(result.success).toBe(false);
    });

    it('should accept empty typeDocument (defaults to empty string)', () => {
      const validBillState = {
        billType: 'Factura A',
        typeDocument: '',
        documentNumber: '20123456789',
        IVACondition: 'Responsable Inscripto',
        products: [{ price: 1000, amount: 1 }],
      };

      const result = BillStateSchema.safeParse(validBillState);
      expect(result.success).toBe(true);
    });

    it('should reject empty products array', () => {
      const invalidBillState = {
        billType: 'Factura A',
        typeDocument: 'CUIT',
        documentNumber: '20123456789',
        IVACondition: 'Responsable Inscripto',
        products: [],
      };

      const result = BillStateSchema.safeParse(invalidBillState);
      expect(result.success).toBe(false);
    });

    it('should reject negative discount', () => {
      const invalidBillState = {
        billType: 'Factura A',
        typeDocument: 'CUIT',
        documentNumber: '20123456789',
        IVACondition: 'Responsable Inscripto',
        products: [{ price: 1000, amount: 1 }],
        discount: -5,
      };

      const result = BillStateSchema.safeParse(invalidBillState);
      expect(result.success).toBe(false);
    });
  });

  describe('FunctionRequestSchema', () => {
    it('should validate valid generateTA request', () => {
      const validRequest = {
        action: 'generateTA',
        accessToken: 'access-token-data',
      };

      const result = FunctionRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject createVoucher without billState', () => {
      const invalidRequest = {
        action: 'createVoucher',
        accessToken: 'access-token-data',
      };

      const result = FunctionRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should validate valid createVoucher with billState', () => {
      const validRequest = {
        action: 'createVoucher',
        accessToken: 'access-token-data',
        billState: {
          billType: 'Factura A',
          typeDocument: 'CUIT',
          documentNumber: '20123456789',
          IVACondition: 'Responsable Inscripto',
          products: [{ price: 1000, amount: 2 }],
          discount: 10,
        },
      };

      const result = FunctionRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should validate request without action (defaults to createVoucher)', () => {
      const validRequest = {
        accessToken: 'access-token-data',
        billState: {
          billType: 'Factura B',
          typeDocument: 'DNI',
          documentNumber: 12345678,
          IVACondition: 'Consumidor Final',
          products: [{ price: 500, amount: 1 }],
        },
      };

      const result = FunctionRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject empty accessToken', () => {
      const invalidRequest = {
        action: 'generateTA',
        accessToken: '',
      };

      const result = FunctionRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('validateRequest', () => {
    it('should return parsed data for valid request', () => {
      const validRequest = {
        action: 'generateTA',
        accessToken: 'access-token-data',
      };

      const result = validateRequest(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data?.accessToken).toBe('access-token-data');
      }
    });

    it('should return error details for invalid request', () => {
      const invalidRequest = {
        action: 'invalid',
        accessToken: 'test',
      };

      const result = validateRequest(invalidRequest);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should return parsed data for valid createVoucher request', () => {
      const validRequest = {
        action: 'createVoucher',
        accessToken: 'access-token-data',
        billState: {
          billType: 'Factura A',
          typeDocument: 'CUIT',
          documentNumber: '20123456789',
          IVACondition: 'Responsable Inscripto',
          products: [{ price: 1000, amount: 1 }],
        },
      };

      const result = validateRequest(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.billState).toBeDefined();
        expect(result.data?.billState?.billType).toBe('Factura A');
      }
    });
  });
});
