/**
 * Riichi 4-player point calculation (competition / M-League / Mahjong Soul style).
 *
 * - Non-limit: base = fu × 2^(飜+2) (飜+2 指数).
 * - 子ロン(三家・責任者1人): 払 = 合計 = ceiling100( base × 4 )（子が和了、子放銃の場合 等）.
 * - 親が子にロン: one payer pays ceiling100( base × 6 ).
 * - 自摸(子): 子ロン1点払の約1.2倍を満点切り(100)扱い: total = ceiling100(子ロン払額×1.2)（満以上は専用表）.
 * - 自摸(親): 1人当たり = ceiling100(親向きロン/3)（ロン1人分= ceiling100( base×6 )）.
 *
 * 注: 符が25など特殊な場合は本実装の ceiling100 が大会ルールの端数に完全一致しないことがあります。UIで符を調整してください。
 */

export type LimitName =
  | "none"
  | "mangan"
  | "haneman"
  | "baiman"
  | "sanbaiman"
  | "yakuman"
  | "multi_yakuman";

const CEIL100 = (n: number) => Math.ceil(n / 100) * 100;

export interface LimitResult {
  limit: LimitName;
  /** Yakuman count for multi (役満2倍 etc.); display only */
  yakumanCount: number;
}

/**
 * 満貫以上の判定: 5飜以上, または4飜40符以上, または3飜70符以上
 */
export function getLimit(han: number, fu: number): LimitResult {
  if (han >= 13) {
    const yc = Math.min(4, Math.floor(han / 13));
    return { limit: yc > 1 ? "multi_yakuman" : "yakuman", yakumanCount: yc };
  }
  if (han >= 11) return { limit: "sanbaiman", yakumanCount: 0 };
  if (han >= 8) return { limit: "baiman", yakumanCount: 0 };
  if (han >= 6) return { limit: "haneman", yakumanCount: 0 };
  if (han >= 5 || (han === 4 && fu >= 40) || (han === 3 && fu >= 70)) {
    return { limit: "mangan", yakumanCount: 0 };
  }
  return { limit: "none", yakumanCount: 0 };
}

export function rawBase(fu: number, han: number): number {
  return fu * 2 ** (han + 2);
}

export interface ScoringContext {
  fu: number;
  han: number;
  isDealer: boolean;
  isTsumo: boolean;
  /** ロン: 点棒を出す人が親（親放銃） */
  isDiscarderDealer: boolean;
}

export interface ScoringResult {
  limit: LimitResult;
  /** 符×2^飜 系の生ベース(満前) */
  rawBase: number;
  /** 子の視点: 1人の子にロンされたときの一括支払(参考) 等。表示用。 */
  childRonTotal: number;
  /** 最終: 和了者の取り方を説明用の行 */
  lines: { key: string; value: string }[];
  /** 一括の点数（3人+親の和がこれ）自摸, 1人=ロン */
  totalTransferred: number;
  payments: {
    type: "tsumo_ko" | "tsumo_oya" | "ron";
    items: { label: string; amount: number; count: number }[];
  };
  /** 満/跳満/倍満/三倍満/役満 表示名 key */
  limitLabelKey: string;
}

const LIMIT: Record<
  Exclude<LimitName, "none" | "multi_yakuman">,
  { childRon: number; dealerFromChild: number }
> = {
  mangan: { childRon: 8_000, dealerFromChild: 12_000 },
  haneman: { childRon: 12_000, dealerFromChild: 18_000 },
  baiman: { childRon: 16_000, dealerFromChild: 24_000 },
  sanbaiman: { childRon: 24_000, dealerFromChild: 36_000 },
  yakuman: { childRon: 32_000, dealerFromChild: 48_000 },
};

function childRon4Player(fu: number, han: number, lim: LimitResult): number {
  if (lim.limit === "multi_yakuman") {
    const mult = lim.yakumanCount;
    return 32_000 * mult;
  }
  if (lim.limit === "yakuman") {
    return LIMIT.yakuman.childRon;
  }
  if (lim.limit === "none") {
    return CEIL100(4 * rawBase(fu, han));
  }
  return LIMIT[lim.limit].childRon;
}

