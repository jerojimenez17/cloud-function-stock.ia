import Afip from "@afipsdk/afip.js";
import {TAToken} from "../types/arca.js";
import {AFIPApiError} from "./errors.js";

export {AFIPApiError};

const isTestMode = process.env.NODE_ENV === "test" ||
  process.env.VITEST === "true" ||
  (typeof globalThis !== "undefined" &&
    (globalThis as {vitest?: unknown}).vitest !== undefined);

interface AfipCredentials {
  accessToken?: string;
  encryptedCert?: string;
  encryptedKey?: string;
  CUIT: string;
}

function createAfipInstance(credentials: AfipCredentials): Afip {
  if (credentials.accessToken) {
    return new Afip({
      access_token: credentials.accessToken,
      CUIT: Number(credentials.CUIT),
    } as any);
  }

  if (credentials.encryptedCert && credentials.encryptedKey) {
    return new Afip({
      cert: credentials.encryptedCert,
      key: credentials.encryptedKey,
      CUIT: Number(credentials.CUIT),
    } as any);
  }

  throw new Error("Missing authentication credentials");
}

export async function createVoucherWithAfip(
  credentials: AfipCredentials,
  voucherData: {
      puntoVenta: number;
      tipoFactura: number;
      docTipo: number;
      docNro: number;
      cbteDesde: number;
      cbteHasta: number;
      cbteFch: number;
      impTotal: number;
      impNeto: number;
      impIVA: number;
      ivaArray?: Array<{Id: number; BaseImp: number; Importe: number}>;
      cbtesAsoc?: Array<{Tipo: number; PtoVta: number; Nro: number}>;
    }
): Promise<{
  CAE: string;
  CAEFchVto: string;
  ptoVenta: number;
  nroCbte: number;
  qrData: string;
}> {
  if (isTestMode) {
    console.log("En test mode - creating mock voucher");
    return {
      CAE: "123456789012",
      CAEFchVto: "20260330",
      ptoVenta: voucherData.puntoVenta,
      nroCbte: voucherData.cbteDesde,
      qrData: "mocked-qr-data",
    };
  }

  try {
    const afip = createAfipInstance(credentials);
    const data: Record<string, unknown> = {
      CantReg: 1,
      PtoVta: voucherData.puntoVenta,
      CbteTipo: voucherData.tipoFactura,
      Concepto: 1,
      DocTipo: voucherData.docTipo,
      DocNro: voucherData.docNro,
      CbteDesde: voucherData.cbteDesde,
      CbteHasta: voucherData.cbteHasta,
      CbteFch: voucherData.cbteFch,
      ImpTotal: voucherData.impTotal,
      ImpTotConc: 0,
      ImpNeto: voucherData.impNeto,
      ImpOpEx: 0,
      ImpIVA: voucherData.impIVA,
      ImpTrib: 0,
      MonId: "PES",
      MonCotiz: 1,
    };

    if (voucherData.ivaArray) {
      data.Iva = voucherData.ivaArray;
    }

    if (voucherData.cbtesAsoc) {
      data.CbtesAsoc = voucherData.cbtesAsoc;
    }

    const result = await afip.ElectronicBilling.createVoucher(data);
    const qrDataObj = {
      ver: 1,
      fecha: voucherData.cbteFch,
      cuit: Number(credentials.CUIT),
      ptoVta: voucherData.puntoVenta,
      tipoCmp: voucherData.tipoFactura,
      nroCmp: voucherData.cbteDesde,
      importe: voucherData.impTotal,
      moneda: "PES",
      ctz: 1,
      tipoDocRec: voucherData.docTipo,
      nroDocRec: voucherData.docNro,
      tipoCodAut: "E",
      codAut: result.CAE,
    };

    const qrData = "https://www.afip.gob.ar/fe/qr/?p=" +
      Buffer.from(JSON.stringify(qrDataObj)).toString("base64");

    return {
      CAE: result.CAE,
      CAEFchVto: result.CAEFchVto,
      ptoVenta: voucherData.puntoVenta,
      nroCbte: voucherData.cbteDesde,
      qrData: qrData,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new AFIPApiError(`AFIP API error: ${error.message}`);
    }
    throw new AFIPApiError("Unknown AFIP error");
  }
}

export async function getLastVoucherNumber(
  credentials: AfipCredentials,
  puntoVenta: number,
  tipoFactura: number
): Promise<number> {
  if (isTestMode) {
    return 0;
  }

  try {
    const afip = createAfipInstance(credentials);
    return await afip.ElectronicBilling.getLastVoucher(puntoVenta, tipoFactura);
  } catch (error) {
    if (error instanceof Error) {
      throw new AFIPApiError(`AFIP API error: ${error.message}`);
    }
    throw new AFIPApiError("Unknown AFIP error");
  }
}

export interface TAData {
  token: string;
  sign: string;
  expirationTime: Date;
}

export async function getTAFromAccessToken(
  accessToken: string
): Promise<TAToken> {
  return {
    token: accessToken,
    sign: "",
    generationTime: {toDate: () => new Date()} as TAToken["generationTime"],
    expirationTime: {
      toDate: () => new Date(Date.now() + 12 * 60 * 60 * 1000),
    } as TAToken["expirationTime"],
    source: "afipsdk",
    destination: "afip",
  };
}
