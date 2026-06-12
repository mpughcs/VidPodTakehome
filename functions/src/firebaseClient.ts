import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { initializeApp, getApps } from "firebase/app";
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  type GenerativeModel,
} from "firebase/ai";

loadEnv({ path: resolve(__dirname, "../.env.local") });
loadEnv({ path: resolve(__dirname, "../../.env.local") });

function getFirebaseClientConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId =
    process.env.GCLOUD_PROJECT ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey) throw new Error("Missing NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!appId) throw new Error("Missing NEXT_PUBLIC_FIREBASE_APP_ID");
  if (!projectId) throw new Error("Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID");

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}

export function getClientFirebaseApp() {
  return getApps().length > 0
    ? getApps()[0]
    : initializeApp(getFirebaseClientConfig());
}

let pressSearchModel: GenerativeModel | null = null;

/** Lazy-init so the emulator can start before AI is called. */
export function getPressSearchModel(): GenerativeModel {
  if (!pressSearchModel) {
    const ai = getAI(getClientFirebaseApp(), { backend: new GoogleAIBackend() });
    pressSearchModel = getGenerativeModel(ai, {
      model: "gemini-2.5-flash",
      tools: [{ googleSearch: {} }],
    });
  }
  return pressSearchModel;
}
