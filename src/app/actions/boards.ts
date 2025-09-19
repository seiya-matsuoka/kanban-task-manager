"use server";

import { z } from "zod";

const CreateBoard = z.object({
  title: z.string().min(1),
});

export type CreateBoardInput = z.infer<typeof CreateBoard>;

export async function createBoard(input: CreateBoardInput) {
  const data = CreateBoard.parse(input);
  // TODO: Prisma で DB へ
  return { ok: true as const, id: crypto.randomUUID(), ...data };
}
