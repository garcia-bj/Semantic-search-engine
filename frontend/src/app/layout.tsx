import type { Metadata, Viewport } from "next";
import "./globals.css";
import OfflineBanner from "@/components/OfflineBanner";
import InstallPrompt from "@/components/InstallPrompt";

export const metadata: Metadata = {
  title: "Synapse Search - Buscador Semántico",
  description: "Motor de búsqueda semántica inteligente para descubrir series de televisión basado en significado y contexto. Funciona offline con PWA.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Synapse Search",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon-192x192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#8b5cf6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Synapse Search" />
      </head>
      <body className="antialiased">
        <OfflineBanner />
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
