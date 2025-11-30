import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Buscador Semántico de Series TV",
  description: "Motor de búsqueda semántica inteligente para descubrir series de televisión basado en significado y contexto",
};

export async function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }];
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <html lang={lang}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
