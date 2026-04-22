/**
 * 和了形判定: 国士、七对、一般形（面子 + 雀头）
 * index: 0-8m,9-17p,18-26s,27-33z
 */
const KOKUSHI: number[] = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];

export function isKokushi(c: number[]): boolean {
  if (c.length !== 34) return false;
  let nPair = 0;
  for (const i of KOKUSHI) {
    if (c[i]! > 2) return false;
    if (c[i] === 2) nPair++;
  }
  for (let j = 0; j < 34; j++) {
    if (!KOKUSHI.includes(j) && c[j]! > 0) return false;
  }
  if (nPair !== 1) return false;
  let s = 0;
  for (let j = 0; j < 34; j++) s += c[j]!;
  return s === 14;
}

export function isChitoi(c: number[]): boolean {
  if (c.length !== 34) return false;
  let p = 0;
  for (let i = 0; i < 34; i++) {
    const v = c[i]!;
    if (v === 0) continue;
    if (v !== 2) return false;
    p++;
  }
  return p === 7;
}

/** 是否荣和型（一般形） */
export function isStandard(c: number[]): boolean {
  if (c.length !== 34) return false;
  for (let p = 0; p < 34; p++) {
    if (c[p]! < 2) continue;
    const t = c.slice();
    t[p]! -= 2;
    if (scan4(t, 0)) return true;
  }
  return false;
}

function scan4(t: number[], depth: number): boolean {
  let i = 0;
  while (i < 34 && t[i]! === 0) i++;
  if (i >= 34) return depth === 4;

  if (i >= 27) {
    if (t[i]! >= 3) {
      const u = t.slice();
      u[i]! -= 3;
      if (scan4(u, depth + 1)) return true;
    }
    if (t[i]! >= 4) {
      const u = t.slice();
      u[i]! -= 4;
      if (scan4(u, depth + 1)) return true;
    }
    return false;
  }
  if (t[i]! >= 3) {
    const u = t.slice();
    u[i]! -= 3;
    if (scan4(u, depth + 1)) return true;
  }
  if (t[i]! >= 4) {
    const u = t.slice();
    u[i]! -= 4;
    if (scan4(u, depth + 1)) return true;
  }
  const o = i % 9;
  if (o <= 6 && t[i]! >= 1 && t[i + 1]! >= 1 && t[i + 2]! >= 1) {
    const u = t.slice();
    u[i]!--;
    u[i + 1]!--;
    u[i + 2]!--;
    if (scan4(u, depth + 1)) return true;
  }
  return false;
}

export function isAgari14(c: number[]): boolean {
  let s = 0;
  for (let j = 0; j < 34; j++) s += c[j]!;
  if (s !== 14) return false;
  if (isKokushi(c)) return true;
  if (isChitoi(c)) return true;
  if (isStandard(c)) return true;
  return false;
}

export type MeldT = "pon" | "kan" | "seq";

export interface MPart {
  t: MeldT;
  /** 起点 index, 对碰槓/顺子 左起 */
  i: number;
}

/** 国士/七对 用 null；一般形返回一组解（用于役番） */
export function decomposeToMelds(
  c: number[]
): { kind: "kokushi" | "chitoi" | "std"; parts: MPart[]; pairIndex: number } | null {
  if (c.length !== 34) return null;
  let s = 0;
  for (let j = 0; j < 34; j++) s += c[j]!;
  if (s !== 14) return null;

  if (isKokushi(c)) {
    for (let p = 0; p < 34; p++) {
      if (c[p]! === 2) return { kind: "kokushi", parts: [], pairIndex: p };
    }
    return { kind: "kokushi", parts: [], pairIndex: -1 };
  }
  if (isChitoi(c)) {
    for (let p = 0; p < 34; p++) {
      if (c[p]! === 2) return { kind: "chitoi", parts: [], pairIndex: p };
    }
  }

  for (let p = 0; p < 34; p++) {
    if (c[p]! < 2) continue;
    const t0 = c.slice();
    t0[p]! -= 2;
    const m: MPart[] = [];
    if (fillMelds(t0, m, 0) && m.length === 4) {
      return { kind: "std", parts: m, pairIndex: p };
    }
  }
  return null;
}

/**
 * 一般形：枚举所有 4 面子分解（和了取最大符用）。去重以 pair+parts 规范串。
 */
