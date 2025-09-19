"use client";

import { useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
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

type Props = {
  boardId: ID;
  boardTitle: string;
  lists: List[];
  cardsByList: Record<ID, Card[]>;
};

export default function BoardView({
  boardId,
  boardTitle,
  lists,
  cardsByList,
}: Props) {
  const {
    cardsByList: storeCards,
    listsByBoard,
    initBoardData,
    reorderCardInList,
    moveCardToAnotherList,
    reorderLists,
  } = useKanban();

  useEffect(() => {
    if (!listsByBoard[boardId]) {
      initBoardData({ boardId, lists, cardsByList });
    }
  }, [boardId]); // eslint-disable-line react-hooks/exhaustive-deps

  const effectiveLists = listsByBoard[boardId] ?? lists;
  const effectiveCards = (lid: ID) => storeCards[lid] ?? cardsByList[lid] ?? [];

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

    if (activeType === "card" && overType === "card") {
      const listId = String(ev.active.data.current?.listId);
      const overListId = String(ev.over?.data.current?.listId);
      if (listId === overListId) {
        reorderCardInList({
          listId,
          activeCardId: activeId,
          overCardId: overId,
        });
      }
    }
    if (activeType === "list" && overType === "list") {
      reorderLists({ boardId, activeListId: activeId, overListId: overId });
    }
  }

  function onDragOver(ev: DragOverEvent) {
    const activeType = ev.active.data.current?.type as
      | "card"
      | "list"
      | undefined;
    const overType = ev.over?.data.current?.type as "card" | "list" | undefined;
    if (activeType !== "card") return;

    const activeId = String(ev.active.id);
    const fromListId = String(ev.active.data.current?.listId);

    if (!ev.over) return;
    const toListId = String(ev.over.data.current?.listId ?? ev.over.id); // list上 or card上
    if (!toListId || toListId === fromListId) return;

    const overCardId = overType === "card" ? String(ev.over.id) : undefined;
    moveCardToAnotherList({
      fromListId,
      toListId,
      cardId: activeId,
      overCardId,
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-3 text-xl font-semibold">
        {boardTitle}
        <QuickCreate boardId={boardId} />
      </h2>
      <DndContext
        sensors={sensors}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
      >
        {/* リストの横方向ソート */}
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
  } = useSortable({
    id: list.id,
    data: { type: "list" },
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="w-64 min-w-[260px] shrink-0"
    >
      <div className="rounded-2xl border bg-card">
        <div className="cursor-grab select-none border-b px-4 py-3 font-medium active:cursor-grabbing">
          {list.title}{" "}
          <span className="text-xs text-muted-foreground">
            pos:{list.position}
          </span>
        </div>
        <div className="space-y-3 p-3">{children}</div>
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
  } = useSortable({
    id: card.id,
    data: { type: "card", listId },
  });

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
    </div>
  );
}
