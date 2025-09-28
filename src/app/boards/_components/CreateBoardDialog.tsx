"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createBoard } from "@/app/actions/boards";
import { Plus } from "lucide-react";

function unwrapResult<T>(res: any): T {
  if (res?.ok === false) {
    const msg =
      typeof res?.error === "string"
        ? res.error
        : JSON.stringify(res?.error ?? "Unknown error");
    throw new Error(msg);
  }
  return (res?.value ?? res?.data ?? res) as T;
}

export default function CreateBoardDialog() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  const onCreate = () => {
    const name = title.trim();
    if (!name) return;
    startTransition(async () => {
      try {
        const res = await createBoard({ title: name });
        const board = unwrapResult<{ id: string }>(res);
        toast({ title: "ボードを作成しました" });
        setOpen(false);
        setTitle("");
        router.push(`/boards/${board.id}`);
      } catch (e) {
        toast({
          title: "作成に失敗しました",
          description: e instanceof Error ? e.message : String(e),
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-[140px] min-w-[140px] shrink-0 items-center rounded-sm border bg-[var(--addlist-bg)] text-white hover:bg-white/20">
          <Plus className="" size={16} />
          新規ボード
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新しいボード</DialogTitle>
          <DialogDescription className="sr-only">
            ボードのタイトルを入力して作成します。
          </DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          placeholder="ボード名を入力"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isPending}
        />
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            キャンセル
          </Button>
          <Button onClick={onCreate} disabled={isPending || !title.trim()}>
            作成
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
