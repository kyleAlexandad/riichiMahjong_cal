/** Tile id: 1m-9m, 1p-9p, 1s-9s, 1z-7z (honors: ton nan sha pe haku hatsu chun) */
export type TileId = string;

/** 1z=east, 2z=south, 3z=west, 4z=north, 5z=white, 6z=green, 7z=red (chun) */
export const HONOR_NAMES = {
  "1z": "east",
  "2z": "south",
  "3z": "west",
  "4z": "north",
  "5z": "white",
  "6z": "green",
  "7z": "chun",
} as const;

export const SUITS = ["m", "p", "s"] as const;
export type Suit = (typeof SUITS)[number];

export function isHonor(tile: TileId): boolean {
  return tile.endsWith("z");
}

export function isRedFive(tile: TileId, aka: boolean): boolean {
  if (!aka) return false;
  return tile === "5m" || tile === "5p" || tile === "5s";
}

/** All 34 standard tiles */
export const ALL_TILES: TileId[] = (() => {
  const t: TileId[] = [];
  for (const s of SUITS) for (let n = 1; n <= 9; n++) t.push(`${n}${s}`);
  for (let n = 1; n <= 7; n++) t.push(`${n}z`);
  return t;
})();

/**
 * A tile instance in the hand: base id + open (sideways) = called meld
 */
export interface PlacedTile {
  id: string;
  /** Normalized tile code e.g. 1m */
  tile: TileId;
  /** true = one rotation (portrait → landscape) for open meld */
  open: boolean;
  /** 赤5 (only meaningful for 5m/5p/5s) */
  isAka?: boolean;
  /** This tile is the winning tile (agari) */
  winning: boolean;
}

export function makeTileId(): string {
  return `t_${Math.random().toString(36).slice(2, 11)}`;
}
