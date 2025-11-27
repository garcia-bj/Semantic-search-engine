import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Buscador Semántico de Series TV",
  description: "Motor de búsqueda semántica inteligente para descubrir series de televisión basado en significado y contexto",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
