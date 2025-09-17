import { Board, Card, ID, List } from "@/types/domain";

const now = () => new Date().toISOString();
const uuid = () =>
  globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);

type DB = {
  boards: Map<ID, Board>;
  lists: Map<ID, List>;
  cards: Map<ID, Card>;
};

const db: DB = { boards: new Map(), lists: new Map(), cards: new Map() };

function seedOnce() {
  if (db.boards.size > 0) return;
  const b1: Board = {
    id: uuid(),
    title: "Demo Board",
    createdAt: now(),
    updatedAt: now(),
  };
  db.boards.set(b1.id, b1);

  const l1: List = {
    id: uuid(),
    boardId: b1.id,
    title: "Todo",
    position: 1024,
    createdAt: now(),
    updatedAt: now(),
  };
  const l2: List = {
    id: uuid(),
    boardId: b1.id,
    title: "Doing",
    position: 2048,
    createdAt: now(),
    updatedAt: now(),
  };
  const l3: List = {
    id: uuid(),
    boardId: b1.id,
    title: "Done",
    position: 3072,
    createdAt: now(),
    updatedAt: now(),
  };
  [l1, l2, l3].forEach((l) => db.lists.set(l.id, l));

  const c = (listId: ID, pos: number, title: string): Card => ({
    id: uuid(),
    boardId: b1.id,
    listId,
    title,
    position: pos,
    createdAt: now(),
    updatedAt: now(),
  });
  [
    c(l1.id, 1024, "仕様確認"),
    c(l1.id, 2048, "UIスケルトン"),
    c(l2.id, 1024, "ドラフト実装"),
  ].forEach((card) => db.cards.set(card.id, card));
}
seedOnce();

export const boardRepo = {
  async listBoards(): Promise<Board[]> {
    return [...db.boards.values()].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
  },
  async getBoard(id: ID): Promise<Board | null> {
    return db.boards.get(id) ?? null;
  },
};

export const listRepo = {
  async listByBoard(boardId: ID): Promise<List[]> {
    return [...db.lists.values()]
      .filter((l) => l.boardId === boardId)
      .sort((a, b) => a.position - b.position);
  },
};

export const cardRepo = {
  async listByList(listId: ID): Promise<Card[]> {
    return [...db.cards.values()]
      .filter((c) => c.listId === listId)
      .sort((a, b) => a.position - b.position);
  },
};
