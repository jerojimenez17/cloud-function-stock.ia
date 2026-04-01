import {TAToken} from "../types/arca.js";

let db: unknown = null;
let initializing = false;

/**
 * Initializes Firebase app and Firestore client
 */
async function initializeFirebase(): Promise<unknown> {
  if (db) return db;
  if (initializing) return null;

  initializing = true;
  try {
    const {initializeApp, getApps} = await import("firebase-admin/app");
    const {getFirestore} = await import("firebase-admin/firestore");

    if (getApps().length === 0) {
      initializeApp();
    }
    db = getFirestore();
    return db;
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
    return null;
  } finally {
    initializing = false;
  }
}

/**
 * Gets the Firestore database instance
 * @return The Firestore instance or null
 */
async function getDb(): Promise<unknown> {
  const db = await initializeFirebase();
  return db;
}

const TA_TOKENS_COLLECTION = "ta_tokens";

/**
 * Saves a TA token to Firestore for the given CUIT
 * @param cuit - The CUIT to associate with the token
 * @param token - The token data to save
 */
export async function saveTAToken(
  cuit: string,
  token: Omit<TAToken, "generationTime" | "expirationTime"> & {
      generationTime: Date;
      expirationTime: Date
    }
): Promise<void> {
  const firestore = await getDb() as {
    collection: (name: string) => {
      doc: (id: string) => {
        set: (data: Record<string, unknown>) => Promise<{writeTime?: Date}>;
      };
    };
  } | null;
  if (!firestore) return;

  const docRef = firestore.collection(TA_TOKENS_COLLECTION).doc(cuit);

  const {Timestamp} = await import("firebase-admin/firestore");

  await docRef.set({
    token: token.token,
    sign: token.sign,
    generationTime: Timestamp.fromDate(token.generationTime),
    expirationTime: Timestamp.fromDate(token.expirationTime),
    source: token.source,
    destination: token.destination,
  });
}

/**
 * Retrieves a TA token from Firestore for the given CUIT
 * @param cuit - The CUIT to look up
 * @return The token data or null if not found
 */
export async function getTAToken(cuit: string): Promise<TAToken | null> {
  const firestore = await getDb() as {
    collection: (name: string) => {
      doc: (id: string) => {
        get: () => Promise<{
          exists: boolean;
          data: () => Record<string, unknown> | undefined;
        }>;
      };
    };
  } | null;
  if (!firestore) return null;

  const docRef = firestore.collection(TA_TOKENS_COLLECTION).doc(cuit);
  const doc = await docRef.get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data() as Record<string, unknown>;
  return {
    token: data.token as string,
    sign: data.sign as string,
    generationTime: data.generationTime as TAToken["generationTime"],
    expirationTime: data.expirationTime as TAToken["expirationTime"],
    source: data.source as string,
    destination: data.destination as string,
  };
}

/**
 * Checks if a TA token is expired or about to expire
 * @param token - The token to check
 * @return True if the token is expired or will expire within 1 hour
 */
export function isTATokenExpired(token: TAToken): boolean {
  const now = Date.now();
  const expirationTime = token.expirationTime.toDate().getTime();
  const oneHour = 60 * 60 * 1000;

  return expirationTime - now <= oneHour;
}
