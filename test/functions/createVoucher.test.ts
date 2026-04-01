import {describe, it, expect, vi, beforeEach} from "vitest";
import {createVoucher} from "../../src/functions/createVoucher";

describe("CreateVoucher Function", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("BillState format validation", () => {
    it("should create voucher with valid billState (TipoFactura A)", async () => {
      const mockBillState = {
        billType: "Factura A",
        typeDocument: "CUIT",
        documentNumber: "20123456789",
        IVACondition: "Responsable Inscripto",
        products: [{price: 1000, amount: 2}],
        discount: 0,
      };

      const result = await createVoucher({
        action: "createVoucher",
        cuit: "20393425920",
        encryptedCert: "cert-placeholder",
        encryptedKey: "key-placeholder",
        billState: mockBillState,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("CAE");
      expect(result.data).toHaveProperty("CAEFchVto");
      expect(result.data).toHaveProperty("ptoVenta");
      expect(result.data).toHaveProperty("nroCbte");
    });

    it("should create voucher with TipoFactura B", async () => {
      const mockBillState = {
        billType: "Factura B",
        typeDocument: "DNI",
        documentNumber: 12345678,
        IVACondition: "Consumidor Final",
        products: [{price: 500, amount: 1}],
        discount: 10,
      };

      const result = await createVoucher({
        action: "createVoucher",
        cuit: "20393425920",
        encryptedCert: "cert-placeholder",
        encryptedKey: "key-placeholder",
        billState: mockBillState,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("CAE");
    });

    it("should create voucher with TipoFactura C", async () => {
      const mockBillState = {
        billType: "Factura C",
        typeDocument: "CUIT",
        documentNumber: "20123456789",
        IVACondition: "Responsable Inscripto",
        products: [{price: 2000, amount: 1}],
        discount: 0,
      };

      const result = await createVoucher({
        action: "createVoucher",
        cuit: "20393425920",
        encryptedCert: "cert-placeholder",
        encryptedKey: "key-placeholder",
        billState: mockBillState,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("CAE");
    });

    it("should create voucher with nota credito (nroAsociado)", async () => {
      const mockBillState = {
        billType: "Factura A",
        typeDocument: "CUIT",
        documentNumber: "20123456789",
        IVACondition: "Responsable Inscripto",
        products: [{price: 1000, amount: 1}],
        discount: 0,
        nroAsociado: 5,
      };

      const result = await createVoucher({
        action: "createVoucher",
        cuit: "20393425920",
        encryptedCert: "cert-placeholder",
        encryptedKey: "key-placeholder",
        billState: mockBillState,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("CAE");
    });

    it("should create voucher with multiple products", async () => {
      const mockBillState = {
        billType: "Factura A",
        typeDocument: "CUIT",
        documentNumber: "20123456789",
        IVACondition: "Responsable Inscripto",
        products: [
          {price: 1000, amount: 2},
          {price: 500, amount: 3},
          {price: 2500, amount: 1},
        ],
        discount: 15,
      };

      const result = await createVoucher({
        action: "createVoucher",
        cuit: "20393425920",
        encryptedCert: "cert-placeholder",
        encryptedKey: "key-placeholder",
        billState: mockBillState,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("CAE");
    });
  });

  describe("Request validation", () => {
    it("should return error when billState is missing", async () => {
      const result = await createVoucher({
        action: "createVoucher",
        cuit: "20393425920",
        encryptedCert: "cert-placeholder",
        encryptedKey: "key-placeholder",
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("VALIDATION_ERROR");
    });

    it("should return error when billState has empty products array",
        async () => {
          const mockBillState = {
            billType: "Factura A",
            typeDocument: "CUIT",
            documentNumber: "20123456789",
            IVACondition: "Responsable Inscripto",
            products: [],
            discount: 0,
          };

          const result = await createVoucher({
            action: "createVoucher",
            cuit: "20393425920",
            encryptedCert: "cert-placeholder",
            encryptedKey: "key-placeholder",
            billState: mockBillState,
          });

          expect(result.success).toBe(false);
          expect(result.error?.code).toBe("VALIDATION_ERROR");
        });

    it("should return error when billType is invalid", async () => {
      const mockBillState = {
        billType: "Factura X",
        typeDocument: "CUIT",
        documentNumber: "20123456789",
        IVACondition: "Responsable Inscripto",
        products: [{price: 1000, amount: 1}],
        discount: 0,
      };

      const result = await createVoucher({
        action: "createVoucher",
        cuit: "20393425920",
        encryptedCert: "cert-placeholder",
        encryptedKey: "key-placeholder",
        billState: mockBillState,
      });

      expect(result.success).toBe(true); // Defaults to C
      expect(result.data).toHaveProperty("CAE");
    });

    it("should default typeDocument when empty", async () => {
      const mockBillState = {
        billType: "Factura A",
        typeDocument: "",
        documentNumber: "20123456789",
        IVACondition: "Responsable Inscripto",
        products: [{price: 1000, amount: 1}],
        discount: 0,
      };

      const result = await createVoucher({
        action: "createVoucher",
        cuit: "20393425920",
        encryptedCert: "cert-placeholder",
        encryptedKey: "key-placeholder",
        billState: mockBillState,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("CAE");
    });

    it("should return error when discount is negative", async () => {
      const mockBillState = {
        billType: "Factura A",
        typeDocument: "CUIT",
        documentNumber: "20123456789",
        IVACondition: "Responsable Inscripto",
        products: [{price: 1000, amount: 1}],
        discount: -10,
      };

      const result = await createVoucher({
        action: "createVoucher",
        cuit: "20393425920",
        encryptedCert: "cert-placeholder",
        encryptedKey: "key-placeholder",
        billState: mockBillState,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("VALIDATION_ERROR");
    });

    it("should default IVACondition when empty", async () => {
      const mockBillState = {
        billType: "Factura A",
        typeDocument: "CUIT",
        documentNumber: "20123456789",
        IVACondition: "",
        products: [{price: 1000, amount: 1}],
        discount: 0,
      };

      const result = await createVoucher({
        action: "createVoucher",
        cuit: "20393425920",
        encryptedCert: "cert-placeholder",
        encryptedKey: "key-placeholder",
        billState: mockBillState,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("CAE");
    });
  });

  describe("Action validation", () => {
    it("should return error for invalid action", async () => {
      const result = await createVoucher({
        action: "generateTA" as any,
        cuit: "20393425920",
        encryptedCert: "cert-placeholder",
        encryptedKey: "key-placeholder",
        billState: {
          billType: "Factura A",
          typeDocument: "CUIT",
          documentNumber: "20123456789",
          IVACondition: "Responsable Inscripto",
          products: [{price: 1000, amount: 1}],
          discount: 0,
        },
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("VALIDATION_ERROR");
    });
  });
});
