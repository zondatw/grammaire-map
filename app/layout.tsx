import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

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
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <head>
        {/* Set data-theme before first paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('grammaireMap_theme')||'system';document.documentElement.setAttribute('data-theme',t);}catch(e){}` }} />
      </head>
      <body><main>{children}</main></body>
    </html>
  );
}
