"use client";

import { useState } from "react";
import { createList } from "@/lib/actions-bridge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function AddListColumn({ boardId }: { boardId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    const t = title.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      const res = await createList({ boardId, title: t });
      if (res?.ok === false) throw new Error(String(res.error ?? "failed"));
      // 成功後はフルリロード
      window.location.reload();
    } catch (e) {
      console.error("[AddListColumn] createList failed:", e);
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        className="flex h-12 w-[272px] min-w-[272px] shrink-0 items-center rounded-sm bg-slate-100/30 px-4 text-left text-sm text-white hover:bg-slate-100/50"
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-2 inline" size={16} />
        リストを追加
      </button>
    );
  }

  return (
    <div className="w-[272px] min-w-[272px] shrink-0 rounded-sm border border-slate-300 bg-white p-3 shadow-sm">
      <Input
        autoFocus
        placeholder="List title"
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
