"use server";

import { createBoard } from "@/app/actions/boards";
import { createList } from "@/app/actions/lists";
import { createCard } from "@/app/actions/cards";

export async function createBoardServer(input: { title: string }) {
  return await createBoard(input);
}

export async function createListServer(input: {
  boardId: string;
  title: string;
  position?: number;
}) {
  return await createList(input);
}

export async function createCardServer(input: {
  boardId: string;
  listId: string;
  title: string;
  position?: number;
}) {
  return await createCard(input);
}
