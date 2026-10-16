import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "7Clinic | Clínica Movimentar-se",
  description: "MVP operacional demonstrativo com dados sintéticos"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}