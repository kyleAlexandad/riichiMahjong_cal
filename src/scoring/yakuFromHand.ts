import type { PlacedTile } from "../types/tiles";
import { toIndex } from "./tileIndex";
import { decomposeToMelds, isAgari14, isChitoi, isKokushi, type MPart } from "./agari";

export interface DetectedYaku {
  id: string;
  i18nKey: string;
  han: number;
}

export interface YakuFromHandResult {
  ok: boolean;
  reasonKey?: "result.need14" | "result.notAgari";
  yaku: DetectedYaku[];
  yakuHan: number;
  suggestedFu: number;
}

const RYUI = new Set([19, 20, 21, 23, 25, 32]);

function countV(h: PlacedTile[]): number[] {
  const c = new Array(34).fill(0) as number[];
  for (const p of h) c[toIndex(p.tile)]++;
  return c;
}

function flags(c: number[]) {
  return {
    m: c.slice(0, 9).some((v) => v > 0),
    p: c.slice(9, 18).some((v) => v > 0),
    s: c.slice(18, 27).some((v) => v > 0),
    z: c.slice(27, 34).some((v) => v > 0),
  };
}

function tanyao(c: number[], fl: ReturnType<typeof flags>): boolean {
  if (fl.z) return false;
  for (let i = 0; i < 27; i++) {
    if (c[i]! === 0) continue;
    const o = i % 9;
    if (o === 0 || o === 8) return false;
  }
  return true;
}

function ryuIisou(c: number[]): boolean {
  for (let i = 0; i < 34; i++) {
    if (c[i]! > 0 && !RYUI.has(i)) return false;
  }
  return c.reduce((a, b) => a + b, 0) > 0;
}

function isTsuiIisou(fl: ReturnType<typeof flags>): boolean {
  return fl.z && !fl.m && !fl.p && !fl.s;
}

function ipeikouN(parts: MPart[]): number {
  const seq = parts.filter((p) => p.t === "seq");
  const m = new Map<string, number>();
  for (const p of seq) m.set(String(p.i), (m.get(String(p.i)) ?? 0) + 1);
  let t = 0;
  for (const v of m.values()) t += (v / 2) | 0;
  return t;
}

function ittsuP(parts: MPart[], base: number): boolean {
  return hasSeq(parts, base) && hasSeq(parts, base + 3) && hasSeq(parts, base + 6);
}
function hasSeq(parts: MPart[], i: number): boolean {
  return parts.some((p) => p.t === "seq" && p.i === i);
}
function ittsuAny(parts: MPart[]): boolean {
  return ittsuP(parts, 0) || ittsuP(parts, 9) || ittsuP(parts, 18);
}

function sanShokuDoukou(c: number[]): boolean {
  for (let o = 0; o < 9; o++) {
    if (c[o]! >= 3 && c[9 + o]! >= 3 && c[18 + o]! >= 3) return true;
  }
  return false;
}

function ankoInParts(h: PlacedTile[], parts: MPart[]): number {
  let n = 0;
  for (const p of parts) {
    if (p.t !== "pon" && p.t !== "kan") continue;
    if (!h.some((x) => toIndex(x.tile) === p.i && x.open)) n++;
  }
  return n;
}

function toiToiParts(parts: MPart[]): boolean {
  return parts.length === 4 && parts.every((m) => m.t === "pon" || m.t === "kan");
}

function k(h: number, isOpen: boolean) {
  if (!isOpen) return h;
  return h > 0 ? h - 1 : 0;
}

function ronM(
  y: DetectedYaku[],
  isTsumo: boolean,
  isOpen: boolean
): DetectedYaku[] {
  if (isTsumo || isOpen) return y;
  return y.map((x) => {
    if (x.id === "pn" || x.id === "ip" || x.id === "rpk")
      return { ...x, han: Math.max(0, x.han - 1) };
    return x;
  });
}

function add(y: DetectedYaku[], id: string, key: string, h: number) {
  if (h <= 0) return;
  if (y.some((a) => a.id === id)) return;
  y.push({ id, i18nKey: key, han: h });
}

