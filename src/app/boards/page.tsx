import { prisma } from "@/lib/prisma";
import BoardsGrid from "./_components/BoardsGrid";
import CreateBoardDialog from "./_components/CreateBoardDialog";
import { QUOTA } from "@/lib/quota";

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

  const canCreate = boards.length < QUOTA.MAX_BOARDS;

  return (
    <div className="grid h-full grid-rows-[auto,1fr] bg-[var(--board-bg)]">
      <div className="sticky top-0 z-10 mt-1 px-6 py-3 lg:px-8">
        <div className="flex items-center justify-between">
          <span className="inline-block rounded px-3 py-1 text-xl font-semibold">
            ボード一覧
          </span>

          <div className="ml-auto flex items-center gap-3">
            {!canCreate && (
              <p className="text-right text-xs text-amber-600">
                ボードの上限（{QUOTA.MAX_BOARDS}
                ）に達しています。
                <br />
                不要なボードを削除してから作成してください。
              </p>
            )}
            <CreateBoardDialog disabled={!canCreate} />
          </div>
        </div>
      </div>

      <div className="mt-1 px-6 pb-6 lg:px-8">
        <BoardsGrid boards={boards} />
        {boards.length === 0 && (
          <p className="mt-3 text-sm">
            まだボードがありません。右上の「＋
            新規ボード」から作成してください。
          </p>
        )}
      </div>
    </div>
  );
}
