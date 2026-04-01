import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

/**
 * Cloud Function HTTP handler for creating AFIP vouchers
 * Handles CORS and delegates to createVoucher business logic
 */
export const createAFIPVoucher = onRequest(async (request, response) => {
  const allowedOrigins = [
    "https://renata-three.vercel.app",
    "http://localhost:3000",
  ];
  const origin = request.headers.origin;

  console.log(request.body);
  if (origin && allowedOrigins.includes(origin)) {
    response.set("Access-Control-Allow-Origin", origin);
  } else {
    response.set(
      "Access-Control-Allow-Origin",
      "https://renata-three.vercel.app"
    );
  }
  response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    const {createVoucher} = await import("./functions/createVoucher.js");
    const result = await createVoucher(request.body);

    if (result.success) {
      response.status(200).send(result.data);
    } else {
      console.error("Validation error:", JSON.stringify(result.error, null, 2));
      const errorMsg = result.error?.message ||
        JSON.stringify(result.error) || "Error creando comprobante AFIP";
      response.status(400).send({error: errorMsg, details: result.error});
    }
  } catch (error) {
    logger.error("Internal Server Error detailed:", {
      message: (error as Error).message,
      stack: (error as Error).stack,
      error,
    });
    response.status(500).send({
      error: "Error creando comprobante AFIP",
      details: (error as Error).message,
    });
  }
});
