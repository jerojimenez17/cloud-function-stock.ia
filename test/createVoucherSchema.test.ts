import { describe, it, expect } from "vitest";
import { CreateVoucherSchema } from "../src/functions/createVoucher.js";

describe("CreateVoucherSchema validation", () => {
  const validBasePayload = {
    accessToken: "test-token",
    billState: {
      billType: "Factura C",
      products: [{ price: 100, amount: 1 }]
    }
  };

  it("should validate when a valid arca object is provided", () => {
    const payload = {
      ...validBasePayload,
      arca: {
        cuit: "20407713606",
        razonSocial: "Test Corp",
        condicionIva: "RESPONSABLE_INSCRIPTO",
        inicioActividades: "2023-01-01T00:00:00Z",
        puntoVenta: 1
      }
    };
    
    const result = CreateVoucherSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.arca).toBeDefined();
      expect(result.data.arca?.cuit).toBe("20407713606");
      expect(result.data.arca?.condicionIva).toBe("RESPONSABLE_INSCRIPTO");
      expect(result.data.arca?.puntoVenta).toBe(1);
    }
  });

  it("should default condicionIva to MONOTRIBUTO if arca object is present but condicionIva is missing", () => {
    const payload = {
      ...validBasePayload,
      arca: {
        cuit: "20407713606"
      }
    };
    
    const result = CreateVoucherSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.arca?.condicionIva).toBe("MONOTRIBUTO");
    }
  });

  it("should fail validation if condicionIva is invalid", () => {
    const payload = {
      ...validBasePayload,
      arca: {
        cuit: "20407713606",
        condicionIva: "INVALIDO"
      }
    };
    
    const result = CreateVoucherSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("should accept puntoVenta as a positive integer", () => {
    const payload = {
      ...validBasePayload,
      arca: {
        puntoVenta: 10
      }
    };
    
    const result = CreateVoucherSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should reject puntoVenta if it is a negative number, float, or string", () => {
    const payloads = [
      { ...validBasePayload, arca: { puntoVenta: -1 } },
      { ...validBasePayload, arca: { puntoVenta: 0 } },
      { ...validBasePayload, arca: { puntoVenta: 1.5 } },
      { ...validBasePayload, arca: { puntoVenta: "1" } },
    ];
    
    for (const payload of payloads) {
      const result = CreateVoucherSchema.safeParse(payload);
      expect(result.success).toBe(false);
    }
  });
});
