/**
 * 主要な役（拡張は配列に追加。UI ではタップで有効/無効).
 * 飜数は M-League / 一般ルール; 全自動面子検査は行わない.
 */

export interface YakuDef {
  id: string;
  i18nKey: string;
  mustClosed?: boolean;
  tsumoOnly?: boolean;
  openMinus1?: boolean; // 喰い下げ 1
  /** 門前直ロンで1飜減(平和・一盃口 等) — 有効化時、ロンで -1(下限0) */
  ronMinus1IfMenzen?: boolean;
  han: number;
  isYakuman?: boolean;
}

export const YAKU_LIST: YakuDef[] = [
  { id: "tanyao", i18nKey: "yaku.tanyao", openMinus1: true, han: 1 },
  { id: "riichi", i18nKey: "yaku.riichi", mustClosed: true, han: 1 },
  { id: "daburu", i18nKey: "yaku.daburu", mustClosed: true, han: 2 },
  { id: "ippatsu", i18nKey: "yaku.ippatsu", mustClosed: true, han: 1 },
  { id: "pinfu", i18nKey: "yaku.pinfu", mustClosed: true, ronMinus1IfMenzen: true, han: 1 },
  { id: "ipe", i18nKey: "yaku.ipe", mustClosed: true, ronMinus1IfMenzen: true, han: 1 },
  { id: "selfwind", i18nKey: "yaku.selfwind", openMinus1: true, han: 1 },
  { id: "roundwind", i18nKey: "yaku.roundwind", openMinus1: true, han: 1 },
  { id: "haku", i18nKey: "yaku.haku", openMinus1: true, han: 1 },
  { id: "hatsu", i18nKey: "yaku.hatsu", openMinus1: true, han: 1 },
  { id: "chun", i18nKey: "yaku.chun", openMinus1: true, han: 1 },
  { id: "rinshan", i18nKey: "yaku.rinshan", openMinus1: true, han: 1 },
  { id: "chankan", i18nKey: "yaku.chankan", openMinus1: true, han: 1 },
  { id: "haidite", i18nKey: "yaku.haidite", mustClosed: true, tsumoOnly: true, han: 1 },
  { id: "ho", i18nKey: "yaku.ho", mustClosed: true, tsumoOnly: true, han: 1 },
  { id: "toitoiho", i18nKey: "yaku.toitoiho", openMinus1: true, han: 2 },
  { id: "sananko", i18nKey: "yaku.sananko", mustClosed: true, ronMinus1IfMenzen: true, han: 2 },
  { id: "sanshokud", i18nKey: "yaku.sanshokud", mustClosed: true, ronMinus1IfMenzen: true, han: 2 },
  { id: "sanshokut", i18nKey: "yaku.sanshokut", openMinus1: true, han: 2 },
  { id: "ittsu", i18nKey: "yaku.ittsu", ronMinus1IfMenzen: true, openMinus1: true, han: 2 },
  { id: "chitoi", i18nKey: "yaku.chitoi", mustClosed: true, ronMinus1IfMenzen: true, han: 2 },
  { id: "honitsu", i18nKey: "yaku.honitsu", ronMinus1IfMenzen: true, openMinus1: true, han: 3 },
  { id: "junchan", i18nKey: "yaku.junchan", ronMinus1IfMenzen: true, openMinus1: true, han: 2 },
  { id: "ryanpeko", i18nKey: "yaku.ryanpeko", mustClosed: true, ronMinus1IfMenzen: true, han: 3 },
  { id: "honroto", i18nKey: "yaku.honroto", openMinus1: true, han: 2 },
  { id: "shosangen", i18nKey: "yaku.shosangen", openMinus1: true, han: 2 },
  { id: "sankantsu", i18nKey: "yaku.sankantsu", openMinus1: true, han: 2 },
  { id: "chinitsu", i18nKey: "yaku.chinitsu", ronMinus1IfMenzen: true, openMinus1: true, han: 6 },
  { id: "shosushi", i18nKey: "yaku.shosushi", isYakuman: true, mustClosed: true, han: 13 },
  { id: "daisushi", i18nKey: "yaku.daisushi", isYakuman: true, openMinus1: true, han: 13 },
  { id: "kokushi", i18nKey: "yaku.kokushi", isYakuman: true, mustClosed: true, han: 13 },
  { id: "suanko", i18nKey: "yaku.suanko", isYakuman: true, mustClosed: true, han: 13 },
  { id: "suanko2", i18nKey: "yaku.suanko2", isYakuman: true, mustClosed: true, han: 26 },
  { id: "churen", i18nKey: "yaku.churen", isYakuman: true, mustClosed: true, han: 13 },
  { id: "nagashi", i18nKey: "yaku.nagashi", isYakuman: true, mustClosed: true, han: 13 },
  { id: "ryuiso", i18nKey: "yaku.ryuiso", isYakuman: true, openMinus1: true, han: 13 },
  { id: "tsuiso", i18nKey: "yaku.tsuiso", isYakuman: true, mustClosed: true, openMinus1: true, han: 13 },
  { id: "daisangen", i18nKey: "yaku.daisangen", isYakuman: true, openMinus1: true, han: 13 },
  { id: "suukantsu", i18nKey: "yaku.suukantsu", isYakuman: true, openMinus1: true, han: 13 },
  { id: "chinroto", i18nKey: "yaku.chinroto", isYakuman: true, openMinus1: true, han: 13 },
  { id: "tenho", i18nKey: "yaku.tenho", isYakuman: true, tsumoOnly: true, mustClosed: true, han: 13 },
  { id: "chiho", i18nKey: "yaku.chiho", isYakuman: true, mustClosed: true, han: 13 },
];

export function yakuById(id: string): YakuDef | undefined {
  return YAKU_LIST.find((y) => y.id === id);
}

export function countHanFromYaku(
  selectedIds: Set<string>,
  opts: { isOpen: boolean; isTsumo: boolean }
): { totalHan: number; applied: { id: string; han: number }[]; notes: string[] } {
  const applied: { id: string; han: number }[] = [];
  const notes: string[] = [];
  let th = 0;
  for (const id of selectedIds) {
    const y = yakuById(id);
    if (!y) continue;
    if (y.tsumoOnly && !opts.isTsumo) {
      notes.push(`yaku.tsumoOnly:${id}`);
      continue;
    }
    if (y.mustClosed && opts.isOpen) {
      notes.push(`yaku.notOpen:${id}`);
      continue;
    }
    let h = y.han;
    if (y.isYakuman) {
      th += h;
      applied.push({ id, han: h });
      continue;
    }
    if (y.openMinus1 && opts.isOpen) h = Math.max(0, h - 1);
    if (y.ronMinus1IfMenzen && !opts.isTsumo) h = Math.max(0, h - 1);
    th += h;
    applied.push({ id, han: h });
  }
  return { totalHan: th, applied, notes };
}
