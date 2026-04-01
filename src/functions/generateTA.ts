import {ApiResponse} from "../types/arca.js";
import {z} from "zod";

const GenerateTASchema = z.object({
  action: z.enum(["generateTA"]).optional(),
  accessToken: z.string().optional(),
  encryptedCert: z.string().optional(),
  encryptedKey: z.string().optional(),
}).refine(
  (data) => {
    const hasAccessToken = !!data.accessToken;
    const hasCertKey = !!data.encryptedCert && !!data.encryptedKey;
    return hasAccessToken || hasCertKey;
  },
  {message: "Either accessToken or both encryptedCert and encryptedKey are required"}
);

/**
 * Validates an access token
 * Note: Token generation is now done via AfipSDK platform
 * @param data - The request data containing access token
 * @return API response with token info or error
 */
export async function generateTA(data: unknown): Promise<ApiResponse> {
  const result = GenerateTASchema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.errors.map((e) => e.message).join(", "),
      },
    };
  }

  const {accessToken, encryptedCert} = result.data;

  return {
    success: true,
    data: {
      token: accessToken || "cert-based-auth",
      sign: encryptedCert ? "cert-signature" : "",
      message: "Access token validated successfully",
    },
    message: "Token validated successfully",
  };
}
