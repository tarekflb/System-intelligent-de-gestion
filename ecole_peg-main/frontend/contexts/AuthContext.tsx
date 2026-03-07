import { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { est_authentifie, refreshToken } from "@/lib/auth";

interface TypeAuthContext {
  authentifie: boolean;
  setAuthentifie: (value: boolean) => void;
}

export const AuthContext = createContext<TypeAuthContext>({
  authentifie: false,
  setAuthentifie: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authentifie, setAuthentifie] = useState<boolean>(false);
  const [chargement, setChargement] = useState<boolean>(true);

  const refreshAuth = useCallback(async () => {
    if (authentifie) {
      const succes = await refreshToken();

      if (!succes) {
        setAuthentifie(false);
      }
    }
  }, [authentifie]);

  useEffect(() => {
    const interval = setInterval(refreshAuth, 14 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshAuth]);

  useEffect(() => {
    est_authentifie()
      .then((ok) => setAuthentifie(ok))
      .finally(() => setChargement(false));
  }, []);

  if (chargement) return null;

  return (
    <AuthContext.Provider value={{ authentifie, setAuthentifie }}>
      {children}
    </AuthContext.Provider>
  );
}
