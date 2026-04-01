import {Timestamp} from "firebase-admin/firestore";

export interface TAToken {
  token: string;
  sign: string;
  generationTime: Timestamp;
  expirationTime: Timestamp;
  source: string;
  destination: string;
}

export interface Product {
  price: number;
  amount: number;
}

export interface BillState {
  billType: string;
  typeDocument: string;
  documentNumber: number | string;
  IVACondition: string;
  products: Product[];
  discount: number;
  nroAsociado?: number | string;
}

export interface FunctionRequest {
  action: "generateTA" | "createVoucher";
  accessToken?: string;
  encryptedCert?: string;
  encryptedKey?: string;
  billState?: BillState;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}
