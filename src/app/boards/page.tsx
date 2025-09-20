import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type BoardListItem = { id: string; title: string; createdAt: Date };

export default async function BoardsPage() {
  const boards: BoardListItem[] = await prisma.board.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, createdAt: true },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">ボード一覧</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {boards.map((b) => (
          <Link key={b.id} href={`/boards/${b.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>{b.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  作成: {new Date(b.createdAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
