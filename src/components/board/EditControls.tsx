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
import {
  updateList as saUpdateList,
  deleteList as saDeleteList,
  updateCard as saUpdateCard,
  deleteCard as saDeleteCard,
} from "@/lib/actions-bridge";

export function EditList({
  listId,
  initialTitle,
}: {
  listId: ID;
  initialTitle: string;
}) {
  const { updateList } = useKanban();
  const [open, setOpen] = useState<null | "edit" | "delete">(null);
  const [title, setTitle] = useState(initialTitle);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={() => setOpen("edit")}>
        編集
      </Button>
      <Button size="sm" variant="destructive" onClick={() => setOpen("delete")}>
        削除
      </Button>

      {/* 編集ダイアログ */}
      <Dialog open={open === "edit"} onOpenChange={() => setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>リスト名を編集</DialogTitle>
            <DialogDescription className="sr-only">
              新しいタイトルを入力して保存します。
            </DialogDescription>
          </DialogHeader>

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={busy}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setOpen(null)}
              disabled={busy}
            >
              キャンセル
            </Button>
            <Button
              onClick={async () => {
                const t = title.trim();
                if (!t || busy) return;
                setBusy(true);
                // 楽観更新
                updateList({ listId, title: t });
                try {
                  // DB 永続化
                  await saUpdateList({ listId: String(listId), title: t });
                } catch (err) {
                  console.error("Failed to update list", {
                    listId,
                    title: t,
                    err,
                  });
                } finally {
                  setBusy(false);
                  setOpen(null);
                  router.refresh();
                }
              }}
              disabled={busy || !title.trim()}
            >
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 削除ダイアログ */}
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
              onClick={async () => {
                if (busy) return;
                setBusy(true);
                try {
                  // DB 永続化
                  await saDeleteList({ listId: String(listId) });
                  setOpen(null);
                  // 成功後はフルリロード
                  if (typeof window !== "undefined") {
                    window.location.reload();
                  } else {
                    router.refresh();
                  }
                } catch (err) {
                  console.error("Failed to delete list", { listId, err });
                  setBusy(false);
                }
              }}
              disabled={busy}
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
  initialTitle,
}: {
  cardId: ID;
  initialTitle: string;
}) {
  const { updateCard } = useKanban();
  const [open, setOpen] = useState<null | "edit" | "delete">(null);
  const [title, setTitle] = useState(initialTitle);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={() => setOpen("edit")}>
        編集
      </Button>
      <Button size="sm" variant="destructive" onClick={() => setOpen("delete")}>
        削除
      </Button>

      {/* 編集ダイアログ */}
      <Dialog open={open === "edit"} onOpenChange={() => setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>カード名を編集</DialogTitle>
            <DialogDescription className="sr-only">
              新しいタイトルを入力して保存します。
            </DialogDescription>
          </DialogHeader>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={busy}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setOpen(null)}
              disabled={busy}
            >
              キャンセル
            </Button>
            <Button
              onClick={async () => {
                const t = title.trim();
                if (!t || busy) return;
                setBusy(true);
                // 楽観更新
                updateCard({ cardId, title: t });
                try {
                  // DB 永続化
                  await saUpdateCard({ cardId: String(cardId), title: t });
                } catch (err) {
                  console.error("Failed to update card", {
                    cardId,
                    title: t,
                    err,
                  });
                } finally {
                  setBusy(false);
                  setOpen(null);
                  router.refresh();
                }
              }}
              disabled={busy || !title.trim()}
            >
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 削除ダイアログ */}
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
              onClick={async () => {
                if (busy) return;
                setBusy(true);
                try {
                  // DB 永続化
                  await saDeleteCard({ cardId: String(cardId) });
                  setOpen(null);
                  // 成功後はフルリロード
                  if (typeof window !== "undefined") {
                    window.location.reload();
                  } else {
                    router.refresh();
                  }
                } catch (err) {
                  console.error("Failed to delete card", { cardId, err });
                  setBusy(false);
                }
              }}
              disabled={busy}
            >
              削除する
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
