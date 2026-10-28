import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { AuthLinkHandler } from "@/components/auth-link-handler";
import "./globals.css";

// Fuente incluida en el proyecto: no depende de Google Fonts al compilar.
const geistSans = GeistSans;

export const metadata: Metadata = {
  title: "En qué la gasto",
  description: "Mirá cómo tirás guita.",
  appleWebApp: { capable: true, title: "En qué la gasto", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <AuthLinkHandler />
        {children}
      </body>
    </html>
  );
}
