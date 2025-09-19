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

export function EditList({
  listId,
  initialTitle,
  boardId,
}: {
  listId: ID;
  initialTitle: string;
  boardId: ID;
}) {
  const { updateList, removeList } = useKanban();
  const [open, setOpen] = useState<null | "edit" | "delete">(null);
  const [title, setTitle] = useState(initialTitle);

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={() => setOpen("edit")}>
        編集
      </Button>
      <Button size="sm" variant="destructive" onClick={() => setOpen("delete")}>
        削除
      </Button>

      <Dialog open={open === "edit"} onOpenChange={() => setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>リスト名を編集</DialogTitle>
            <DialogDescription className="sr-only">
              新しいタイトルを入力して保存します。
            </DialogDescription>
          </DialogHeader>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(null)}>
              キャンセル
            </Button>
            <Button
              onClick={() => {
                if (title.trim()) updateList({ listId, title });
                setOpen(null);
              }}
            >
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open === "delete"} onOpenChange={() => setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>リストを削除しますか？</DialogTitle>
            <DialogDescription className="sr-only">
              このリスト内のカードも削除されます。この操作は元に戻せません。
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            このリスト内のカードも削除されます。この操作は元に戻せません。
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(null)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                removeList({ boardId, listId });
                setOpen(null);
              }}
            >
              削除する
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function EditCard({
  cardId,
  listId,
  initialTitle,
}: {
  cardId: ID;
  listId: ID;
  initialTitle: string;
}) {
  const { updateCard, removeCard } = useKanban();
  const [open, setOpen] = useState<null | "edit" | "delete">(null);
  const [title, setTitle] = useState(initialTitle);

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={() => setOpen("edit")}>
        編集
      </Button>
      <Button size="sm" variant="destructive" onClick={() => setOpen("delete")}>
        削除
      </Button>

      <Dialog open={open === "edit"} onOpenChange={() => setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>カード名を編集</DialogTitle>
            <DialogDescription className="sr-only">
              新しいタイトルを入力して保存します。
            </DialogDescription>
          </DialogHeader>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(null)}>
              キャンセル
            </Button>
            <Button
              onClick={() => {
                if (title.trim()) updateCard({ cardId, title });
                setOpen(null);
              }}
            >
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open === "delete"} onOpenChange={() => setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>カードを削除しますか？</DialogTitle>
            <DialogDescription className="sr-only">
              この操作は元に戻せません。
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            この操作は元に戻せません。
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(null)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                removeCard({ listId, cardId });
                setOpen(null);
              }}
            >
              削除する
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
