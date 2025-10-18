import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  metadataBase: new URL("https://kanban-task-manager-seiya.vercel.app"),
  title: "Kanban Task Manager",
  description:
    "ボード / リスト / カード で構成されたシンプルなカンバンボード。",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Kanban Task Manager",
    title: "Kanban Task Manager",
    description:
      "ボード / リスト / カード で構成されたシンプルなカンバンボード。",
    images: [
      { url: "/og.png", width: 1200, height: 630, alt: "Kanban Task Manager" },
    ],
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-dvh bg-[var(--board-bg)] text-foreground">
        {/* アプリ共通ヘッダを固定 */}
        <header className="sticky top-0 z-50 bg-[var(--header-bg)] text-white backdrop-blur">
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
