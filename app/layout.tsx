import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GrammaireMap — French Grammar",
  description: "A living visual map of your French grammar knowledge",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
