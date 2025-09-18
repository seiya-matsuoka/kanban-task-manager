import { notFound } from "next/navigation";
import { boardRepo, listRepo, cardRepo } from "@/lib/repo";
import BoardView from "@/components/board/BoardView";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const board = await boardRepo.getBoard(id);
  if (!board) return notFound();
  const lists = await listRepo.listByBoard(board.id);
  const cardsByList: Record<
    string,
    Awaited<ReturnType<typeof cardRepo.listByList>>
  > = {};
  for (const l of lists) {
    cardsByList[l.id] = await cardRepo.listByList(l.id);
  }
  return (
    <BoardView
      boardId={board.id}
      boardTitle={board.title}
      lists={lists}
      cardsByList={cardsByList}
    />
  );
}
