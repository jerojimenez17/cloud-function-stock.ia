import {ApiResponse} from "../types/arca.js";
import {
  createVoucherWithAfip,
  getLastVoucherNumber,
  AFIPApiError,
} from "../services/afip.js";
import {z} from "zod";


export const CreateVoucherSchema = z.object({
  action: z.enum(["createVoucher"]).optional(),
  accessToken: z.string().optional(),
  encryptedCert: z.string().optional(),
  encryptedKey: z.string().optional(),
  arca: z.object({
    cuit: z.string().nullable().optional(),
    razonSocial: z.string().nullable().optional(),
    inicioActividades: z.union([z.string().datetime(), z.string()]).nullable().optional(),
    condicionIva: z.enum(["RESPONSABLE_INSCRIPTO", "MONOTRIBUTO"]).nullable().optional().default("MONOTRIBUTO"),
    address: z.string().nullable().optional(),
    cert: z.string().nullable().optional(),
    key: z.string().nullable().optional(),
    puntoVenta: z.number().int().positive().optional(),
  }).optional(),
  billState: z.object({
    billType: z.string(),
    typeDocument: z.string().default(""),
    documentNumber: z.union([z.number(), z.string()]).default(0),
    IVACondition: z.string().default("Consumidor Final"),
    products: z.array(z.object({
      price: z.number().nonnegative(),
      amount: z.number().positive(),
    })).min(1, "At least one product is required"),
    discount: z.number().nonnegative().default(0),
    nroAsociado: z.union([z.number(), z.string()]).default(0),
  }),
}).refine(
  (data) => {
    const hasAccessToken = !!data.accessToken;
    const hasCertKey = !!data.encryptedCert && !!data.encryptedKey;
    return hasAccessToken || hasCertKey;
  },
  {message: "Either accessToken or both encryptedCert and encryptedKey are required"}
);

export async function createVoucher(data: unknown): Promise<ApiResponse> {
  const result = CreateVoucherSchema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.errors.map((e) => e.message).join(", "),
      },
    };
  }

  const {encryptedCert, encryptedKey, billState, arca} = result.data;
  const access_token=process.env.AFIP_ACCESS_TOKEN;
  const credentials = {
    accessToken: access_token,
    encryptedCert,
    encryptedKey,
    CUIT: arca?.cuit || "20407713606",
  };
  const puntoVenta = arca?.puntoVenta || 1;

  try {
    let tipoFactura = 11;
    const isNotaCredito = !!billState.nroAsociado;

    const billTypeStr = String(billState.billType || "").toLowerCase();
    if (billTypeStr.includes("factura a")) {
      tipoFactura = isNotaCredito ? 3 : 1;
    } else if (billTypeStr.includes("factura b")) {
      tipoFactura = isNotaCredito ? 8 : 6;
    } else {
      tipoFactura = isNotaCredito ? 13 : 11;
    }

    const lastVoucher = await getLastVoucherNumber(
      credentials,
      puntoVenta,
      tipoFactura
    );
    const numeroFactura = lastVoucher + 1;

    const totalBruto = billState.products.reduce(
      (acc, p) => acc + p.price * p.amount,
      0
    );
    const importeTotal = Number(
      (totalBruto - totalBruto * ((billState.discount || 0) * 0.01)).
        toFixed(2)
    );

    let impNeto = importeTotal;
    let impIVA = 0;
    let ivaArray: Array<{Id: number; BaseImp: number; Importe: number}> |
        undefined;

    if (tipoFactura === 1 || tipoFactura === 6) {
      const base = importeTotal / 1.21;
      impNeto = Number(base.toFixed(2));
      impIVA = Number((importeTotal - impNeto).toFixed(2));
      ivaArray = [
        {
          Id: 5,
          BaseImp: impNeto,
          Importe: impIVA,
        },
      ];
    }

    const tipoDeDocumento =
      (billState.typeDocument === "CUIT" ||
        billState.typeDocument === "DNI") &&
      Number(billState.documentNumber) > 0 ?
        billState.typeDocument === "DNI" ? 96 : 80 : 99;

    const numeroDeDocumento =
      billState.IVACondition === "Consumidor Final" &&
      Number(billState.documentNumber) === 0 ?
        0 : Number(billState.documentNumber);

    const fecha = new Date(
      Date.now() - new Date().getTimezoneOffset() * 60000
    ).toISOString().split("T")[0];
    const cbteFechaFormatted = parseInt(fecha.replace(/-/g, ""), 10);

    let cbtesAsoc: Array<{Tipo: number; PtoVta: number; Nro: number}> |
        undefined;
    if (isNotaCredito) {
      cbtesAsoc = [
        {
          Tipo: tipoFactura === 3 ? 1 : tipoFactura === 8 ? 6 : 11,
          PtoVta: puntoVenta,
          Nro: Number(billState.nroAsociado),
        },
      ];
    }

    const voucherResult = await createVoucherWithAfip(
      credentials,
      {
        puntoVenta,
        tipoFactura,
        docTipo: tipoDeDocumento,
        docNro: numeroDeDocumento,
        cbteDesde: numeroFactura,
        cbteHasta: numeroFactura,
        cbteFch: cbteFechaFormatted,
        impTotal: importeTotal,
        impNeto: impNeto,
        impIVA: impIVA,
        ivaArray,
        cbtesAsoc,
      }
    );

    return {
      success: true,
      data: voucherResult,
      message: "Voucher created successfully",
    };
  } catch (error) {
    if (error instanceof AFIPApiError) {
      return {
        success: false,
        error: {
          code: "AFIP_API_ERROR",
          message: error.message,
        },
      };
    }

    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    };
  }
}
