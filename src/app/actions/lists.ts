"use server";

import { z } from "zod";

const CreateList = z.object({
  boardId: z.string(),
  title: z.string().min(1),
  position: z.number().optional(),
});

export type CreateListInput = z.infer<typeof CreateList>;

export async function createList(input: CreateListInput) {
  const data = CreateList.parse(input);
  // TODO: Prisma で DB へ
  return { ok: true as const, id: crypto.randomUUID(), ...data };
}

const ReorderList = z.object({
  listId: z.string(),
  position: z.number(),
});
export type ReorderListInput = z.infer<typeof ReorderList>;

export async function reorderList(input: ReorderListInput) {
  ReorderList.parse(input);
  // TODO: Prisma で DB へ
  return { ok: true as const };
}
