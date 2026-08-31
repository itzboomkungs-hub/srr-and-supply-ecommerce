import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SRR AND SUPPLY",
  description:
    "SRR AND SUPPLY - Seal, Gasket, Pump, Valve and Industrial Parts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}