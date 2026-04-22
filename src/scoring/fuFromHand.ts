import type { PlacedTile } from "../types/tiles";
import { toIndex } from "./tileIndex";
import {
  enumerateAllStdDecompositions,
  isAgari14,
  isChitoi,
  isKokushi,
  type MPart,
} from "./agari";

function ceilFu10(n: number): number {
  return Math.ceil(n / 10) * 10;
}

function countV(h: PlacedTile[]): number[] {
  const c = new Array(34).fill(0) as number[];
  for (const p of h) c[toIndex(p.tile)]++;
  return c;
}

function isYaochuuIndex(i: number): boolean {
  if (i >= 27) return true;
  const o = i % 9;
  return o === 0 || o === 8;
}

/**
 * 雀头符：自风+2、场风+2、白绿发+2 各计；自风+场风同位则 +4
 */
function pairYakuhaiFu(
  pIdx: number,
  roundWind: number,
  seatWind: number
): { total: number; lines: { key: string; v: number }[] } {
  const lines: { key: string; v: number }[] = [];
  if (pIdx < 27) {
    return { total: 0, lines: [] };
  }
  if (pIdx >= 31) {
    if (pIdx === 31) lines.push({ key: "fu.pair.haku", v: 2 });
    else if (pIdx === 32) lines.push({ key: "fu.pair.hatsu", v: 2 });
    else lines.push({ key: "fu.pair.chun", v: 2 });
    return { total: 2, lines };
  }
  const w = pIdx - 27;
  if (w === roundWind && w === seatWind) {
    return { total: 4, lines: [{ key: "fu.pair.doubleWind", v: 4 }] };
  }
  let t = 0;
  if (w === roundWind) {
    lines.push({ key: "fu.pair.round", v: 2 });
    t += 2;
  }
  if (w === seatWind) {
    lines.push({ key: "fu.pair.seat", v: 2 });
    t += 2;
  }
  return { total: t, lines };
}

/** 平和に使う「役牌雀头」: 2 符が付く非平和対子 */
function pairGivesPinfuBlock(pIdx: number, roundWind: number, seatWind: number): boolean {
  return pairYakuhaiFu(pIdx, roundWind, seatWind).total > 0;
}

function minkoOrMinkan(
  hand: PlacedTile[],
  part: MPart,
  isTsumo: boolean,
  winIdx: number | undefined
): boolean {
  if (part.t === "seq") return false;
  const i = part.i;
  if (hand.some((x) => toIndex(x.tile) === i && x.open)) return true;
  if (!isTsumo && winIdx !== undefined && winIdx === i) return true;
  return false;
}

function mentsuFu(
  hand: PlacedTile[],
  part: MPart,
  isTsumo: boolean,
  winIdx: number | undefined
): { fu: number; key: string } {
  if (part.t === "seq") return { fu: 0, key: "fu.shuntsu" };
  const y = isYaochuuIndex(part.i);
  const op = minkoOrMinkan(hand, part, isTsumo, winIdx);
  if (part.t === "pon") {
    if (op) {
      return y
        ? { fu: 4, key: "fu.kotsu.openYao" }
        : { fu: 2, key: "fu.kotsu.openSimple" };
    }
    return y
      ? { fu: 8, key: "fu.kotsu.closedYao" }
      : { fu: 4, key: "fu.kotsu.closedSimple" };
  }
  if (part.t === "kan") {
    if (op) {
      return y
        ? { fu: 16, key: "fu.kan.openYao" }
        : { fu: 8, key: "fu.kan.openSimple" };
    }
    return y
      ? { fu: 32, key: "fu.kan.closedYao" }
      : { fu: 16, key: "fu.kan.closedSimple" };
  }
  return { fu: 0, key: "fu.unknown" };
}

/** 0=両面, 1=辺/嵌等 +2, 2=単 +2, 3=双碰 +0 (平和の両面判定は 0 のみ) */
type MachiKind = 0 | 1 | 2 | 3;

