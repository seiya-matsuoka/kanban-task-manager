"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  updateBoardTitle,
  deleteBoard,
  reorderBoard,
} from "@/app/actions/boards";

const SHOW_POS = process.env.NEXT_PUBLIC_DEBUG_POS === "1";

type BoardItem = {
  id: string;
  title: string;
  position: number;
  createdAt: string;
};

export default function BoardsGrid({ boards }: { boards: BoardItem[] }) {
  const router = useRouter();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
  const [items, setItems] = useState(boards);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
        <div className="h-24 animate-pulse rounded-sm border border-white/20 bg-white/10" />
      </div>
    );
  }

  function startEdit(id: string, current: string) {
    setEditingId(id);
    setTitleDraft(current);
  }
  async function saveEdit(id: string) {
    const t = titleDraft.trim();
    setEditingId(null);
    if (!t) return;
    setItems((xs) => xs.map((b) => (b.id === id ? { ...b, title: t } : b)));
    const res = await updateBoardTitle({ boardId: id, title: t });
    if (res?.ok === false) {
      console.error("updateBoardTitle failed:", res.error);
    }
    router.refresh();
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((x) => x.id === String(active.id));
    const to = items.findIndex((x) => x.id === String(over.id));
    if (from < 0 || to < 0) return;

    const next = arrayMove(items, from, to);
    setItems(next);

    const i = next.findIndex((x) => x.id === String(active.id));
    const prev = i > 0 ? next[i - 1].position : null;
    const nextPos = i < next.length - 1 ? next[i + 1].position : null;

    const res = await reorderBoard({
      boardId: String(active.id),
      prev,
      next: nextPos,
    });
    if (res?.ok === false) {
      console.error("reorderBoard failed:", res.error);
    }
    router.refresh();
  }

  async function doDelete(id: string) {
    setBusyId(id);
    const res = await deleteBoard({ boardId: id });
    setBusyId(null);
    setConfirmId(null);
    if (res?.ok === false) {
      console.error("deleteBoard failed:", res.error);
      router.refresh();
    } else {
      if (typeof window !== "undefined") {
        window.location.reload();
      } else {
        router.refresh();
      }
    }
  }

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <SortableContext
          items={items.map((b) => b.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
            {items.map((b) => (
              <BoardCard
                key={b.id}
                item={b}
                isEditing={editingId === b.id}
                titleDraft={titleDraft}
                onStartEdit={() => startEdit(b.id, b.title)}
                onChangeDraft={setTitleDraft}
                onCommit={() => saveEdit(b.id)}
                onCancel={() => setEditingId(null)}
                onConfirmDelete={() => setConfirmId(b.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* 削除確認ダイアログ */}
      <Dialog open={!!confirmId} onOpenChange={() => setConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ボードを削除しますか？</DialogTitle>
            <DialogDescription className="sr-only">
              リストとカードも同時に削除されます。この操作は元に戻せません。
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            リストとカードも同時に削除されます。この操作は元に戻せません。
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConfirmId(null)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmId && doDelete(confirmId)}
              disabled={!!busyId}
            >
              削除する
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BoardCard(props: {
  item: BoardItem;
  isEditing: boolean;
  titleDraft: string;
  onStartEdit: () => void;
  onChangeDraft: (v: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  onConfirmDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: props.item.id,
    });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="rounded-sm border border-[var(--border)] bg-[var(--card-bg)] shadow transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          {/* 左：ドラッグハンドル */}
          <button
            className="mr-1 cursor-grab p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
            {...attributes}
            {...listeners}
            aria-label="並び替え"
          >
            <GripVertical size={16} />
          </button>

          <div className="min-w-0 flex-1">
            {props.isEditing ? (
              <Input
                autoFocus
                value={props.titleDraft}
                onChange={(e) => props.onChangeDraft(e.target.value)}
                onBlur={props.onCommit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") props.onCommit();
                  if (e.key === "Escape") props.onCancel();
                }}
              />
            ) : (
              <CardTitle className="flex items-center gap-2">
                <Link
                  href={`/boards/${props.item.id}`}
                  className="block max-w-full truncate hover:underline"
                  title={props.item.title}
                >
                  {props.item.title}
                </Link>
              </CardTitle>
            )}
          </div>

          <div className="flex items-center gap-1">
            {!props.isEditing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={props.onStartEdit}
                aria-label="編集"
              >
                <Pencil size={16} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={props.onConfirmDelete}
              aria-label="削除"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-xs text-muted-foreground">
            {SHOW_POS ? <>pos: {props.item.position} ・ </> : null}
            作成: {new Date(props.item.createdAt).toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
