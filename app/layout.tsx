import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mandat de recherche d'intermédiation",
  description: "POC de signature électronique stateless",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
