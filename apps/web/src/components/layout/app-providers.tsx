"use client";

import { Toaster } from "sonner";

import { AuthProvider } from "@/contexts/auth-context";

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider>
      {children}
      <Toaster closeButton richColors position="top-right" />
    </AuthProvider>
  );
}
