import type { TileId } from "../types/tiles";

/** 0-8 m, 9-17 p, 18-26 s, 27-33 z(1-7) */
export function toIndex(t: TileId): number {
  const n = parseInt(t[0]!, 10);
  const s = t[1]!;
  if (s === "m") return n - 1;
  if (s === "p") return 8 + n;
  if (s === "s") return 17 + n;
  return 26 + n; // z
}

export function fromIndex(i: number): TileId {
  if (i < 9) return `${i + 1}m` as TileId;
  if (i < 18) return `${i - 8}p` as TileId;
  if (i < 27) return `${i - 17}s` as TileId;
  return `${i - 26}z` as TileId;
}
