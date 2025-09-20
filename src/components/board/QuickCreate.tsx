"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { createList, createCard } from "@/lib/actions-bridge";

export default function QuickCreate({ boardId }: { boardId: ID }) {
  const { listsByBoard } = useKanban();
  const [open, setOpen] = useState<null | "list" | "card">(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const lists = listsByBoard[boardId] ?? [];
  const router = useRouter();

  async function onCreate() {
    const t = title.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      if (open === "list") {
        await createList({ boardId: String(boardId), title: t });
      }
      if (open === "card") {
        const listId = lists[0]?.id;
        if (listId) {
          await createCard({
            boardId: String(boardId),
            listId: String(listId),
            title: t,
          });
        }
      }
      setTitle("");
      setOpen(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const heading = open === "list" ? "List を追加" : "Card を追加";

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
            <Button onClick={onCreate} disabled={busy || !title.trim()}>
              作成
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
