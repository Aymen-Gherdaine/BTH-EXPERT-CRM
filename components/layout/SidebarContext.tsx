"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type Ctx = { isOpen: boolean; setIsOpen: (v: boolean) => void };

const SidebarContext = createContext<Ctx>({ isOpen: false, setIsOpen: () => {} });

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return <SidebarContext.Provider value={{ isOpen, setIsOpen }}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  return useContext(SidebarContext);
}
