"use client";

import { useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useKanban } from "@/stores/kanban";
import type { ID, List, Card } from "@/types/domain";

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
  } = useKanban();

  useEffect(() => {
    if (!listsByBoard[boardId]) {
      // SSRから受け取ったデータをそのままストアに反映
      initBoardData({ boardId, lists, cardsByList });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function onDragEnd(ev: DragEndEvent) {
    const activeId = String(ev.active.id);
    const overId = ev.over ? String(ev.over.id) : null;
    const listId = String(ev.active.data.current?.listId);
    const overListId = String(ev.over?.data.current?.listId || listId);

    if (!overId || listId !== overListId) return;
    reorderCardInList({ listId, activeCardId: activeId, overCardId: overId });
  }

  // 表示用：store優先、なければSSR渡し
  const effectiveCardsByList = (lid: ID) =>
    storeCards[lid] ?? cardsByList[lid] ?? [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{boardTitle}</h2>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {lists.map((l) => (
            <div key={l.id} className="w-64 min-w-[260px] shrink-0">
              <div className="rounded-2xl border bg-card">
                <div className="border-b px-4 py-3 font-medium">{l.title}</div>
                <div className="space-y-3 p-3">
                  <SortableContext
                    items={effectiveCardsByList(l.id).map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {effectiveCardsByList(l.id).map((c) => (
                      <SortableCard key={c.id} card={c} listId={l.id} />
                    ))}
                  </SortableContext>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DndContext>
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
    data: { listId },
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
