"use server";

export async function createCard(_input: {
  boardId: string;
  listId: string;
  title: string;
  position: number;
}) {
  throw new Error("Not implemented");
}

export async function reorderCard(_input: {
  cardId: string;
  toListId: string;
  position: number;
}) {
  throw new Error("Not implemented");
}
