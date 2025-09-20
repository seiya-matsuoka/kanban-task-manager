"use client";

import {
  createList as saCreateList,
  reorderList as saReorderList,
  updateList as saUpdateList,
  deleteList as saDeleteList,
} from "@/app/actions/lists";
import {
  createCard as saCreateCard,
  reorderCard as saReorderCard,
  updateCard as saUpdateCard,
  deleteCard as saDeleteCard,
} from "@/app/actions/cards";

function unwrap<T>(
  res: { ok: true; data: T } | { ok: false; error: unknown },
): T {
  if (!("ok" in res) || !res.ok)
    throw new Error(
      "Server Action failed: " + JSON.stringify((res as any).error ?? res),
    );
  return (res as any).data as T;
}

// create
export async function createList(input: {
  boardId: string;
  title: string;
  position?: number;
}) {
  return unwrap(await saCreateList(input));
}
export async function createCard(input: {
  boardId: string;
  listId: string;
  title: string;
  position?: number;
}) {
  return unwrap(await saCreateCard(input));
}

// reorder
export async function reorderList(input: { listId: string; position: number }) {
  return unwrap(await saReorderList(input.listId, input.position));
}
export async function reorderCard(input: {
  cardId: string;
  toListId: string;
  position: number;
}) {
  return unwrap(
    await saReorderCard(input.cardId, input.toListId, input.position),
  );
}

// update
export async function updateList(input: { listId: string; title: string }) {
  return unwrap(await saUpdateList(input.listId, input.title));
}
export async function updateCard(input: {
  cardId: string;
  title: string;
  description?: string;
}) {
  return unwrap(
    await saUpdateCard(input.cardId, input.title, input.description),
  );
}

// delete
export async function deleteList(input: { listId: string }) {
  return unwrap(await saDeleteList(input.listId));
}
export async function deleteCard(input: { cardId: string }) {
  return unwrap(await saDeleteCard(input.cardId));
}
