"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type Result<T> = { ok: true; data: T } | { ok: false; error: unknown };
const GAP = 1024;

const createCardSchema = z.object({
  boardId: z.string().min(1),
  listId: z.string().min(1),
  title: z.string().min(1).max(200),
  position: z.number().int().optional(),
});

export async function createCard(
  a:
    | { boardId: string; listId: string; title: string; position?: number }
    | string,
  b?: string,
  c?: string,
  d?: number,
): Promise<Result<any>> {
  const payload =
    typeof a === "string"
      ? { boardId: a, listId: b!, title: c!, position: d }
      : a;

  const parsed = createCardSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.format() };

  const last = await prisma.card.findFirst({
    where: { listId: parsed.data.listId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const pos = parsed.data.position ?? (last?.position ?? 0) + GAP;

  const card = await prisma.card.create({
    data: {
      listId: parsed.data.listId,
      title: parsed.data.title,
      position: pos,
    },
    select: {
      id: true,
      listId: true,
      title: true,
      position: true,
      updatedAt: true,
    },
  });
  revalidatePath(`/boards/${parsed.data.boardId}`);
  return { ok: true, data: card };
}

const reorderCardSchema = z.object({
  cardId: z.string().min(1),
  toListId: z.string().min(1),
  position: z.number().int(),
});

export async function reorderCard(
  cardId: string,
  toListId: string,
  position: number,
): Promise<Result<any>> {
  const parsed = reorderCardSchema.safeParse({ cardId, toListId, position });
  if (!parsed.success) return { ok: false, error: parsed.error.format() };

  const updated = await prisma.card.update({
    where: { id: parsed.data.cardId },
    data: { listId: parsed.data.toListId, position: parsed.data.position },
    select: { id: true, listId: true },
  });

  const l = await prisma.list.findUnique({
    where: { id: updated.listId },
    select: { boardId: true },
  });
  if (l?.boardId) revalidatePath(`/boards/${l.boardId}`);
  return { ok: true, data: updated };
}

const updateCardSchema = z.object({
  cardId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
});

export async function updateCard(
  cardId: string,
  title: string,
  description?: string,
): Promise<Result<any>> {
  const parsed = updateCardSchema.safeParse({ cardId, title, description });
  if (!parsed.success) return { ok: false, error: parsed.error.format() };

  const updated = await prisma.card.update({
    where: { id: parsed.data.cardId },
    data: { title: parsed.data.title, description: parsed.data.description },
    select: { id: true, listId: true, title: true },
  });
  const l = await prisma.card.findUnique({
    where: { id: updated.id },
    select: { listId: true },
  });
  const b = l
    ? await prisma.list.findUnique({
        where: { id: l.listId },
        select: { boardId: true },
      })
    : null;
  if (b?.boardId) revalidatePath(`/boards/${b.boardId}`);
  return { ok: true, data: updated };
}

const deleteCardSchema = z.object({
  cardId: z.string().min(1),
});

export async function deleteCard(cardId: string): Promise<Result<any>> {
  const parsed = deleteCardSchema.safeParse({ cardId });
  if (!parsed.success) return { ok: false, error: parsed.error.format() };

  const c = await prisma.card.findUnique({
    where: { id: parsed.data.cardId },
    select: { listId: true },
  });
  await prisma.card.delete({ where: { id: parsed.data.cardId } });
  if (c?.listId) {
    const l = await prisma.list.findUnique({
      where: { id: c.listId },
      select: { boardId: true },
    });
    if (l?.boardId) revalidatePath(`/boards/${l.boardId}`);
  }
  return { ok: true, data: { id: parsed.data.cardId } };
}
