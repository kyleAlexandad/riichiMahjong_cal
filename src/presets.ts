import type { PlacedTile } from "./types/tiles";
import { makeTileId } from "./types/tiles";

function p(
  tile: string,
  opts: Partial<Pick<PlacedTile, "open" | "isAka" | "winning">> = {}
): PlacedTile {
  return {
    id: makeTileId(),
    tile: tile as PlacedTile["tile"],
    open: opts.open ?? false,
    isAka: opts.isAka,
    winning: opts.winning ?? false,
  };
}

/** 例: 立直・平和形(14) + 指示 1m 宝 (手牌は簡略) */
export const PRESETS: { id: string; i18nKey: string; hand: PlacedTile[] }[] = [
  {
    id: "riichiPinfu",
    i18nKey: "preset.riichiPinfu",
    hand: [
      p("1m"),
      p("2m"),
      p("3m"),
      p("4m"),
      p("5m"),
      p("6m"),
      p("7m"),
      p("8m"),
      p("9m"),
      p("1p"),
      p("1p"),
      p("2p"),
      p("3p"),
      p("4p", { winning: true }),
    ],
  },
  {
    id: "mangan3",
    i18nKey: "preset.mangan3",
    hand: [
      p("1s"),
      p("1s"),
      p("1s"),
      p("2s"),
      p("2s"),
      p("2s"),
      p("3s"),
      p("3s"),
      p("3s"),
      p("4s"),
      p("4s"),
      p("4s"),
      p("5s", { winning: true }),
    ],
  },
];
