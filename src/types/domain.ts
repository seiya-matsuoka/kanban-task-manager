export type ID = string;
export type Position = number;

export type Card = {
  id: ID;
  boardId: ID;
  listId: ID;
  title: string;
  description?: string;
  position: Position;
  createdAt: string;
  updatedAt: string;
};

export type List = {
  id: ID;
  boardId: ID;
  title: string;
  position: Position;
  createdAt: string;
  updatedAt: string;
};

export type Board = {
  id: ID;
  title: string;
  createdAt: string;
  updatedAt: string;
};
