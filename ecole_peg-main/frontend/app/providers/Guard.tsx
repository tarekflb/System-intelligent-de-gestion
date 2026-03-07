"use client";

import { ReactNode, useContext, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthContext } from "@/contexts/AuthContext";

export function Guard({ children }: { children: ReactNode }) {
  const { authentifie } = useContext(AuthContext);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authentifie && pathname !== "/ecole_peg/login/") {
      router.push("/ecole_peg/login/");
    }
  }, [authentifie, pathname, router]);

  return <>{children}</>;
}
