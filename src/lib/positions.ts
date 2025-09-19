import type { Position } from "@/types/domain";

export const GAP: Position = 1024;

export function computeNewPosition(prev?: Position, next?: Position): Position {
  if (prev == null && next == null) return GAP;
  if (prev == null) return Math.floor((0 + next!) / 2) || Math.floor(next! / 2);
  if (next == null) return prev + GAP;
  const mid = Math.floor((prev + next) / 2);
  if (mid === prev || mid === next) return prev + 1;
  return mid;
}

export function normalizeSequential<T extends { position: Position }>(
  items: T[],
): T[] {
  return items
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((item, i) => ({ ...item, position: (i + 1) * GAP }));
}
