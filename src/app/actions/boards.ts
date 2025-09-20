"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type Result<T> = { ok: true; data: T } | { ok: false; error: unknown };

const createBoardSchema = z.object({ title: z.string().min(1).max(100) });

export async function createBoard(
  arg: string | { title: string },
): Promise<Result<any>> {
  const title = typeof arg === "string" ? arg : arg.title;

  const parsed = createBoardSchema.safeParse({ title });
  if (!parsed.success) return { ok: false, error: parsed.error.format() };

  const board = await prisma.board.create({
    data: { title: parsed.data.title },
  });
  revalidatePath("/boards");
  return { ok: true, data: board };
}

export async function getBoards(): Promise<Result<any>> {
  const boards = await prisma.board.findMany({
    orderBy: { createdAt: "desc" },
  });
  return { ok: true, data: boards };
}

export async function getBoard(boardId: string): Promise<Result<any>> {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return { ok: false, error: "NOT_FOUND" };
  return { ok: true, data: board };
}
