import { prisma } from "@/lib/prisma";
import BoardsGrid from "./_components/BoardsGrid";
import CreateBoardDialog from "./_components/CreateBoardDialog";

export const dynamic = "force-dynamic";

type BoardRow = {
  id: string;
  title: string;
  position: number | null;
  createdAt: Date;
};

export default async function BoardsPage() {
  const rows: BoardRow[] = await prisma.board.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    select: { id: true, title: true, position: true, createdAt: true },
  });

  const boards = rows.map((b) => ({
    id: b.id,
    title: b.title,
    position: b.position ?? 1024,
    createdAt: b.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">ボード一覧</h2>
        <CreateBoardDialog />
      </div>

      <BoardsGrid boards={boards} />

      {boards.length === 0 && (
        <p className="text-sm text-muted-foreground">
          まだボードがありません。右上の「＋新規ボード」から作成してください。
        </p>
      )}
    </div>
  );
}