function dealerRounFromOneChild(fu: number, han: number, lim: LimitResult): number {
  if (lim.limit === "multi_yakuman") {
    return 48_000 * lim.yakumanCount;
  }
  if (lim.limit === "yakuman") {
    return LIMIT.yakuman.dealerFromChild;
  }
  if (lim.limit === "none") {
    return CEIL100(6 * rawBase(fu, han));
  }
  return LIMIT[lim.limit].dealerFromChild;
}

/**
 * 子の自摸: 3人合計。非満: ≈1.2×(子同士ロン1人分) を 100 円に揃えた市販表（雀魂等）.
 * 満以上: 合計=子 ロン額(満上は同額) — 自摸3人払 子2000+子2000+親4000=満8000 等
 */
function koTsumoTotal(fu: number, han: number, lim: LimitResult): number {
  const cr = childRon4Player(fu, han, lim);
  if (lim.limit === "none") {
    return CEIL100(cr * 1.2);
  }
  return cr;
}

function limitLabelKey(lim: LimitResult): string {
  if (lim.limit === "none") return "limit.none";
  if (lim.limit === "mangan") return "limit.mangan";
  if (lim.limit === "haneman") return "limit.haneman";
  if (lim.limit === "baiman") return "limit.baiman";
  if (lim.limit === "sanbaiman") return "limit.sanbaiman";
  if (lim.limit === "yakuman" || lim.limit === "multi_yakuman")
    return "limit.yakuman";
  return "limit.none";
}

export function computeScores(ctx: ScoringContext): ScoringResult {
  const { fu, han, isDealer, isTsumo, isDiscarderDealer } = ctx;
  const limit = getLimit(han, fu);
  const rb = rawBase(fu, han);
  const childRon = childRon4Player(fu, han, limit);
  const lines: { key: string; value: string }[] = [
    { key: "result.rawBase", value: String(rb) },
    { key: "result.dealerChildRon4", value: String(childRon) },
  ];

  if (!isTsumo) {
    if (isDealer) {
      // 親のロン: 子の1人(放銃者)が6倍点相当を全額
      const r = dealerRounFromOneChild(fu, han, limit);
      return {
        limit,
        rawBase: rb,
        childRonTotal: childRon,
        lines,
        totalTransferred: r,
        payments: { type: "ron", items: [{ label: "pay.child", amount: r, count: 1 }] },
        limitLabelKey: limitLabelKey(limit),
      };
    }
    // 子のロン: 子→子/親
    if (isDiscarderDealer) {
      // 子が親から和了: 1人(親)が 子4倍相当
      const p = childRon4Player(fu, han, limit);
      return {
        limit,
        rawBase: rb,
        childRonTotal: childRon,
        lines,
        totalTransferred: p,
        payments: { type: "ron", items: [{ label: "pay.dealer", amount: p, count: 1 }] },
        limitLabelKey: limitLabelKey(limit),
      };
    }
    // 子が子にロン: 1人(子)が4倍
    const p = childRon4Player(fu, han, limit);
    return {
      limit,
      rawBase: rb,
      childRonTotal: childRon,
      lines,
      totalTransferred: p,
      payments: { type: "ron", items: [{ label: "pay.child", amount: p, count: 1 }] },
      limitLabelKey: limitLabelKey(limit),
    };
  }

  if (isDealer) {
    const r = dealerRounFromOneChild(fu, han, limit);
    const per = Math.ceil((r / 3) / 100) * 100;
    const total = per * 3;
    return {
      limit,
      rawBase: rb,
      childRonTotal: childRon,
      lines,
      totalTransferred: total,
      payments: {
        type: "tsumo_oya",
        items: [{ label: "pay.eachChildTsumo", amount: per, count: 3 }],
      },
      limitLabelKey: limitLabelKey(limit),
    };
  }

  // 子のツモ: 1:1:2
  const tsumoTotal = koTsumoTotal(fu, han, limit);
  const onePart = tsumoTotal / 4;
  const perKo = Math.ceil(onePart / 100) * 100;
  const oyaPays = tsumoTotal - 2 * perKo;
  return {
    limit,
    rawBase: rb,
    childRonTotal: childRon,
    lines,
    totalTransferred: tsumoTotal,
    payments: {
      type: "tsumo_ko",
      items: [
        { label: "pay.dealerTsumo", amount: oyaPays, count: 1 },
        { label: "pay.koTsumo", amount: perKo, count: 2 },
      ],
    },
    limitLabelKey: limitLabelKey(limit),
  };
}
