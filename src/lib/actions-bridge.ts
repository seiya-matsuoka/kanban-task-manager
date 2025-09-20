"use client";

import { createList as saCreateList } from "@/app/actions/lists";
import { createCard as saCreateCard } from "@/app/actions/cards";

function unwrap<T>(
  res: { ok: true; data: T } | { ok: false; error: unknown },
): T {
  if (!("ok" in res) || !res.ok) {
    throw new Error(
      "Server Action failed: " + JSON.stringify((res as any).error ?? res),
    );
  }
  return (res as any).data as T;
}

export async function createList(input: {
  boardId: string;
  title: string;
  position?: number;
}) {
  const res = await saCreateList(input);
  return unwrap(res);
}

export async function createCard(input: {
  boardId: string;
  listId: string;
  title: string;
  position?: number;
}) {
  const res = await saCreateCard(input);
  return unwrap(res);
}
