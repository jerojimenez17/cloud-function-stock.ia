import Afip from "@afipsdk/afip.js";
import {validateArcaTestCertsRequest} from "../utils/validation.js";

/**
 * Cloud Function to automate getting development certificates from AFIP.
 * @param requestBody The request body containing parameters for CreateAutomation
 * @return Response object containing success status, data, and possible errors
 */
export async function getArcaTestCerts(requestBody: unknown) {
  // 1. Validate the input
  const validationResult = validateArcaTestCertsRequest(requestBody);
  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error,
    };
  }

  const data = validationResult.data;
  if (!data) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input data",
      },
    };
  }

  try {
    // 2. Initialize Afip SDK
    // According to docs, we can pass access_token
    // Use the provided access_token or fallback to an env var or a known token
    const token = data.accessToken || process.env.AFIP_SDK_ACCESS_TOKEN || "TU_ACCESS_TOKEN";

    // Disable ESLint warnings for afipsdk since it expects any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const afip = new (Afip as any)({access_token: token});

    // 3. Prepare parameters for automation
    const automationData = {
      cuit: data.cuit,
      username: data.username,
      password: data.password,
      alias: data.alias,
    };

    // 4. Execute the automation
    // eslint-disable-next-line new-cap
    const response = await afip.CreateAutomation("create-cert-dev", automationData, true);

    // 5. Return success with the cert and key
    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error("Error generating test certs:", error);

    return {
      success: false,
      error: {
        code: "AFIP_API_ERROR",
        message: error instanceof Error ? error.message : "Unknown error in Afip SDK automation",
      },
    };
  }
}
