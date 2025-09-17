// app/boards/[id]/page.tsx
import { notFound } from "next/navigation";
import { boardRepo, listRepo, cardRepo } from "@/lib/repo";

export default async function BoardPage({
  params,
}: {
  params: { id: string };
}) {
  const board = await boardRepo.getBoard(params.id);
  if (!board) return notFound();
  const lists = await listRepo.listByBoard(board.id);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{board.title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {await Promise.all(
          lists.map(async (l) => {
            const cards = await cardRepo.listByList(l.id);
            return (
              <div key={l.id} className="w-64 min-w-[260px] shrink-0">
                <div className="rounded-2xl border bg-card">
                  <div className="border-b px-4 py-3 font-medium">
                    {l.title}
                  </div>
                  <div className="space-y-3 p-3">
                    {cards.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-xl border bg-background p-3 text-sm"
                      >
                        <div className="font-medium">{c.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
