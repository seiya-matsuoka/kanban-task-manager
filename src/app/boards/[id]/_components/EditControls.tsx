"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { ID } from "@/types/domain";
import {
  deleteList as saDeleteList,
  deleteCard as saDeleteCard,
} from "@/lib/actions-bridge";

function KebabMenu({
  onEdit,
  onDeleteClick,
  "aria-label": ariaLabel,
}: {
  onEdit: () => void;
  onDeleteClick: () => void;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!popRef.current) return;
      if (!popRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label={ariaLabel ?? "メニュー"}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* 3点リーダ */}
        <span className="inline-block text-xl leading-none">⋯</span>
      </Button>

      {open && (
        <div
          ref={popRef}
          className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-md border border-slate-200 bg-white/95 text-slate-800 shadow-lg backdrop-blur"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-slate-100"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            名前を編集
          </button>
          <button
            className="block w-full cursor-pointer px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            onClick={() => {
              setOpen(false);
              onDeleteClick();
            }}
          >
            削除
          </button>
        </div>
      )}
    </div>
  );
}

export function ListActions({
  listId,
  onStartEdit,
}: {
  listId: ID;
  onStartEdit: () => void;
}) {
  const [confirm, setConfirm] = useState(false);

  return (
    <>
      <KebabMenu
        onEdit={onStartEdit}
        onDeleteClick={() => setConfirm(true)}
        aria-label="リストのメニュー"
      />
      <Dialog open={confirm} onOpenChange={setConfirm}>
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
            <Button variant="outline" onClick={() => setConfirm(false)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await saDeleteList({ listId: String(listId) });
                // 成功後はフルリロード
                if (typeof window !== "undefined") window.location.reload();
              }}
            >
              削除する
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CardActions({
  cardId,
  onStartEdit,
}: {
  cardId: ID;
  onStartEdit: () => void;
}) {
  const [confirm, setConfirm] = useState(false);

  return (
    <>
      <KebabMenu
        onEdit={onStartEdit}
        onDeleteClick={() => setConfirm(true)}
        aria-label="カードのメニュー"
      />
      <Dialog open={confirm} onOpenChange={setConfirm}>
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
            <Button variant="outline" onClick={() => setConfirm(false)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await saDeleteCard({ cardId: String(cardId) });
                if (typeof window !== "undefined") window.location.reload();
              }}
            >
              削除する
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
