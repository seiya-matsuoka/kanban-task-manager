"use server";

// import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

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

export async function updateBoardTitle(input: {
  boardId: string;
  title: string;
}) {
  try {
    const title = (input?.title ?? "").trim();
    if (!title) throw new Error("タイトルを入力してください");
    const updated = await prisma.board.update({
      where: { id: input.boardId },
      data: { title },
      select: { id: true, title: true },
    });
    revalidatePath("/boards");
    revalidatePath(`/boards/${input.boardId}`);
    return { ok: true, value: updated } as const;
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    } as const;
  }
}

export async function deleteBoard(input: { boardId: string }) {
  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const lists = await tx.list.findMany({
        where: { boardId: input.boardId },
        select: { id: true },
      });
      const listIds = lists.map((l: { id: string }) => l.id);
      if (listIds.length > 0) {
        await tx.card.deleteMany({ where: { listId: { in: listIds } } });
      }
      await tx.list.deleteMany({ where: { boardId: input.boardId } });
      await tx.board.delete({ where: { id: input.boardId } });
    });

    revalidatePath("/boards");
    return { ok: true, value: { id: input.boardId } } as const;
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    } as const;
  }
}

export async function reorderBoard(input: {
  boardId: string;
  prev?: number | null;
  next?: number | null;
}) {
  try {
    const position = mid(input.prev ?? null, input.next ?? null);
    const updated = await prisma.board.update({
      where: { id: input.boardId },
      data: { position },
      select: { id: true, position: true },
    });
    revalidatePath("/boards");
    return { ok: true, value: updated } as const;
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    } as const;
  }
}
