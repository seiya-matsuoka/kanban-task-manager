import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const GAP = 1024;

async function main() {
  const board = await prisma.board.upsert({
    where: { id: "demo-board" },
    update: {},
    create: { id: "demo-board", title: "Demo Board", position: GAP },
  });

  const [todo, doing, done] = await Promise.all([
    prisma.list.upsert({
      where: { id: "list-todo" },
      update: {},
      create: {
        id: "list-todo",
        boardId: board.id,
        title: "Todo",
        position: GAP * 1,
      },
    }),
    prisma.list.upsert({
      where: { id: "list-doing" },
      update: {},
      create: {
        id: "list-doing",
        boardId: board.id,
        title: "Doing",
        position: GAP * 2,
      },
    }),
    prisma.list.upsert({
      where: { id: "list-done" },
      update: {},
      create: {
        id: "list-done",
        boardId: board.id,
        title: "Done",
        position: GAP * 3,
      },
    }),
  ]);

  await prisma.$transaction([
    prisma.card.upsert({
      where: { id: "card-1" },
      update: {},
      create: {
        id: "card-1",
        listId: todo.id,
        title: "Set up project",
        position: GAP * 1,
      },
    }),
    prisma.card.upsert({
      where: { id: "card-2" },
      update: {},
      create: {
        id: "card-2",
        listId: todo.id,
        title: "Design schema",
        position: GAP * 2,
      },
    }),
    prisma.card.upsert({
      where: { id: "card-3" },
      update: {},
      create: {
        id: "card-3",
        listId: doing.id,
        title: "Implement DnD slice",
        position: GAP * 1,
      },
    }),
    prisma.card.upsert({
      where: { id: "card-4" },
      update: {},
      create: {
        id: "card-4",
        listId: done.id,
        title: "Init repo & tooling",
        position: GAP * 1,
      },
    }),
  ]);
}

main().finally(() => prisma.$disconnect());
