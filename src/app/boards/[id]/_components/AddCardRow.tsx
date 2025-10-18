"use client";

import { useState } from "react";
import { createCard } from "@/lib/actions-bridge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QUOTA } from "@/lib/quota";
import { useKanban } from "@/stores/kanban";

export default function AddCardRow({
  boardId,
  listId,
}: {
  boardId: string;
  listId: string;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const { listsByBoard, cardsByList } = useKanban();
  const lists = listsByBoard?.[boardId] ?? [];
  const cardCount = lists.reduce(
    (sum, l) => sum + (cardsByList?.[l.id]?.length ?? 0),
    0,
  );
  const canAdd = cardCount < QUOTA.MAX_CARDS_PER_BOARD;

  async function onSubmit() {
    const t = title.trim();
    if (!t || busy) return;
    if (!canAdd) {
      toast({
        title: "カードを追加できません",
        description: `上限（${QUOTA.MAX_CARDS_PER_BOARD}）に達しています`,
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    try {
      const res = await createCard({ boardId, listId, title: t });
      if (res?.ok === false) throw new Error(String(res.error ?? "failed"));
      // 成功後はフルリロード
      window.location.reload();
    } catch (e) {
      toast({
        title: "カードの作成に失敗しました",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <>
        <button
          className={`mt-1 w-full rounded-sm px-3 py-2 text-left text-sm font-semibold ${
            canAdd
              ? "text-slate-600 hover:bg-[var(--addcard-hover-bg)]"
              : "pointer-events-none cursor-not-allowed text-slate-400 opacity-60"
          }`}
          onClick={() => canAdd && setOpen(true)}
          disabled={!canAdd}
        >
          <Plus className="mr-2 inline" size={16} />
          カードを追加
        </button>
        {!canAdd && (
          <p className="mt-1 text-xs text-amber-600">
            このボードのカード上限（{QUOTA.MAX_CARDS_PER_BOARD}
            ）に達しています。
            <br />
            不要なカードを削除してから作成してください。
          </p>
        )}
      </>
    );
  }

  return (
    <div className="mt-1 w-full rounded-sm bg-white/90 p-2 shadow-sm">
      <Input
        autoFocus
        placeholder="カードの内容"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
          if (e.key === "Escape") setOpen(false);
        }}
        className="mb-2"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={!title.trim() || busy || !canAdd}
        >
          追加
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpen(false)}
          disabled={busy}
        >
          キャンセル
        </Button>
      </div>
    </div>
  );
}