function classifyMachi(
  winIdx: number,
  pIdx: number,
  parts: MPart[]
): MachiKind {
  if (winIdx === pIdx) return 2;
  for (const m of parts) {
    if (m.t === "pon" && m.i === winIdx) return 3;
    if (m.t === "kan" && m.i === winIdx) return 3;
  }
  for (const m of parts) {
    if (m.t !== "seq") continue;
    const a = m.i;
    if (winIdx < a || winIdx > a + 2) continue;
    const o = a % 9;
    if (o === 0) {
      if (winIdx === a || winIdx === a + 1 || winIdx === a + 2) return 1;
    } else if (o === 6) {
      if (winIdx === a || winIdx === a + 1 || winIdx === a + 2) return 1;
    } else {
      if (winIdx === a + 1) return 1;
    }
    return 0;
  }
  return 0;
}

function isRyanmenMachi(
  winIdx: number,
  pIdx: number,
  parts: MPart[]
): boolean {
  return classifyMachi(winIdx, pIdx, parts) === 0;
}

function waitFuAdd(
  winIdx: number,
  pIdx: number,
  parts: MPart[]
): { add: number; key: string } {
  const k = classifyMachi(winIdx, pIdx, parts);
  if (k === 0) return { add: 0, key: "fu.wait.ryanmen" };
  if (k === 3) return { add: 0, key: "fu.wait.shanpon" };
  if (k === 2) return { add: 2, key: "fu.wait.tanki" };
  return { add: 2, key: "fu.wait.penchanKanchan" };
}

function winIndex(hand: PlacedTile[]): number | undefined {
  const w = hand.find((p) => p.winning);
  if (w) return toIndex(w.tile);
  return undefined;
}

function structuralPinfu(
  parts: MPart[],
  pIdx: number,
  winIdx: number | undefined
): boolean {
  if (parts.length !== 4 || !parts.every((m) => m.t === "seq")) return false;
  if (winIdx === undefined) return false;
  return isRyanmenMachi(winIdx, pIdx, parts);
}

export type FuLine = { key: string; v: number };

export interface FuResult {
  fu: number;
  totalUnrounded: number;
  breakdown: FuLine[];
}

const DEFAULT: FuResult = {
  fu: 30,
  totalUnrounded: 30,
  breakdown: [{ key: "fu.default", v: 30 }],
};

/** 将来 M-League / ルール分岐用に拡張可 */
export type FuHandOptions = {
  isTsumo: boolean;
  isOpen: boolean;
  /** 0=東 1=南 2=西 3=北 (場風) */
  roundWind: number;
  /** 0=東 … 3=北 (自風) */
  seatWind: number;
};

/**
 * 立直 符：雀魂/現代標準
 * 顺序：七对 / 国士 / 平和特例 / 多解は最大符 / 副露型平和(荣) →30
 */
