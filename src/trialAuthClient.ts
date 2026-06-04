import type { FirebaseApp } from "firebase/app";
import type { Auth, GoogleAuthProvider, User, UserCredential } from "firebase/auth";

const firebaseAppName = "trial-auth";
const trialAuthApiOrigin =
  import.meta.env.VITE_TRIAL_AUTH_API_ORIGIN || "https://trial-auth-api-k2i4vgakga-an.a.run.app";

let authInstance: Auth | null = null;
let persistencePromise: Promise<void> | null = null;
let authPreparationPromise: Promise<void> | null = null;
let GoogleAuthProviderCtor: (new () => GoogleAuthProvider) | null = null;
let signInWithPopupFn: ((auth: Auth, provider: GoogleAuthProvider) => Promise<UserCredential>) | null = null;

export type DailyCredits = {
  date: string;
  dailyLimit: number;
  usedCredits: number;
  remainingCredits: number;
};

export type IssueAPIKeyResponse = {
  hasKey: boolean;
  apiKey: string | null;
  keyPrefix: string;
  revoked: boolean;
  createdAt?: string;
  dailyCredits: DailyCredits;
};

export type APIKeyState = {
  hasKey: boolean;
  keyPrefix?: string;
  revoked: boolean;
  createdAt?: string;
  lastUsedAt?: string;
};

export class TrialAuthClientError extends Error {
  code: string;
  status?: number;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = "TrialAuthClientError";
    this.code = code;
    this.status = status;
  }
}

function isBrowser() {
  return typeof window !== "undefined";
}

function getFirebaseConfig() {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };

  if (Object.values(config).some((value) => !value)) {
    throw new TrialAuthClientError("CONFIG_MISSING", "Firebase web configuration is not set.");
  }

  return config as {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
}

async function getTrialFirebaseApp(): Promise<FirebaseApp> {
  const { getApps, initializeApp } = await import("firebase/app");
  const existing = getApps().find((app) => app.name === firebaseAppName);
  return existing ?? initializeApp(getFirebaseConfig(), firebaseAppName);
}

async function getTrialAuth(): Promise<Auth> {
  if (!isBrowser()) {
    throw new TrialAuthClientError("BROWSER_ONLY", "Google sign-in is available only in a browser.");
  }

  const { getAuth } = await import("firebase/auth");
  if (!authInstance) {
    authInstance = getAuth(await getTrialFirebaseApp());
  }

  return authInstance;
}

async function getReadyAuth(): Promise<Auth> {
  const auth = await getTrialAuth();
  const { browserLocalPersistence, setPersistence } = await import("firebase/auth");
  persistencePromise ??= setPersistence(auth, browserLocalPersistence);
  await persistencePromise;
  return auth;
}

export function preloadTrialAuth(): Promise<void> {
  if (!isBrowser()) {
    return Promise.resolve();
  }

  if (authPreparationPromise) {
    return authPreparationPromise;
  }

  authPreparationPromise = (async () => {
    const auth = await getReadyAuth();
    const authModule = await import("firebase/auth");
    GoogleAuthProviderCtor = authModule.GoogleAuthProvider;
    signInWithPopupFn = authModule.signInWithPopup;
    authInstance = auth;
  })();

  authPreparationPromise = authPreparationPromise.catch((error: unknown) => {
    authPreparationPromise = null;
    throw error;
  });

  return authPreparationPromise;
}

export function subscribeTrialAuthState(onChange: (user: User | null) => void) {
  if (!isBrowser()) {
    return () => undefined;
  }

  let active = true;
  let unsubscribe: () => void = () => undefined;

  void (async () => {
    const auth = await getTrialAuth();
    const { onAuthStateChanged } = await import("firebase/auth");
    if (active) {
      unsubscribe = onAuthStateChanged(auth, onChange);
    }
  })();

  return () => {
    active = false;
    unsubscribe();
  };
}

export async function signInToTrialAuthWithGoogle(): Promise<User> {
  await preloadTrialAuth();

  if (!authInstance || !GoogleAuthProviderCtor || !signInWithPopupFn) {
    throw new TrialAuthClientError("AUTH_NOT_READY", "Google sign-in is still loading.");
  }

  const provider = new GoogleAuthProviderCtor();
  provider.setCustomParameters({ prompt: "select_account" });

  const credential = await signInWithPopupFn(authInstance, provider);
  return credential.user;
}

async function requestTrialAuth<T>(user: User, path: string, init: RequestInit = {}): Promise<T> {
  const token = await user.getIdToken();
  const response = await fetch(`${trialAuthApiOrigin}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers
    }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const code = typeof payload?.code === "string" ? payload.code : `HTTP_${response.status}`;
    const message = typeof payload?.message === "string" ? payload.message : "trialAuth request failed.";
    throw new TrialAuthClientError(code, message, response.status);
  }

  return response.json() as Promise<T>;
}

export async function getTrialAPIKeyState(user: User): Promise<APIKeyState> {
  return requestTrialAuth<APIKeyState>(user, "/api/keys/me");
}

export async function issueTrialAPIKey(user: User): Promise<IssueAPIKeyResponse> {
  return requestTrialAuth<IssueAPIKeyResponse>(user, "/api/keys", { method: "POST" });
}

export async function getTrialDailyCredits(user: User): Promise<DailyCredits> {
  return requestTrialAuth<DailyCredits>(user, "/api/credits/today");
}
