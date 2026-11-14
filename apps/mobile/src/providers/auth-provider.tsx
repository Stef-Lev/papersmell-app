import { router } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearStoredSession,
  readStoredSession,
  storeSession,
} from "../lib/auth-storage";
import { mobileApi, setUnauthorizedHandler } from "../lib/api";
import type { MobileSession } from "../lib/types";

type AuthContextValue = {
  session: MobileSession | null;
  isLoading: boolean;
  authError: string;
  signIn: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateUserName: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<MobileSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const expireSession = useCallback(async () => {
    await clearStoredSession();
    setSession(null);
    router.replace("/(auth)/login");
  }, []);

  useEffect(() => {
    let active = true;
    readStoredSession()
      .then(async (stored) => {
        if (!active) return;
        if (stored && stored.expiresAt > Date.now() && stored.token) {
          setSession(stored);
        } else if (stored) {
          await clearStoredSession();
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setAuthError(
            cause instanceof Error
              ? cause.message
              : "Could not read the saved sign-in.",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(expireSession);
    return () => setUnauthorizedHandler(undefined);
  }, [expireSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    const nextSession = await mobileApi.login(email, password);
    await storeSession(nextSession);
    setSession(nextSession);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await mobileApi.register(name, email, password);
      await signIn(email, password);
    },
    [signIn],
  );

  const signOut = useCallback(async () => {
    await clearStoredSession();
    setSession(null);
    router.replace("/(auth)/login");
  }, []);

  const updateUserName = useCallback(async (name: string) => {
    const stored = await readStoredSession();
    if (!stored) throw new Error("Your sign-in has expired. Please sign in again.");
    const updated = { ...stored, user: { ...stored.user, name } };
    await storeSession(updated);
    setSession(updated);
  }, []);

  const value = useMemo(
    () => ({
      session,
      isLoading,
      authError,
      signIn,
      register,
      updateUserName,
      signOut,
    }),
    [session, isLoading, authError, signIn, register, updateUserName, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
