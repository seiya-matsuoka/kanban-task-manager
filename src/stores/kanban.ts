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
}));
