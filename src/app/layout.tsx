import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CSV naar QTI Converter",
  description: "Converteer CSV bestanden naar QTI 2.1 voor itslearning",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
