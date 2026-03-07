import { api } from "@/lib/api";

export async function login(mot_de_passe: string) {
  try {
    await api.post(
      "/auth/login/",
      { mot_de_passe },
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch {
    throw new Error("La connexion a échoué");
  }
}

export async function logout() {
  await api.post("/auth/logout/");
}

export async function est_authentifie() {
  try {
    await api.get("/auth/est_authentifie/");

    return true;
  } catch {
    return false;
  }
}

export async function refreshToken() {
  try {
    await api.post("/auth/refresh/");
    
    return true;
  } catch {
    return false;
  }
}
