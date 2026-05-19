import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Creation Workbench",
  description: "Script, image, and video generation MVP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
