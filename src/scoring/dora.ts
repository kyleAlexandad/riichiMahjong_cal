import type { PlacedTile, TileId } from "../types/tiles";

/** Dora from a dora indicator: next tile in same suit (z: 1→2…7→1) */
export function nextDoraTile(indicator: TileId): TileId {
  if (indicator.endsWith("m") || indicator.endsWith("p") || indicator.endsWith("s")) {
    const n = parseInt(indicator[0]!, 10);
    const s = indicator[1]!;
    const next = n >= 9 ? 1 : n + 1;
    return `${next}${s}` as TileId;
  }
  // honors
  const z = parseInt(indicator[0]!, 10);
  const nextZ = z >= 7 ? 1 : z + 1;
  return `${nextZ}z` as TileId;
}

export function countDoraMatches(
  hand: PlacedTile[],
  doraIndicators: TileId[],
  uraIndicators: TileId[]
): { dora: number; ura: number; aka: number } {
  const handIds = hand.map((p) => p.tile);
  let dora = 0;
  for (const ind of doraIndicators) {
    const target = nextDoraTile(ind);
    dora += handIds.filter((t) => t === target).length;
  }
  let ura = 0;
  for (const ind of uraIndicators) {
    const target = nextDoraTile(ind);
    ura += handIds.filter((t) => t === target).length;
  }
  const aka = hand.filter(
    (p) => p.isAka && (p.tile === "5m" || p.tile === "5p" || p.tile === "5s")
  ).length;
  return { dora, ura, aka };
}

/** 手に副露(横置き)が1枚でもあれば喰い手 */
export function isOpenHand(hand: PlacedTile[]): boolean {
  return hand.some((p) => p.open);
}
