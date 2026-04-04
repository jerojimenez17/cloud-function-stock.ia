import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

/**
 * Cloud Function HTTP handler for creating AFIP vouchers
 * Handles CORS and delegates to createVoucher business logic
 */
export const createAFIPVoucher = onRequest(async (request, response) => {
  const allowedOrigins = [
    "https://prueba-demo-app.vercel.app",
    "http://localhost:3000",
  ];
  const origin = request.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    response.set("Access-Control-Allow-Origin", origin);
  } else {
    response.set(
      "Access-Control-Allow-Origin",
    "https://prueba-demo-app.vercel.app",
    );
  }
  response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-internal-key");

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  // Authentication check
  const internalKey = request.headers["x-internal-key"];
  const expectedKey = process.env.INTERNAL_AFIP_API_KEY;

  if (!internalKey || internalKey !== expectedKey) {
    logger.warn("Unauthorized request attempt", {
      ip: request.ip,
      userAgent: request.headers["user-agent"],
    });
    response.status(401).send({
      error: "No autorizado",
      details: "Clave interna inválida o ausente",
    });
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
