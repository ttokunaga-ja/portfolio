import type { FirebaseApp } from "firebase/app";
import type { Auth, User } from "firebase/auth";

const firebaseAppName = "trial-auth";
const trialAuthApiOrigin = import.meta.env.VITE_TRIAL_AUTH_API_ORIGIN || "https://auth.api.takumi-tokunaga.com";

type FirebaseRuntime = { app: typeof import("firebase/app"); auth: typeof import("firebase/auth") };

let firebaseRuntime: FirebaseRuntime | null = null;
let firebaseRuntimePromise: Promise<FirebaseRuntime> | null = null;
let authInstance: Auth | null = null;
let persistencePromise: Promise<void> | null = null;

export type DailyCredits = { date: string; dailyLimit: number; usedCredits: number; remainingCredits: number };
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

function loadFirebaseRuntime(): Promise<FirebaseRuntime> {
  if (firebaseRuntime) return Promise.resolve(firebaseRuntime);

  firebaseRuntimePromise ??= Promise.all([import("firebase/app"), import("firebase/auth")]).then(([app, auth]) => {
    firebaseRuntime = { app, auth };
    return firebaseRuntime;
  });
  return firebaseRuntimePromise;
}

function getTrialFirebaseApp(runtime: FirebaseRuntime): FirebaseApp {
  const existing = runtime.app.getApps().find((app) => app.name === firebaseAppName);
  return existing ?? runtime.app.initializeApp(getFirebaseConfig(), firebaseAppName);
}

function getReadyRuntimeAndAuth(): { runtime: FirebaseRuntime; auth: Auth } {
  if (!isBrowser()) {
    throw new TrialAuthClientError("BROWSER_ONLY", "Google sign-in is available only in a browser.");
  }
  if (!firebaseRuntime || !authInstance) {
    throw new TrialAuthClientError("AUTH_NOT_READY", "Google sign-in is still preparing.");
  }
  return { runtime: firebaseRuntime, auth: authInstance };
}

export async function preloadTrialAuth(): Promise<void> {
  if (!isBrowser()) return;

  const runtime = await loadFirebaseRuntime();
  authInstance ??= runtime.auth.getAuth(getTrialFirebaseApp(runtime));
  persistencePromise ??= runtime.auth.setPersistence(authInstance, runtime.auth.browserSessionPersistence);
  await persistencePromise;
}

export function subscribeTrialAuthState(onChange: (user: User | null) => void) {
  if (!isBrowser()) return () => undefined;

  try {
    const { runtime, auth } = getReadyRuntimeAndAuth();
    return runtime.auth.onAuthStateChanged(auth, onChange);
  } catch {
    // Subscription is allowed only after preload resolves; fail closed otherwise.
    onChange(null);
    return () => undefined;
  }
}

type GoogleSignInOptions = { forceLogin?: boolean };

function createGoogleProvider(runtime: FirebaseRuntime, options: GoogleSignInOptions = {}) {
  const provider = new runtime.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: options.forceLogin ? "login" : "select_account" });
  return provider;
}

export function signInToTrialAuthWithGoogle(options: GoogleSignInOptions = {}): Promise<User> {
  // Contact-only preload makes this cached call synchronous in the click event,
  // preserving user activation without loading Firebase on other routes.
  const { runtime, auth } = getReadyRuntimeAndAuth();
  const provider = createGoogleProvider(runtime, options);
  return runtime.auth.signInWithPopup(auth, provider).then((credential) => credential.user);
}

export async function reauthenticateTrialAuthWithGoogle(user: User): Promise<User> {
  const { runtime } = getReadyRuntimeAndAuth();
  const provider = createGoogleProvider(runtime, { forceLogin: true });
  const credential = await runtime.auth.reauthenticateWithPopup(user, provider);
  return credential.user;
}

export async function signOutTrialAuth(): Promise<void> {
  const { runtime, auth } = getReadyRuntimeAndAuth();
  await runtime.auth.signOut(auth);
}

async function requestTrialAuth<T>(
  user: User,
  path: string,
  init: RequestInit = {},
  options: { forceRefreshToken?: boolean } = {}
): Promise<T> {
  const token = await user.getIdToken(options.forceRefreshToken);
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
  return requestTrialAuth<IssueAPIKeyResponse>(user, "/api/keys", { method: "POST" }, { forceRefreshToken: true });
}

export async function getTrialDailyCredits(user: User): Promise<DailyCredits> {
  return requestTrialAuth<DailyCredits>(user, "/api/credits/today");
}
