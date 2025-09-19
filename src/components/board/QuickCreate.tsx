"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useKanban } from "@/stores/kanban";
import type { ID } from "@/types/domain";

export default function QuickCreate({ boardId }: { boardId: ID }) {
  const { addBoard, addList, addCard, listsByBoard } = useKanban();
  const [open, setOpen] = useState<null | "board" | "list" | "card">(null);
  const [title, setTitle] = useState("");
  const lists = listsByBoard[boardId] ?? [];

  function onCreate() {
    if (!title.trim()) return;
    if (open === "board") addBoard({ title });
    if (open === "list") addList({ boardId, title });
    if (open === "card") {
      const listId = lists[0]?.id;
      if (listId) addCard({ boardId, listId, title });
    }
    setTitle("");
    setOpen(null);
  }

  const heading =
    open === "board"
      ? "Board を追加"
      : open === "list"
        ? "List を追加"
        : "Card を追加";

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => setOpen("list")}>
        List追加
      </Button>
      <Button onClick={() => setOpen("card")}>Card追加</Button>

      <Dialog open={!!open} onOpenChange={() => setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{heading}</DialogTitle>
            <DialogDescription className="sr-only">
              新規項目のタイトルを入力して作成します
            </DialogDescription>
          </DialogHeader>

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトル"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(null)}>
              キャンセル
            </Button>
            <Button onClick={onCreate}>作成</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
