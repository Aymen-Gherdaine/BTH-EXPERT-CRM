"use client";

import { SWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";
import type { ReactNode } from "react";

export default function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        keepPreviousData: true,
        revalidateOnFocus: false,
        dedupingInterval: 30000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
