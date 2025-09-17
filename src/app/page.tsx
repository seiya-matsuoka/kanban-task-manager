import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Welcome</h2>
      <p>カンバンのボード一覧へ進んでください。</p>
      <Button asChild>
        <Link href="/boards">ボード一覧へ</Link>
      </Button>
    </div>
  );
}