export function enumerateAllStdDecompositions(
  c: number[]
): { parts: MPart[]; pairIndex: number }[] {
  if (c.length !== 34) return [];
  let s = 0;
  for (let j = 0; j < 34; j++) s += c[j]!;
  if (s !== 14) return [];

  const out: { parts: MPart[]; pairIndex: number }[] = [];
  const seen = new Set<string>();
  for (let p = 0; p < 34; p++) {
    if (c[p]! < 2) continue;
    const t0 = c.slice();
    t0[p]! -= 2;
    const acc: MPart[][] = [];
    const cur: MPart[] = [];
    fillMeldsAll(t0, cur, 0, acc);
    for (const parts of acc) {
      if (parts.length !== 4) continue;
      const key = `${p}:` + parts.map(meldKey).join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ parts: parts.slice(), pairIndex: p });
    }
  }
  return out;
}

function meldKey(m: MPart): string {
  return m.t + ":" + m.i;
}

function fillMelds(t: number[], out: MPart[], depth: number): boolean {
  let i = 0;
  while (i < 34 && t[i]! === 0) i++;
  if (i >= 34) return depth === 4;
  if (i >= 27) {
    if (t[i]! >= 3) {
      const u = t.slice();
      u[i]! -= 3;
      out.push({ t: "pon", i });
      if (fillMelds(u, out, depth + 1)) return true;
      out.pop();
    }
    if (t[i]! >= 4) {
      const u = t.slice();
      u[i]! -= 4;
      out.push({ t: "kan", i });
      if (fillMelds(u, out, depth + 1)) return true;
      out.pop();
    }
    return false;
  }
  if (t[i]! >= 3) {
    const u = t.slice();
    u[i]! -= 3;
    out.push({ t: "pon", i });
    if (fillMelds(u, out, depth + 1)) return true;
    out.pop();
  }
  if (t[i]! >= 4) {
    const u = t.slice();
    u[i]! -= 4;
    out.push({ t: "kan", i });
    if (fillMelds(u, out, depth + 1)) return true;
    out.pop();
  }
  const o = i % 9;
  if (o <= 6 && t[i]! >= 1 && t[i + 1]! >= 1 && t[i + 2]! >= 1) {
    const u = t.slice();
    u[i]!--;
    u[i + 1]!--;
    u[i + 2]!--;
    out.push({ t: "seq", i });
    if (fillMelds(u, out, depth + 1)) return true;
    out.pop();
  }
  return false;
}

/** 枚举本 branch 上所有 4 面子解 */
function fillMeldsAll(
  t: number[],
  cur: MPart[],
  depth: number,
  out: MPart[][]
): void {
  let i = 0;
  while (i < 34 && t[i]! === 0) i++;
  if (i >= 34) {
    if (depth === 4) out.push(cur.slice());
    return;
  }
  if (i >= 27) {
    if (t[i]! >= 3) {
      const u = t.slice();
      u[i]! -= 3;
      cur.push({ t: "pon", i });
      fillMeldsAll(u, cur, depth + 1, out);
      cur.pop();
    }
    if (t[i]! >= 4) {
      const u = t.slice();
      u[i]! -= 4;
      cur.push({ t: "kan", i });
      fillMeldsAll(u, cur, depth + 1, out);
      cur.pop();
    }
    return;
  }
  if (t[i]! >= 3) {
    const u = t.slice();
    u[i]! -= 3;
    cur.push({ t: "pon", i });
    fillMeldsAll(u, cur, depth + 1, out);
    cur.pop();
  }
  if (t[i]! >= 4) {
    const u = t.slice();
    u[i]! -= 4;
    cur.push({ t: "kan", i });
    fillMeldsAll(u, cur, depth + 1, out);
    cur.pop();
  }
  const o = i % 9;
  if (o <= 6 && t[i]! >= 1 && t[i + 1]! >= 1 && t[i + 2]! >= 1) {
    const u = t.slice();
    u[i]!--;
    u[i + 1]!--;
    u[i + 2]!--;
    cur.push({ t: "seq", i });
    fillMeldsAll(u, cur, depth + 1, out);
    cur.pop();
  }
}

/** 国士 可听 13 面: 1 2 + 12 1（无法从结果区分 单倍/双倍, 不自动倍役） */
export function isKokushi13(c: number[]): boolean {
  if (!isKokushi(c)) return false;
  let d = 0;
  for (const i of KOKUSHI) {
    if (c[i]! === 2) d++;
  }
  return d === 1;
}
