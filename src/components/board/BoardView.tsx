"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
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
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
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
        <div className="space-y-3 rounded-b-2xl p-3">{children}</div>
      </div>
    </div>
  );
}

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
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab select-none rounded-xl border bg-background p-3 text-sm active:cursor-grabbing"
    >
      <div className="font-medium">{card.title}</div>
      <div className="text-xs text-muted-foreground">pos: {card.position}</div>
      <div className="pt-2">
        <EditCard cardId={card.id} listId={listId} initialTitle={card.title} />
      </div>
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

  // 初回は SSR スナップショットを描画、マウント後に DnD 表示へ切替
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    initBoardData({ boardId, lists, cardsByList });
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, lists, cardsByList]);

  // 初回は props をそのまま使い、ハイドレート後にストアへ切替
  const effectiveLists =
    hydrated && (listsByBoard[boardId]?.length ?? 0) > 0
      ? listsByBoard[boardId]!
      : lists;

  const effectiveCards = (lid: ID) =>
    hydrated && (storeCards[lid]?.length ?? 0) > 0
      ? storeCards[lid]!
      : (cardsByList[lid] ?? []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function onDragEnd(ev: DragEndEvent) {
    const activeId = String(ev.active.id);
    const overId = ev.over ? String(ev.over.id) : null;
    const activeType = ev.active.data.current?.type as
      | "card"
      | "list"
      | undefined;
    const overType = ev.over?.data.current?.type as "card" | "list" | undefined;

    if (!overId || !activeType) return;

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
      return;
    }

    // CARD 並び替え/リスト跨ぎ
    if (activeType === "card") {
      const fromListId = String(ev.active.data.current?.listId);
      const toListId = String(ev.over?.data.current?.listId ?? ev.over?.id);
      if (!toListId) return;

      if (fromListId === toListId && overType === "card") {
        const before = effectiveCards(fromListId).map((x) => ({ ...x }));
        const after = arrayMoveById(before, activeId, overId);
        const j = after.findIndex((x) => String(x.id) === activeId);
        const prevC = j > 0 ? after[j - 1].position : undefined;
        const nextC = j < after.length - 1 ? after[j + 1].position : undefined;
        const newPos = midPosition(prevC, nextC);

        reorderCardInList({
          listId: fromListId,
          activeCardId: activeId,
          overCardId: overId,
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
        return;
      }

      const beforeTo = effectiveCards(toListId).map((x) => ({ ...x }));
      const afterTo =
        overType === "card"
          ? arrayMoveById(
              beforeTo.find((x) => String(x.id) === activeId)
                ? beforeTo
                : [...beforeTo, { id: activeId, position: 0 } as any],
              activeId,
              overId,
            )
          : [...beforeTo, { id: activeId, position: 0 } as any];

      const k = afterTo.findIndex((x) => String(x.id) === activeId);
      const prevK = k > 0 ? afterTo[k - 1].position : undefined;
      const nextK =
        k < afterTo.length - 1 ? afterTo[k + 1].position : undefined;
      const newCardPos = midPosition(prevK, nextK);

      moveCardToAnotherList({
        fromListId,
        toListId,
        cardId: activeId,
        overCardId: overType === "card" ? overId : undefined,
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
    }
  }

  function onDragOver(ev: DragOverEvent) {
    const activeType = ev.active.data.current?.type as
      | "card"
      | "list"
      | undefined;
    const overType = ev.over?.data.current?.type as
      | "card"
      | "list"
      | "list-drop"
      | undefined;
    if (activeType !== "card") return;

    const activeId = String(ev.active.id);
    const fromListId = String(ev.active.data.current?.listId);

    if (!ev.over) return;
    const toListId = String(ev.over.data.current?.listId ?? ev.over.id);
    if (!toListId || toListId === fromListId) return;

    const overCardId = overType === "card" ? String(ev.over.id) : undefined;
    moveCardToAnotherList({
      fromListId,
      toListId,
      cardId: activeId,
      overCardId,
    });
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
        collisionDetection={closestCorners}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
      >
        <SortableContext
          items={effectiveLists.map((l) => l.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-4 overflow-x-auto pb-2">
            {effectiveLists.map((l) => (
              <SortableList key={l.id} list={l}>
                <SortableContext
                  items={effectiveCards(l.id).map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {effectiveCards(l.id).map((c) => (
                    <SortableCard key={c.id} card={c} listId={l.id} />
                  ))}
                </SortableContext>
              </SortableList>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
