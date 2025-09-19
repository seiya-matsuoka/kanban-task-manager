import { create } from "zustand";
import { boardRepo, listRepo, cardRepo } from "@/lib/repo";
import type { Board, Card, ID, List, Position } from "@/types/domain";

type KanbanState = {
  boards: Board[];
  listsByBoard: Record<ID, List[]>;
  cardsByList: Record<ID, Card[]>;
  loading: boolean;

  initBoardData(payload: {
    boardId: ID;
    boards?: Board[];
    lists: List[];
    cardsByList: Record<ID, Card[]>;
  }): void;
  loadBoard(boardId: ID): Promise<void>;
  refreshBoard(boardId: ID): Promise<void>;

  // 同一リスト内ソート
  reorderCardInList(params: {
    listId: ID;
    activeCardId: ID;
    overCardId: ID;
  }): void;

  moveCardToAnotherList(params: {
    fromListId: ID;
    toListId: ID;
    cardId: ID;
    overCardId?: ID;
  }): void;

  reorderLists(params: { boardId: ID; activeListId: ID; overListId: ID }): void;

  addBoard(input: { title: string }): ID;
  addList(input: { boardId: ID; title: string }): ID;
  addCard(input: { boardId: ID; listId: ID; title: string }): ID;
};

const GAP: Position = 1024;

function computeNewPosition(prev?: Position, next?: Position): Position {
  if (prev == null && next == null) return GAP;
  if (prev == null) return Math.floor((0 + next!) / 2) || Math.floor(next! / 2);
  if (next == null) return prev + GAP;
  const mid = Math.floor((prev + next) / 2);
  if (mid === prev || mid === next) {
    return prev + 1;
  }
  return mid;
}

function normalizePositions(cards: Card[]): Card[] {
  // 1024 間隔で振り直し
  return cards
    .sort((a, b) => a.position - b.position)
    .map((c, i) => ({ ...c, position: (i + 1) * GAP }));
}

function normalizeLists(lists: List[]): List[] {
  return lists
    .sort((a, b) => a.position - b.position)
    .map((l, i) => ({ ...l, position: (i + 1) * GAP }));
}

export const useKanban = create<KanbanState>((set, get) => ({
  boards: [],
  listsByBoard: {},
  cardsByList: {},
  loading: false,

  initBoardData({ boardId, boards, lists, cardsByList }) {
    const prev = get();
    set({
      boards: boards ?? prev.boards,
      listsByBoard: { ...prev.listsByBoard, [boardId]: lists },
      cardsByList: { ...prev.cardsByList, ...cardsByList },
    });
  },

  async loadBoard(boardId) {
    set({ loading: true });
    const [boards, lists] = await Promise.all([
      boardRepo.listBoards(),
      listRepo.listByBoard(boardId),
    ]);
    const cardsByListEntries = await Promise.all(
      lists.map(async (l) => [l.id, await cardRepo.listByList(l.id)] as const),
    );
    const cardsByList = Object.fromEntries(cardsByListEntries);
    set({
      boards,
      listsByBoard: { ...get().listsByBoard, [boardId]: lists },
      cardsByList: { ...get().cardsByList, ...cardsByList },
      loading: false,
    });
  },

  async refreshBoard(boardId) {
    await get().loadBoard(boardId);
  },

  reorderCardInList({ listId, activeCardId, overCardId }) {
    const cards = get().cardsByList[listId];
    if (!cards) return;

    const cur = [...cards];
    const fromIdx = cur.findIndex((c) => c.id === activeCardId);
    const toIdx = cur.findIndex((c) => c.id === overCardId);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;

    const [moved] = cur.splice(fromIdx, 1);
    cur.splice(toIdx, 0, moved);

    // 新しい position を決定
    const prev = cur[toIdx - 1]?.position;
    const next = cur[toIdx + 1]?.position;
    let newPos = computeNewPosition(prev, next);
    moved.position = newPos;

    const needNormalize = cur.some(
      (c, i) => i > 0 && c.position <= cur[i - 1].position,
    );
    const final = needNormalize ? normalizePositions(cur) : cur;

    set({
      cardsByList: { ...get().cardsByList, [listId]: final },
    });
  },

  moveCardToAnotherList({ fromListId, toListId, cardId, overCardId }) {
    const { cardsByList } = get();
    const from = [...(cardsByList[fromListId] ?? [])];
    const to = [...(cardsByList[toListId] ?? [])];
    const idx = from.findIndex((c) => c.id === cardId);
    if (idx < 0) return;

    const [moved] = from.splice(idx, 1);
    moved.listId = toListId;

    let insertIdx = to.length;
    if (overCardId) {
      const overIdx = to.findIndex((c) => c.id === overCardId);
      if (overIdx >= 0) insertIdx = overIdx;
    }
    to.splice(insertIdx, 0, moved);

    const prev = to[insertIdx - 1]?.position;
    const next = to[insertIdx + 1]?.position;
    moved.position = computeNewPosition(prev, next);

    const needNormalizeTo = to.some(
      (c, i) => i > 0 && c.position <= to[i - 1].position,
    );
    const needNormalizeFrom = from.some(
      (c, i) => i > 0 && c.position <= from[i - 1].position,
    );
    const finalTo = needNormalizeTo ? normalizePositions(to) : to;
    const finalFrom = needNormalizeFrom ? normalizePositions(from) : from;

    set({
      cardsByList: {
        ...cardsByList,
        [fromListId]: finalFrom,
        [toListId]: finalTo,
      },
    });
  },

  reorderLists({ boardId, activeListId, overListId }) {
    const lists = [...(get().listsByBoard[boardId] ?? [])];
    const fromIdx = lists.findIndex((l) => l.id === activeListId);
    const toIdx = lists.findIndex((l) => l.id === overListId);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;

    const [moved] = lists.splice(fromIdx, 1);
    lists.splice(toIdx, 0, moved);

    const prev = lists[toIdx - 1]?.position;
    const next = lists[toIdx + 1]?.position;
    moved.position = computeNewPosition(prev, next);

    const final = normalizeLists(lists);
    set({
      listsByBoard: { ...get().listsByBoard, [boardId]: final },
    });
  },

  addBoard({ title }) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newBoard: Board = { id, title, createdAt: now, updatedAt: now };
    set((s) => ({ boards: [...s.boards, newBoard] }));
    return id;
  },

  addList({ boardId, title }) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const lists = [...(get().listsByBoard[boardId] ?? [])];
    const pos = (lists.at(-1)?.position ?? 0) + GAP;
    const newList: List = {
      id,
      boardId,
      title,
      position: pos,
      createdAt: now,
      updatedAt: now,
    };
    const next = [...lists, newList];
    set({
      listsByBoard: { ...get().listsByBoard, [boardId]: next },
      cardsByList: { ...get().cardsByList, [id]: [] },
    });
    return id;
  },

  addCard({ boardId, listId, title }) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const cards = [...(get().cardsByList[listId] ?? [])];
    const pos = (cards.at(-1)?.position ?? 0) + GAP;
    const newCard: Card = {
      id,
      boardId,
      listId,
      title,
      position: pos,
      createdAt: now,
      updatedAt: now,
    };
    const next = [...cards, newCard];
    set({ cardsByList: { ...get().cardsByList, [listId]: next } });
    return id;
  },
}));
