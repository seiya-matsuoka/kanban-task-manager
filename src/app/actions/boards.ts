"use server";

// import { z } from "zod";
import { prisma } from "@/lib/prisma";

type Result<T> = { ok: true; data: T } | { ok: false; error: unknown };
const GAP = 1024;

// const createBoardSchema = z.object({ title: z.string().min(1).max(100) });

export async function createBoard(input: { title: string }) {
  try {
    const title = (input?.title ?? "").trim();
    if (!title) throw new Error("タイトルを入力してください");

    // 既存最大の position を取得して +GAP
    const max = await prisma.board.aggregate({ _max: { position: true } });
    const position = (max._max.position ?? 0) + GAP;

    const board = await prisma.board.create({
      data: { title, position },
      select: { id: true },
    });

    // 空の List を 1つ
    await prisma.list.create({
      data: { boardId: board.id, title: "New List", position: GAP },
    });

    return { ok: true, value: board } as const;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    } as const;
  }
}

export async function getBoards(): Promise<Result<any>> {
  const boards = await prisma.board.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true, title: true, createdAt: true, position: true },
  });
  return { ok: true, data: boards };
}

export async function getBoard(boardId: string): Promise<Result<any>> {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return { ok: false, error: "NOT_FOUND" };
  return { ok: true, data: board };
}

function mid(prev?: number | null, next?: number | null, gap = 1024) {
  if (prev == null && next == null) return gap;
  if (prev == null && next != null) return Math.floor(next / 2);
  if (prev != null && next == null) return prev + gap;
  const p = prev!,
    n = next!;
  if (n - p <= 1) return p + 1;
  return p + Math.floor((n - p) / 2);
}

export async function reorderBoard(input: {
  activeBoardId: string;
  prev: number | null | undefined;
  next: number | null | undefined;
}) {
  const { activeBoardId, prev, next } = input;
  const position = mid(prev ?? null, next ?? null);

  const updated = await prisma.board.update({
    where: { id: activeBoardId },
    data: { position },
    select: { id: true, position: true },
  });

  if (prev != null && next != null && next - prev <= 1) {
    const all = await prisma.board.findMany({
      orderBy: { position: "asc" },
      select: { id: true },
    });
    for (let i = 0; i < all.length; i++) {
      await prisma.board.update({
        where: { id: all[i].id },
        data: { position: (i + 1) * 1024 },
      });
    }
  }

  return { ok: true, value: updated } as const;
}
