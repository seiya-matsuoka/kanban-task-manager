"use client";

import { useState } from "react";
import { createList } from "@/lib/actions-bridge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QUOTA } from "@/lib/quota";
import { useKanban } from "@/stores/kanban";

export default function AddListColumn({ boardId }: { boardId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const { listsByBoard } = useKanban();
  const listCount = (listsByBoard?.[boardId] ?? []).length;
  const canAdd = listCount < QUOTA.MAX_LISTS_PER_BOARD;

  async function onSubmit() {
    const t = title.trim();
    if (!t || busy) return;
    if (!canAdd) {
      toast({
        title: "リストを追加できません",
        description: `上限（${QUOTA.MAX_LISTS_PER_BOARD}）に達しています`,
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    try {
      const res = await createList({ boardId, title: t });
      if (res?.ok === false) throw new Error(String(res.error ?? "failed"));
      // 成功後はフルリロード
      window.location.reload();
    } catch (e) {
      toast({
        title: "リストの作成に失敗しました",
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
          className={`flex h-12 w-[272px] min-w-[272px] shrink-0 items-center rounded-sm bg-[var(--addlist-bg)] px-4 text-left text-sm font-semibold text-white ${canAdd ? "hover:bg-[var(--button-hover-bg)]" : "pointer-events-none cursor-not-allowed opacity-60"}`}
          onClick={() => canAdd && setOpen(true)}
          disabled={!canAdd}
        >
          <Plus className="mr-2 inline" size={16} />
          リストを追加
        </button>
        {!canAdd && (
          <p className="mt-1 text-xs text-amber-600">
            このボードのリスト上限（{QUOTA.MAX_LISTS_PER_BOARD}
            ）に達しています。
            <br />
            不要なリストを削除してから作成してください。
          </p>
        )}
      </>
    );
  }

  return (
    <div className="w-[272px] min-w-[272px] shrink-0 rounded-sm border border-slate-300 bg-white p-3 shadow-sm">
      <Input
        autoFocus
        placeholder="リスト名"
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
