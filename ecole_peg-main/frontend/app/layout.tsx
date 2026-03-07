import { ReactNode } from "react";
import { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProviderWrapper } from "./providers/AuthProviderWrapper";
import { Guard } from "./providers/Guard";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "École PEG - Système de Gestion",
  description: "Système de gestion administrative pour l'École PEG",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <AuthProviderWrapper>
            <Guard>{children}</Guard>
          </AuthProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
