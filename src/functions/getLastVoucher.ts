import {ApiResponse} from "../types/arca.js";
import {getLastVoucherNumber, AFIPApiError} from "../services/afip.js";
import {z} from "zod";

export const GetLastVoucherSchema = z.object({
  action: z.enum(["getLastVoucher"]).optional(),
  accessToken: z.string().optional(),
  encryptedCert: z.string().optional(),
  encryptedKey: z.string().optional(),
  arca: z.object({
    cuit: z.string().nullable().optional(),
  }).optional(),
  puntoVenta: z.number().int().positive(),
  tipoFactura: z.number().int().positive(),
}).refine(
  (data) => {
    const hasAccessToken = !!data.accessToken;
    const hasCertKey = !!data.encryptedCert && !!data.encryptedKey;
    return hasAccessToken || hasCertKey;
  },
  {message: "Either accessToken or both encryptedCert and encryptedKey are required"}
);

export async function getLastVoucher(data: unknown): Promise<ApiResponse> {
  const result = GetLastVoucherSchema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.errors.map((e) => e.message).join(", "),
      },
    };
  }

  const {encryptedCert, encryptedKey, arca, puntoVenta, tipoFactura} = result.data;
  const access_token = process.env.AFIP_ACCESS_TOKEN;

  const credentials = {
    cuit: arca?.cuit || "",
    cert: encryptedCert,
    key: encryptedKey,
    access_token,
  };

  try {
    const lastVoucher = await getLastVoucherNumber(
      credentials,
      puntoVenta,
      tipoFactura
    );

    return {
      success: true,
      data: {
        lastVoucher,
      },
    };
  } catch (error: any) {
    console.error("Error obtaining last voucher:", error);
    
    if (error instanceof AFIPApiError) {
      return {
        success: false,
        error: {
          code: "AFIP_API_ERROR",
          message: error.message,
          details: error.details,
        },
      };
    }

    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Ocurrió un error inesperado al obtener el último comprobante",
      },
    };
  }
}
