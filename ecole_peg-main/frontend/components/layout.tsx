"use client";

import { ReactNode, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/button";
import { Menu } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

export function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background px-2 lg:px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
        </div>
      </header>

      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-2 lg:p-4">{children}</main>
      </div>
    </div>
  );
}
