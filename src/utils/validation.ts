import {z} from "zod";
import {FunctionRequest} from "../types/arca.js";

export const ProductSchema = z.object({
  price: z.number().nonnegative(),
  amount: z.number().positive(),
});

export const ArcaTestCertsRequestSchema = z.object({
  cuit: z.string().min(1, "CUIT is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  alias: z.string().min(1, "Alias is required"),
  accessToken: z.string().optional(),
});


export const BillStateSchema = z.object({
  billType: z.string(),
  typeDocument: z.string().default(""),
  documentNumber: z.union([z.number(), z.string()]).default(0),
  IVACondition: z.string().default("Consumidor Final"),
  products: z.array(ProductSchema).min(1, "At least one product is required"),
  discount: z.number().nonnegative().default(0),
  nroAsociado: z.union([z.number(), z.string()]).default(0),
});

export const FunctionRequestSchema = z.object({
  action: z.enum(["generateTA", "createVoucher"]).
    optional().
    default("createVoucher"),
  accessToken: z.string().optional(),
  encryptedCert: z.string().optional(),
  encryptedKey: z.string().optional(),
  billState: BillStateSchema.optional(),
}).refine(
  (data) => {
    const hasAccessToken = !!data.accessToken;
    const hasCertKey = !!data.encryptedCert && !!data.encryptedKey;
    return hasAccessToken || hasCertKey;
  },
  {message: "Either accessToken or both encryptedCert and encryptedKey are required"}
).refine(
  (data) => data.action !== "createVoucher" ||
    data.action === undefined ||
    data.billState !== undefined,
  {message: "billState is required when action is createVoucher"}
);

/**
 * Validates a function request against the FunctionRequestSchema
 * @param data - The request data to validate
 * @return Validation result with success status and parsed data or error
 */
export function validateRequest(data: unknown):
    { success: boolean; data?: FunctionRequest;
      error?: { code: string; message: string } } {
  const result = FunctionRequestSchema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.errors.map((e) => e.message).join(", "),
      },
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

export function validateArcaTestCertsRequest(data: unknown):
    { success: boolean; data?: z.infer<typeof ArcaTestCertsRequestSchema>;
      error?: { code: string; message: string } } {
  const result = ArcaTestCertsRequestSchema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.errors.map((e) => e.message).join(", "),
      },
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
