import type { Metadata } from "next";
import "./globals.css";
import "./theme-overrides.css";

export const metadata: Metadata = {
  title: "SyncStudy · 教材同步学习助手",
  description: "把课本知识转化为通俗讲解、预习提纲、随堂小测和思维导图。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
