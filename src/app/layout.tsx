import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GenKa - 工事原価管理システム",
  description: "建設業向けリアルタイム工事原価管理。完工前に赤字を防ぐ。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
