import * as SecureStore from "expo-secure-store";
import type { MobileSession } from "./types";

const SESSION_KEY = "papersmell.mobile.session";

function isMobileSession(value: unknown): value is MobileSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Record<string, unknown>;
  const user = session.user;
  return (
    typeof session.token === "string" &&
    typeof session.expiresAt === "number" &&
    Number.isFinite(session.expiresAt) &&
    !!user &&
    typeof user === "object" &&
    "name" in user &&
    typeof user.name === "string" &&
    "email" in user &&
    typeof user.email === "string"
  );
}

export async function readStoredSession() {
  const value = await SecureStore.getItemAsync(SESSION_KEY);
  if (!value) return null;
  const parsed: unknown = JSON.parse(value);
  if (!isMobileSession(parsed)) {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    return null;
  }
  return parsed;
}

export function storeSession(session: MobileSession) {
  return SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  return SecureStore.deleteItemAsync(SESSION_KEY);
}
