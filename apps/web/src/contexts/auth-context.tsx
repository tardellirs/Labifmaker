"use client";

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import {
  onIdTokenChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { getFirebaseAuth, getGoogleAuthProvider } from "@/lib/firebase/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signingIn: boolean;
  error: string | null;
  signInWithGoogle: (institutional?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function syncSession(idToken?: string) {
  const response = await fetch(idToken ? "/api/auth/session" : "/api/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: idToken ? JSON.stringify({ idToken }) : undefined
  });

  let data: { error?: string } = {};
  try {
    data = (await response.json()) as { error?: string };
  } catch {
    data = {};
  }

  return { ok: response.ok, error: data.error };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousUserRef = useRef<User | null | undefined>(undefined);

  useEffect(() => {
    let auth;

    try {
      auth = getFirebaseAuth();
    } catch (firebaseError) {
      console.error(firebaseError);
      setError("O sistema de autenticação não está disponível no momento. Entre em contato com a coordenação.");
      setLoading(false);
      return;
    }

    const unsubscribe = onIdTokenChanged(auth, async (nextUser) => {
      try {
        const isNewSignIn = previousUserRef.current === null && nextUser !== null;
        previousUserRef.current = nextUser;
        setUser(nextUser);

        if (nextUser) {
          if (isNewSignIn) setSigningIn(true);

          const idToken = await nextUser.getIdToken();
          const result = await syncSession(idToken);

          if (!result.ok) {
            await firebaseSignOut(auth);
            await syncSession();
            setUser(null);
            previousUserRef.current = null;
            setSigningIn(false);
            setError(
              result.error ??
                "Acesso permitido para @ifsp.edu.br ou e-mails autorizados como coordenação."
            );
            toast.error(
              result.error ??
                "A conta selecionada não está autorizada para acessar o portal."
            );
            return;
          }

          setError(null);
          if (isNewSignIn) {
            router.push("/app");
          }
          return;
        }

        void syncSession();
        setSigningIn(false);
        setError(null);
      } catch (sessionError) {
        console.error(sessionError);
        setSigningIn(false);
        setError("Não foi possível sincronizar a sessão.");
        toast.error("Falha ao sincronizar a sessão com o servidor.");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [router]);

  const value: AuthContextValue = {
    user,
    loading,
    signingIn,
    error,
    signInWithGoogle: async (institutional = true) => {
      setLoading(true);
      setError(null);
      router.prefetch("/app");

      try {
        const auth = getFirebaseAuth();
        const provider = getGoogleAuthProvider(institutional);
        await signInWithPopup(auth, provider);
        // don't setLoading(false) here — onIdTokenChanged will fire next
        // and we want the spinner to stay visible throughout the whole flow
      } catch (signInError) {
        const code = (signInError as { code?: string }).code;
        if (code === "auth/cancelled-popup-request" || code === "auth/popup-closed-by-user") {
          setLoading(false);
          return;
        }
        console.error(signInError);
        setError("Não foi possível realizar o login com Google.");
        toast.error("Falha no login Google. Tente novamente.");
        setLoading(false);
      }
    },
    signOut: async () => {
      setLoading(true);

      try {
        const auth = getFirebaseAuth();
        await firebaseSignOut(auth);
        void syncSession();
        toast.success("Sessão encerrada.");
        startTransition(() => {
          router.push("/");
          router.refresh();
        });
      } catch (signOutError) {
        console.error(signOutError);
        setError("Não foi possível encerrar a sessão.");
        toast.error("Falha ao sair.");
      } finally {
        setLoading(false);
      }
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AppProviders.");
  }

  return context;
}
