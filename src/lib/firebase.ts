import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

// Explicit Firebase configuration from firebase-applet-config.json
const firebaseConfig = {
  projectId: "gen-lang-client-0838799337",
  appId: "1:742863269589:web:f0d0b279e894af7db87c5c",
  apiKey: "AIzaSyCnarbvSpeSCgjp5dOeNCUwqWfVWe662lo",
  authDomain: "gen-lang-client-0838799337.firebaseapp.com",
  storageBucket: "gen-lang-client-0838799337.firebasestorage.app",
  messagingSenderId: "742863269589"
};

const databaseId = "ai-studio-b5d5e5b2-adad-465b-98b5-bcd232d18e4d";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the custom database ID
export const db = getFirestore(app, databaseId);

// Initialize Auth
export const auth = getAuth(app);

// Sign in anonymously for simple multiplayer presence and player binding
export async function initializeUserAuth() {
  try {
    const userCredential = await signInAnonymously(auth);
    console.log("Meguri anonymous authentication successful:", userCredential.user.uid);
    return userCredential.user.uid;
  } catch (error) {
    console.error("Firebase anonymous auth failed, creating mock playerId:", error);
    // Secure fallback local storage playerId so offline-first or dev plays never crash
    let localId = localStorage.getItem("meguri_local_player_id");
    if (!localId) {
      localId = "player_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("meguri_local_player_id", localId);
    }
    return localId;
  }
}

// Validate connection to Firestore as required by firebase-integration skill
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firestore database connection verified successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firebase client appears to be offline. Local cache will be used.");
    } else {
      console.log("Initial Firestore ping completed (documents may not exist yet, which is expected).");
    }
  }
}

testFirestoreConnection();

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