export function detectYakuFromHand(
  hand: PlacedTile[],
  opts: { isOpen: boolean; isTsumo: boolean; roundWind: number; seatWind: number }
): YakuFromHandResult {
  const c = countV(hand);
  if (c.reduce((a, b) => a + b, 0) !== 14) {
    return { ok: false, reasonKey: "result.need14", yaku: [], yakuHan: 0, suggestedFu: 30 };
  }
  if (!isAgari14(c)) {
    return { ok: false, reasonKey: "result.notAgari", yaku: [], yakuHan: 0, suggestedFu: 30 };
  }
  const { isOpen, isTsumo, roundWind, seatWind } = opts;
  const f = flags(c);
  const y: DetectedYaku[] = [];

  if (isKokushi(c)) {
    return { ok: true, yaku: [{ id: "kok", i18nKey: "yaku.kokushi", han: 13 }], yakuHan: 13, suggestedFu: 30 };
  }

  if (isChitoi(c)) {
    if (isTsuiIisou(f)) {
      y.push({ id: "tui", i18nKey: "yaku.tsuiso", han: 13 });
    } else if (ryuIisou(c)) {
      y.length = 0;
      y.push({ id: "ryu", i18nKey: "yaku.ryuiso", han: 13 });
    } else {
      y.push({ id: "ct", i18nKey: "yaku.chitoi", han: 2 });
      if (tanyao(c, f)) y.push({ id: "tny", i18nKey: "yaku.tanyao", han: k(1, isOpen) });
    }
    const l = ronM(y, isTsumo, isOpen);
    return { ok: true, yaku: l, yakuHan: l.reduce((a, b) => a + b.han, 0), suggestedFu: 25 };
  }

  const dec = decomposeToMelds(c);
  if (!dec || dec.kind !== "std" || !dec.parts.length) {
    return { ok: true, yaku: [], yakuHan: 0, suggestedFu: 30 };
  }
  const parts = dec.parts;
  const pIdx = dec.pairIndex;

  if (c[31]! >= 3 && c[32]! >= 3 && c[33]! >= 3) {
    y.push({ id: "dgn", i18nKey: "yaku.daisangen", han: 13 });
    return { ok: true, yaku: y, yakuHan: 13, suggestedFu: 30 };
  }
  const dTri = [31, 32, 33].filter((d) => c[d]! >= 3).length;
  if (dTri === 2) add(y, "sgs", "yaku.shosangen", 2);
  for (const d of [31, 32, 33] as const) {
    if (c[d]! >= 3) {
      if (d === 31) add(y, "h3", "yaku.haku", 1);
      if (d === 32) add(y, "t3", "yaku.hatsu", 1);
      if (d === 33) add(y, "c3", "yaku.chun", 1);
    }
  }
  for (const w of [0, 1, 2, 3] as const) {
    if (c[27 + w]! >= 3) {
      if (w === roundWind) add(y, "rwx", "yaku.roundwind", 1);
      if (w === seatWind) add(y, "swx", "yaku.selfwind", 1);
    }
  }
  if (c[27]! >= 3 && c[28]! >= 3 && c[29]! >= 3 && c[30]! >= 3) {
    y.length = 0;
    y.push({ id: "dsu", i18nKey: "yaku.daisushi", han: 13 });
    return { ok: true, yaku: y, yakuHan: 13, suggestedFu: 30 };
  }
  const wTri = [0, 1, 2, 3].filter((i) => c[27 + i]! >= 3).length;
  if (wTri === 3) add(y, "sos", "yaku.shosushi", 13);

  if (parts.filter((m) => m.t === "kan").length === 4) {
    y.length = 0;
    y.push({ id: "sk4", i18nKey: "yaku.suukantsu", han: 13 });
    return { ok: true, yaku: y, yakuHan: 13, suggestedFu: 30 };
  }
  if (parts.filter((m) => m.t === "kan").length === 3) add(y, "ak3", "yaku.sankantsu", 2);
  if (toiToiParts(parts)) add(y, "tt", "yaku.toitoiho", 2);

  const ns = (f.m ? 1 : 0) + (f.p ? 1 : 0) + (f.s ? 1 : 0);
  if (ns === 1 && f.z) add(y, "hn", "yaku.honitsu", k(3, isOpen));
  if (ns === 1 && !f.z) add(y, "ch", "yaku.chinitsu", k(6, isOpen));

  if (tanyao(c, f)) add(y, "tn", "yaku.tanyao", k(1, isOpen));
  if (sanShokuDoukou(c)) add(y, "sst", "yaku.sanshokut", 2);
  if (ittsuAny(parts)) add(y, "it", "yaku.ittsu", k(2, isOpen));
  for (const base of [0, 9, 18] as const) {
    if (f.m && base !== 0) continue;
    if (f.p && base !== 9) continue;
    if (f.s && base !== 18) continue;
    if (!f.m && !f.p && !f.s) continue;
    if (
      c[base]! >= 3 &&
      c[base + 8]! >= 3 &&
      c.slice(base + 1, base + 8).every((v) => v! >= 1) &&
      c.slice(base, base + 9).reduce((a, b) => a + b, 0) === 14
    ) {
      y.length = 0;
      y.push({ id: "chr", i18nKey: "yaku.churen", han: 13 });
      return { ok: true, yaku: y, yakuHan: 13, suggestedFu: 30 };
    }
  }

  const ipN = ipeikouN(parts);
  if (ipN >= 2) add(y, "rpk", "yaku.ryanpeko", 3);
  else if (ipN === 1) add(y, "ip", "yaku.ipe", 1);
  if (ankoInParts(hand, parts) >= 3) add(y, "sak", "yaku.sananko", 2);

  const allSeq = parts.length === 4 && parts.every((m) => m.t === "seq");
  const pYH = pIdx >= 27 && (pIdx - 27 === roundWind || pIdx - 27 === seatWind || pIdx >= 31);
  if (allSeq && !isOpen && !pYH) add(y, "pn", "yaku.pinfu", 1);

  for (const d of [31, 32, 33] as const) {
    if (pIdx === d && c[d]! === 2) {
      if (d === 31) add(y, "h2", "yaku.haku", 1);
      if (d === 32) add(y, "a2", "yaku.hatsu", 1);
      if (d === 33) add(y, "u2", "yaku.chun", 1);
    }
  }
  for (const w of [0, 1, 2, 3] as const) {
    if (pIdx === 27 + w && c[27 + w]! === 2) {
      if (w === roundWind) add(y, "r2", "yaku.roundwind", 1);
      if (w === seatWind) add(y, "s2", "yaku.selfwind", 1);
    }
  }

  const l = ronM(y, isTsumo, isOpen);
  const th = l.reduce((a, b) => a + b.han, 0);
  return { ok: true, yaku: l, yakuHan: th, suggestedFu: l.some((x) => x.id === "pn") && isTsumo ? 20 : 30 };
}
