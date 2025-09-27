import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Kanban Task Manager",
  description: "Kanban built with Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-dvh bg-background text-foreground">
        {/* アプリ共通ヘッダを固定 */}
        <header className="sticky top-0 z-50 bg-sky-900 text-white backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-lg font-semibold">Kanban Task Manager</h1>
          </div>
        </header>

        {/* 横幅いっぱい・縦はヘッダを引いた残り */}
        <main className="h-[calc(100dvh-56px)] w-full">{children}</main>

        <Toaster />
      </body>
    </html>
  );
}
