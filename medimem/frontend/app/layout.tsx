import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediMem AI — AI that remembers.",
  description: "Persistent AI memory for every patient — powered by Cognee Cloud",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
