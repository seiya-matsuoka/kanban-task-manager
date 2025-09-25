"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  rectIntersection,
  closestCenter,
  type CollisionDetection,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useKanban } from "@/stores/kanban";
import type { ID, List, Card } from "@/types/domain";
import QuickCreate from "@/components/board/QuickCreate";
import { EditList, EditCard } from "@/components/board/EditControls";
import {
  reorderList as saReorderList,
  reorderCard as saReorderCard,
} from "@/lib/actions-bridge";

type Props = {
  boardId: ID;
  boardTitle: string;
  lists: List[];
  cardsByList: Record<ID, Card[]>;
};

type OverInfo = {
  listId: ID;
  overType: "card" | "list-drop" | "list-bottom";
  overCardId?: ID | null;
} | null;

const listAwareCollision: CollisionDetection = (args) => {
  const activeType = args.active?.data?.current?.type as
    | "card"
    | "list"
    | undefined;

  if (activeType === "list") {
    const listsOnly = args.droppableContainers.filter(
      (dc) => dc.data?.current?.type === "list",
    );
    return closestCenter({ ...args, droppableContainers: listsOnly });
  }

  return rectIntersection(args);
};

function eqOverInfo(a: OverInfo, b: OverInfo) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    String(a.listId) === String(b.listId) &&
    a.overType === b.overType &&
    (a.overCardId ? String(a.overCardId) : "") ===
      (b.overCardId ? String(b.overCardId) : "")
  );
}

