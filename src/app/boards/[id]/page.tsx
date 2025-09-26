import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BoardView from "./_components/BoardView";

export const dynamic = "force-dynamic";

type BoardViewProps = React.ComponentProps<typeof BoardView>;
type DomainList = BoardViewProps["lists"][number];
type DomainCard = BoardViewProps["cardsByList"][string][number];

type CardRow = {
  id: string;
  listId: string;
  title: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};
type ListRow = {
  id: string;
  boardId: string;
  title: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  cards: CardRow[];
};
type BoardDetail = {
  id: string;
  title: string;
  lists: ListRow[];
};

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const board: BoardDetail | null = await prisma.board.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      lists: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          boardId: true,
          title: true,
          position: true,
          createdAt: true,
          updatedAt: true,
          cards: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              listId: true,
              title: true,
              position: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  });

  if (!board) return notFound();

  const lists: DomainList[] = board.lists.map((l) => ({
    id: l.id,
    boardId: l.boardId,
    title: l.title,
    position: l.position,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  }));

  const cardsByList: Record<string, DomainCard[]> = Object.fromEntries(
    board.lists.map((l) => [
      l.id,
      l.cards.map((c) => ({
        id: c.id,
        listId: c.listId,
        boardId: l.boardId,
        title: c.title,
        position: c.position,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    ]),
  );

  return (
    <BoardView
      boardId={board.id}
      boardTitle={board.title}
      lists={lists}
      cardsByList={cardsByList}
    />
  );
}
