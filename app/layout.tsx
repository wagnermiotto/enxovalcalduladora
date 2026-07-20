import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

// next/font baixa e serve as fontes localmente — sem requisição ao Google em
// tempo de execução, ao contrário do <link> de CDN do sistema PHP.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Enxovais & Cortinas",
    template: "%s — Enxovais & Cortinas",
  },
  description: "Sistema de gestão — cálculo de cortinas e orçamentos.",
  // Painel interno: nenhuma página deve entrar em buscador.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