// 並べ替えユーティリティ
function arrayMoveById<T extends { id: string }>(
  arr: T[],
  activeId: string,
  overId: string,
) {
  const from = arr.findIndex((x) => String(x.id) === String(activeId));
  const to = arr.findIndex((x) => String(x.id) === String(overId));
  if (from < 0 || to < 0 || from === to) return arr;
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function midPosition(prev?: number, next?: number) {
  const GAP = 1024;
  const p = prev ?? 0;
  const n = next ?? p + GAP * 2;
  const m = Math.floor((p + n) / 2);
  return m === p || m === n ? n + GAP : m;
}

// リスト末尾だけを拾う専用ゾーン
function BottomDropZone({ listId }: { listId: ID }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-bottom-${listId}`,
    data: { type: "list-bottom", listId },
  });
  return (
    <div
      ref={setNodeRef}
      className={`h-6 ${isOver ? "rounded-md outline outline-2 outline-primary/50" : ""}`}
    />
  );
}

// 従来のボディ（list-drop）
function DroppableListBody({
  listId,
  children,
}: {
  listId: ID;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `drop-${listId}`,
    data: { type: "list-drop", listId },
  });
  return (
    <div
      ref={setNodeRef}
      className={`space-y-3 rounded-b-2xl p-3 ${
        isOver ? "outline outline-2 outline-primary/50" : ""
      }`}
    >
      {children}
      {/* 末尾ゾーン */}
      <BottomDropZone listId={listId} />
    </div>
  );
}

// 共通のカードUI（通常表示とドラッグ中で共用）
function CardView({ card, listId }: { card: Card; listId: ID }) {
  return (
    <div className="rounded-xl border bg-background p-3 text-sm">
      <div className="font-medium">{card.title}</div>
      <div className="text-xs text-muted-foreground">pos: {card.position}</div>
      <div className="pt-2">
        <EditCard cardId={card.id} listId={listId} initialTitle={card.title} />
      </div>
    </div>
  );
}

// DnD用ソートアイテム
function SortableList({
  list,
  children,
}: {
  list: List;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: list.id, data: { type: "list" } });

  const style: React.CSSProperties = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    pointerEvents: isDragging ? "none" : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} className="w-64 min-w-[260px] shrink-0">
      <div className="rounded-2xl border bg-card">
        <div
          className="flex cursor-grab select-none items-center justify-between gap-2 border-b px-4 py-3 font-medium active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <span>
            {list.title}{" "}
            <span className="text-xs text-muted-foreground">
              pos:{list.position}
            </span>
          </span>
          <EditList
            listId={list.id}
            boardId={list.boardId}
            initialTitle={list.title}
          />
        </div>
        <DroppableListBody listId={list.id}>{children}</DroppableListBody>
      </div>
    </div>
  );
}

// DnD用ソートアイテム（カード）
function SortableCard({ card, listId }: { card: Card; listId: ID }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { type: "card", listId } });

  const style: React.CSSProperties = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    pointerEvents: isDragging ? "none" : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab select-none active:cursor-grabbing"
    >
      <CardView card={card} listId={listId} />
    </div>
  );
}

// SSR/初回用の静的描画
function StaticList({
  list,
  children,
}: {
  list: List;
  children: React.ReactNode;
}) {
  return (
    <div className="w-64 min-w-[260px] shrink-0">
      <div className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3 font-medium">
          <span>
            {list.title}{" "}
            <span className="text-xs text-muted-foreground">
              pos:{list.position}
            </span>
          </span>
          <EditList
            listId={list.id}
            boardId={list.boardId}
            initialTitle={list.title}
          />
        </div>
        <div className="space-y-3 rounded-b-2xl p-3">{children}</div>
      </div>
    </div>
  );
}

function StaticCard({ card, listId }: { card: Card; listId: ID }) {
  return <CardView card={card} listId={listId} />;
}

export default function BoardView({
  boardId,
  boardTitle,
  lists,
  cardsByList,
}: Props) {
  const router = useRouter();

  const storeCards = useKanban((s) => s.cardsByList);
  const listsByBoard = useKanban((s) => s.listsByBoard);
  const initBoardData = useKanban((s) => s.initBoardData);
  const reorderCardInList = useKanban((s) => s.reorderCardInList);
  const moveCardToAnotherList = useKanban((s) => s.moveCardToAnotherList);
  const reorderLists = useKanban((s) => s.reorderLists);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [activeCardListId, setActiveCardListId] = useState<ID | null>(null);
  const [activeList, setActiveList] = useState<List | null>(null);
  const [overInfo, setOverInfo] = useState<OverInfo>(null);

  // 初回は SSR スナップショットを描画、マウント後に DnD 表示へ切替
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    initBoardData({ boardId, lists, cardsByList });
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, lists, cardsByList]);

  // ハイドレート後は必ず Store を使う
  const effectiveLists = hydrated ? (listsByBoard[boardId] ?? []) : lists;

  const effectiveCards = (lid: ID) =>
    hydrated ? (storeCards[lid] ?? []) : (cardsByList[lid] ?? []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function onDragStart(ev: DragStartEvent) {
    setOverInfo(null);
    const type = ev.active.data.current?.type as "card" | "list" | undefined;
    if (type === "card") {
      const listId = String(ev.active.data.current?.listId);
      const cardId = String(ev.active.id);
      const card =
        effectiveCards(listId).find((c) => String(c.id) === cardId) ?? null;
      if (card) setActiveCard(card);
      setActiveCardListId(listId as ID);
      setActiveList(null);
    } else if (type === "list") {
      const listId = String(ev.active.id);
      const list = effectiveLists.find((l) => String(l.id) === listId) ?? null;
      setActiveList(list);
      setActiveCard(null);
      setActiveCardListId(null);
    }
  }

  function onDragEnd(ev: DragEndEvent) {
    const finish = () => {
      if (typeof window !== "undefined") {
        requestAnimationFrame(() => setOverInfo(null));
      } else {
        setOverInfo(null);
      }
      setActiveCard(null);
      setActiveCardListId(null);
      setActiveList(null);
    };

    const activeId = String(ev.active.id);
    const over = ev.over;
    const overId = over ? String(over.id) : null;
    const activeType = ev.active.data.current?.type as
      | "card"
      | "list"
      | undefined;
    const overType = over?.data.current?.type as
      | "card"
      | "list"
      | "list-drop"
      | "list-bottom"
      | undefined;

    if (!overId || !activeType) {
      finish();
      return;
    }

    // LIST 並び替え
    if (activeType === "list" && overType === "list") {
      const before = effectiveLists.map((x) => ({ ...x }));
      const after = arrayMoveById(before, activeId, overId);
      const i = after.findIndex((x) => String(x.id) === activeId);
      const prev = i > 0 ? after[i - 1].position : undefined;
      const next = i < after.length - 1 ? after[i + 1].position : undefined;
      const newPos = midPosition(prev, next);

      reorderLists({ boardId, activeListId: activeId, overListId: overId });
      saReorderList({ listId: activeId, position: newPos })
        .then(() => router.refresh())
        .catch((err) =>
          console.error("reorderList failed", { activeId, newPos, err }),
        );
      finish();
      return;
    }

    // CARD 並び替え/リスト跨ぎ
    if (activeType === "card") {
      const fromListId = String(
        activeCardListId ?? ev.active.data.current?.listId ?? "",
      );
      if (!fromListId) {
        finish();
        return;
      }
      const toListId = over ? String(over.data.current?.listId ?? over.id) : "";
      if (!toListId) {
        finish();
        return;
      }

      // 末尾positionを常に安全に出すためのヘルパ
      const tailPosition = (lid: ID) => {
        const cs = effectiveCards(lid);
        const last = cs.length ? Math.max(...cs.map((c) => c.position)) : 0;
        const GAP = 1024;
        return last + GAP;
      };

      // 同一リスト × 末尾ゾーン（list-drop / list-bottom）にドロップ → 末尾へ
      if (
        fromListId === toListId &&
        (overType === "list-drop" || overType === "list-bottom")
      ) {
        const newPos = tailPosition(fromListId as ID);
        saReorderCard({
          cardId: activeId,
          toListId: fromListId,
          position: newPos,
        })
          .then(() => router.refresh())
          .catch((err) =>
            console.error("reorderCard(in-list bottom) failed", {
              cardId: activeId,
              toListId: fromListId,
              newPos,
              err,
            }),
          );
        finish();
        return;
      }

      // 同一リスト（カード上）
      if (fromListId === toListId && overType === "card") {
        const before = effectiveCards(fromListId as ID).map((x) => ({ ...x }));
        const after = arrayMoveById(before, activeId, overId!);
        const j = after.findIndex((x) => String(x.id) === activeId);
        const prevC = j > 0 ? after[j - 1].position : undefined;
        const nextC = j < after.length - 1 ? after[j + 1].position : undefined;
        const newPos = midPosition(prevC, nextC);

        reorderCardInList({
          listId: fromListId as ID,
          activeCardId: activeId,
          overCardId: overId!,
        });
        saReorderCard({ cardId: activeId, toListId, position: newPos })
          .then(() => router.refresh())
          .catch((err) =>
            console.error("reorderCard(in-list) failed", {
              cardId: activeId,
              toListId,
              newPos,
              err,
            }),
          );
        finish();
        return;
      }

      // リスト跨ぎ（カード上 or リスト本体）
      const beforeTo = effectiveCards(toListId as ID).map((x) => ({ ...x }));
      const placeholder = { id: activeId, position: 0 } as any;
      const base = beforeTo.find((x) => String(x.id) === activeId)
        ? beforeTo
        : [...beforeTo, placeholder];

      // ★ 投影＝確定：overInfo を最優先。無ければ ev.over へフォールバック。
      let afterTo = base;
      if (overInfo && String(overInfo.listId) === String(toListId)) {
        if (overInfo.overType === "card" && overInfo.overCardId) {
          afterTo = arrayMoveById(base, activeId, String(overInfo.overCardId));
        } else {
          // list-drop / list-bottom → 末尾に“投影”
          afterTo = [...beforeTo, placeholder];
        }
      } else if (overType === "card" && overId) {
        // フォールバック：ドロップ瞬間にカード上ならそれを採用
        afterTo = arrayMoveById(base, activeId, overId);
      } else {
        // それ以外は末尾に“投影”
        afterTo = [...beforeTo, placeholder];
      }

      const k = afterTo.findIndex((x) => String(x.id) === activeId);
      const prevK = k > 0 ? afterTo[k - 1].position : undefined;
      const nextK =
        k < afterTo.length - 1 ? afterTo[k + 1].position : undefined;
      const newCardPos = midPosition(prevK, nextK);

      // ★ “active の直後ID” を確定アンカーに（= その直前に入る）
      const nextId = (afterTo[k + 1]?.id as ID | undefined) ?? undefined;

      moveCardToAnotherList({
        fromListId,
        toListId,
        cardId: activeId,
        overCardId: nextId, // ← nextId を渡す（overId ではない）
      });

      saReorderCard({ cardId: activeId, toListId, position: newCardPos })
        .then(() => router.refresh())
        .catch((err) =>
          console.error("reorderCard(cross-list) failed", {
            cardId: activeId,
            toListId,
            newCardPos,
            err,
          }),
        );

      finish();
      return;
    }

    finish();
  }

  function onDragOver(ev: DragOverEvent) {
    const activeType = ev.active.data.current?.type as
      | "card"
      | "list"
      | undefined;
    if (activeType !== "card") {
      if (overInfo) setOverInfo(null);
      return;
    }

    const over = ev.over;
    if (!over) {
      if (overInfo) setOverInfo(null);
      return;
    }

    const overType = over.data.current?.type as
      | "card"
      | "list"
      | "list-drop"
      | "list-bottom"
      | undefined;

    if (!overType || overType === "list") {
      if (overInfo) setOverInfo(null);
      return;
    }

    const toListId = String(over.data.current?.listId ?? "");
    if (!toListId) {
      if (overInfo) setOverInfo(null);
      return;
    }

    if (overType === "card" && String(over.id) === String(ev.active.id)) return;

    const next: OverInfo =
      overType === "card"
        ? {
            listId: toListId as ID,
            overType: "card",
            overCardId: String(over.id) as ID,
          }
        : { listId: toListId as ID, overType, overCardId: null };

    if (!eqOverInfo(overInfo, next)) setOverInfo(next);
  }

  // SSR/初回は静的、マウント後にDnDへ切替
  if (!hydrated) {
    return (
      <div className="space-y-4" suppressHydrationWarning>
        <h2 className="flex items-center gap-3 text-xl font-semibold">
          {boardTitle}
          <QuickCreate boardId={boardId} />
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {lists.map((l) => (
            <StaticList key={l.id} list={l}>
              {(cardsByList[l.id] ?? []).map((c) => (
                <StaticCard key={c.id} card={c} listId={l.id} />
              ))}
            </StaticList>
          ))}
        </div>
      </div>
    );
  }

  // ハイドレート後は DnD を有効化
  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-3 text-xl font-semibold">
        {boardTitle}
        <QuickCreate boardId={boardId} />
      </h2>
      <DndContext
        sensors={sensors}
        collisionDetection={listAwareCollision}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
      >
        <SortableContext
          items={effectiveLists.map((l) => l.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-4 overflow-x-auto pb-2">
            {effectiveLists.map((l) => {
              // 実データのID配列
              const baseIds = effectiveCards(l.id).map((c) => c.id);
              let ids = baseIds;

              // ★ 別リストへドラッグ中だけ“見た目の配列”を投影
              if (activeCard && activeCardListId && overInfo) {
                const fromId = String(activeCardListId);
                const toId = String(overInfo.listId);
                const activeId = String(activeCard.id);

                if (fromId !== toId) {
                  if (String(l.id) === fromId) {
                    // 元リストからは active を除外（= 元リストで空白が消える）
                    ids = baseIds.filter((id) => String(id) !== activeId);
                  } else if (String(l.id) === toId) {
                    // 先リストに active を一時挿入 → 既存カードがスライドして空白ができる
                    const next = baseIds.filter(
                      (id) => String(id) !== activeId,
                    );
                    if (overInfo.overType === "card" && overInfo.overCardId) {
                      const idx = next.findIndex(
                        (id) => String(id) === String(overInfo.overCardId),
                      );
                      if (idx >= 0) next.splice(idx, 0, activeCard.id);
                      else next.push(activeCard.id);
                    } else {
                      // list-drop / list-bottom → 末尾へ
                      next.push(activeCard.id);
                    }
                    ids = next;
                  }
                }
              }

              return (
                <SortableList key={l.id} list={l}>
                  <SortableContext
                    items={ids}
                    strategy={verticalListSortingStrategy}
                  >
                    {ids.map((id) => {
                      // 実データに無いが投影で現れた activeId は activeCard を使って描画
                      const card =
                        effectiveCards(l.id).find(
                          (c) => String(c.id) === String(id),
                        ) ??
                        (activeCard && String(id) === String(activeCard.id)
                          ? (activeCard as Card)
                          : null);
                      if (!card) return null;
                      return (
                        <SortableCard
                          key={String(card.id)}
                          card={card}
                          listId={l.id}
                        />
                      );
                    })}
                  </SortableContext>
                </SortableList>
              );
            })}
          </div>
        </SortableContext>

        {/* ドラッグ中の見た目だけを表示 */}
        <DragOverlay>
          {activeCard && activeCardListId ? (
            <div className="pointer-events-none">
              <CardView card={activeCard} listId={activeCardListId} />
            </div>
          ) : activeList ? (
            <div className="pointer-events-none">
              <StaticList list={activeList}>
                {effectiveCards(activeList.id).map((c) => (
                  <StaticCard key={c.id} card={c} listId={activeList.id} />
                ))}
              </StaticList>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
