"use server";

import { z } from "zod";

const CreateCard = z.object({
  boardId: z.string(),
  listId: z.string(),
  title: z.string().min(1),
  position: z.number().optional(),
});
export type CreateCardInput = z.infer<typeof CreateCard>;

export async function createCard(input: CreateCardInput) {
  const data = CreateCard.parse(input);
  // TODO: Prisma で DB へ
  return { ok: true as const, id: crypto.randomUUID(), ...data };
}

const ReorderCard = z.object({
  cardId: z.string(),
  toListId: z.string(),
  position: z.number(),
});
export type ReorderCardInput = z.infer<typeof ReorderCard>;

export async function reorderCard(input: ReorderCardInput) {
  ReorderCard.parse(input);
  // TODO: Prisma で DB へ
  return { ok: true as const };
}
