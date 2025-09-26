"use client";

import { useState } from "react";
import { createCard } from "@/lib/actions-bridge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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

  async function onSubmit() {
    const t = title.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      const res = await createCard({ boardId, listId, title: t });
      if (res?.ok === false) throw new Error(String(res.error ?? "failed"));
      // 成功後はフルリロード
      window.location.reload();
    } catch (e) {
      console.error("[AddCardRow] createCard failed:", e);
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100/70"
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-2 inline" size={16} />
        カードを追加
      </button>
    );
  }

  return (
    <div className="mt-1 w-full rounded-lg bg-white/90 p-2 shadow-sm">
      <Input
        autoFocus
        placeholder="Card title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
          if (e.key === "Escape") setOpen(false);
        }}
        className="mb-2"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={onSubmit} disabled={!title.trim() || busy}>
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