export function computeFuFromHand(
  hand: PlacedTile[],
  opts: FuHandOptions
): FuResult {
  const c = countV(hand);
  if (c.reduce((a, b) => a + b, 0) !== 14 || !isAgari14(c)) {
    return DEFAULT;
  }
  const winIdx = winIndex(hand);

  if (isChitoi(c)) {
    return {
      fu: 25,
      totalUnrounded: 25,
      breakdown: [{ key: "fu.chitoi", v: 25 }],
    };
  }

  if (isKokushi(c)) {
    return computeKokushiFu(c, winIdx, opts);
  }

  const decs = enumerateAllStdDecompositions(c);
  if (decs.length === 0) {
    return DEFAULT;
  }

  for (const dec of decs) {
    if (
      !opts.isOpen &&
      !pairGivesPinfuBlock(dec.pairIndex, opts.roundWind, opts.seatWind) &&
      structuralPinfu(dec.parts, dec.pairIndex, winIdx)
    ) {
      const f = opts.isTsumo ? 20 : 30;
      return {
        fu: f,
        totalUnrounded: f,
        breakdown: [
          {
            key: opts.isTsumo ? "fu.pinfuTsumo" : "fu.pinfuRon",
            v: f,
          },
        ],
      };
    }
  }

  let best: FuResult | null = null;
  for (const dec of decs) {
    const r = generalFu(hand, dec, opts, winIdx);
    if (!best || r.fu > best.fu) best = r;
  }
  if (!best) {
    return DEFAULT;
  }

  if (
    best.fu === 20 &&
    opts.isOpen &&
    !opts.isTsumo &&
    winIdx !== undefined
  ) {
    for (const dec of decs) {
      if (
        !pairGivesPinfuBlock(
          dec.pairIndex,
          opts.roundWind,
          opts.seatWind
        ) &&
        structuralPinfu(dec.parts, dec.pairIndex, winIdx)
      ) {
        return {
          fu: 30,
          totalUnrounded: 20,
          breakdown: [
            ...best.breakdown,
            { key: "fu.openPinfuLike", v: 10 },
          ],
        };
      }
    }
  }

  return best;
}

function computeKokushiFu(
  c: number[],
  winIdx: number | undefined,
  opts: { isTsumo: boolean; isOpen: boolean; roundWind: number; seatWind: number }
): FuResult {
  let pIdx = -1;
  for (let i = 0; i < 34; i++) {
    if (c[i]! === 2) {
      pIdx = i;
      break;
    }
  }
  const br: FuLine[] = [];
  let fu = 20;
  br.push({ key: "fu.base", v: 20 });
  if (opts.isTsumo) {
    fu += 2;
    br.push({ key: "fu.tsumo", v: 2 });
  } else if (!opts.isOpen) {
    fu += 10;
    br.push({ key: "fu.menzenRon", v: 10 });
  }
  if (pIdx >= 0) {
    const pr = pairYakuhaiFu(pIdx, opts.roundWind, opts.seatWind);
    if (pr.total) {
      fu += pr.total;
      br.push(...pr.lines);
    }
    if (winIdx !== undefined && winIdx === pIdx) {
      fu += 2;
      br.push({ key: "fu.wait.tanki", v: 2 });
    }
  }
  const r = Math.max(20, ceilFu10(fu));
  if (r !== fu) {
    br.push({ key: "fu.round", v: r - fu });
  }
  return { fu: r, totalUnrounded: fu, breakdown: br };
}

function generalFu(
  hand: PlacedTile[],
  dec: { parts: MPart[]; pairIndex: number },
  opts: { isTsumo: boolean; isOpen: boolean; roundWind: number; seatWind: number },
  winIdx: number | undefined
): FuResult {
  const pIdx = dec.pairIndex;
  const br: FuLine[] = [];
  let fu = 20;
  br.push({ key: "fu.base", v: 20 });
  if (opts.isTsumo) {
    fu += 2;
    br.push({ key: "fu.tsumo", v: 2 });
  } else if (!opts.isOpen) {
    fu += 10;
    br.push({ key: "fu.menzenRon", v: 10 });
  }
  for (const p of dec.parts) {
    const m = mentsuFu(hand, p, opts.isTsumo, winIdx);
    if (m.fu > 0) {
      fu += m.fu;
      br.push({ key: m.key, v: m.fu });
    }
  }
  const pr = pairYakuhaiFu(pIdx, opts.roundWind, opts.seatWind);
  if (pr.total) {
    fu += pr.total;
    br.push(...pr.lines);
  }
  if (winIdx !== undefined) {
    const w = waitFuAdd(winIdx, pIdx, dec.parts);
    if (w.add) {
      fu += w.add;
      br.push({ key: w.key, v: w.add });
    }
  }
  const u = fu;
  const r = Math.max(20, ceilFu10(fu));
  if (r !== u) {
    br.push({ key: "fu.round", v: r - u });
  }
  return { fu: r, totalUnrounded: u, breakdown: br };
}
