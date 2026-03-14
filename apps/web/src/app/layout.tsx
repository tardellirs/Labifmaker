import type { Metadata } from "next";

import { AppProviders } from "@/components/layout/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "LabIF Maker Jacarei",
  description: "Sistema web de agendamento e gestao do laboratorio de fabricacao digital do IFSP."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
