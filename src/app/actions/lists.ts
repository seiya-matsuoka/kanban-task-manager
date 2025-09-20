"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type Result<T> = { ok: true; data: T } | { ok: false; error: unknown };
const GAP = 1024;

const createListSchema = z.object({
  boardId: z.string().min(1),
  title: z.string().min(1).max(100),
  position: z.number().int().optional(),
});

export async function createList(
  a: { boardId: string; title: string; position?: number } | string,
  b?: string,
  c?: number,
): Promise<Result<any>> {
  const payload =
    typeof a === "string" ? { boardId: a, title: b!, position: c } : a;

  const parsed = createListSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.format() };

  const last = await prisma.list.findFirst({
    where: { boardId: parsed.data.boardId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const pos = parsed.data.position ?? (last?.position ?? 0) + GAP;

  const list = await prisma.list.create({
    data: {
      boardId: parsed.data.boardId,
      title: parsed.data.title,
      position: pos,
    },
  });
  revalidatePath(`/boards/${parsed.data.boardId}`);
  return { ok: true, data: list };
}

const reorderListSchema = z.object({
  listId: z.string().min(1),
  position: z.number().int(),
});

export async function reorderList(
  listId: string,
  position: number,
): Promise<Result<any>> {
  const parsed = reorderListSchema.safeParse({ listId, position });
  if (!parsed.success) return { ok: false, error: parsed.error.format() };

  const updated = await prisma.list.update({
    where: { id: parsed.data.listId },
    data: { position: parsed.data.position },
  });
  const b = await prisma.list.findUnique({
    where: { id: parsed.data.listId },
    select: { boardId: true },
  });
  if (b?.boardId) revalidatePath(`/boards/${b.boardId}`);
  return { ok: true, data: updated };
}
