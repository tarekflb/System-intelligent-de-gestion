"use client";

import { HTMLAttributes } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/button";
import { logout } from "@/lib/auth";
import { BookOpen, FileText, Home, User, Users, X, LogOut } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

interface SidebarProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { setAuthentifie } = useContext(AuthContext);

  const pathname = usePathname();
  const router = useRouter();

  const routes = [
    { href: "/ecole_peg/tableau_bord/", icon: Home, title: "Tableau de bord" },
    { href: "/ecole_peg/eleves/", icon: Users, title: "Eleves" },
    { href: "/ecole_peg/enseignants/", icon: Users, title: "Enseignants" },
    { href: "/ecole_peg/cours/", icon: BookOpen, title: "Cours" },
    { href: "/ecole_peg/sessions/", icon: BookOpen, title: "Sessions" },
    { href: "/ecole_peg/factures/", icon: FileText, title: "Factures" },
    { href: "/ecole_peg/cours_prives/", icon: User, title: "Cours privés" },
    { href: "/ecole_peg/paiements/", icon: FileText, title: "paiements" },
  ];

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur",
          isOpen ? "block" : "hidden",
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-1/4 lg:w-1/5 border-r bg-background transition duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center h-16 px-2">
            <Image
              src="/logo/ecole_peg.png"
              alt="École PEG"
              width={100}
              height={25}
              className="object-contain"
            />
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-col gap-1 p-4">
          {routes.map((route) => (
            <Button
              key={route.href}
              variant={
                (pathname ?? "").startsWith(route.href) ? "secondary" : "ghost"
              }
              className="justify-start"
              asChild
            >
              <Link href={route.href}>
                <route.icon className="mr-2 h-5 w-5" />
                {route.title}
              </Link>
            </Button>
          ))}
        </div>

        <div className="mt-auto border-t p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Admin</p>
              <p className="text-xs text-muted-foreground">
                admin@ecole-peg.ch
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                await logout();

                setAuthentifie(false);

                router.push("/ecole_peg/login/");
              }}
              className="ml-auto hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
