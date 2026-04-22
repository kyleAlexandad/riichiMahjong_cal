import { useEffect, useMemo, useRef, useState } from "react";
import { TileFace } from "./components/TileFace";
import { TileKeyPad } from "./components/TileKeyPad";
import { I18nProvider, useI18n } from "./i18n/I18nContext";
import { computeScores, rawBase } from "./scoring/riichiPoints";
import { countDoraMatches, isOpenHand } from "./scoring/dora";
import { computeFuFromHand } from "./scoring/fuFromHand";
import { detectYakuFromHand } from "./scoring/yakuFromHand";
import { PRESETS } from "./presets";
import type { PlacedTile, TileId } from "./types/tiles";
import { makeTileId } from "./types/tiles";

const LONG_MS = 420;

function haptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(8);
  }
}

function AppInner() {
  const { t, lang, setLang } = useI18n();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isDealer, setIsDealer] = useState(false);
  const [isTsumo, setIsTsumo] = useState(true);
  const [discarderDealer, setDiscarderDealer] = useState(false);
  const [forceOpen, setForceOpen] = useState(false);
  const [hand, setHand] = useState<PlacedTile[]>([]);
  const [stack, setStack] = useState<PlacedTile[][]>([]);
  const [dora, setDora] = useState<TileId[]>([]);
  const [ura, setUra] = useState<TileId[]>([]);
  /** 0=東1=南2=西3=北, 自风/场风(役牌) */
  const [roundWind, setRoundWind] = useState(0);
  const [seatWind, setSeatWind] = useState(0);
  const [markWin, setMarkWin] = useState(false);
  /** 状況役（手牌外） */
  const [yRiichi, setYRiichi] = useState(false);
  const [yIppatsu, setYIppatsu] = useState(false);
  const [yChankan, setYChankan] = useState(false);
  const [yRinshan, setYRinshan] = useState(false);
  const [yHaitei, setYHaitei] = useState(false);
  const [yTenhou, setYTenhou] = useState(false);
  const [yChihou, setYChihou] = useState(false);

  const longRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longFired = useRef(false);
  const handRef = useRef(hand);
  useEffect(() => {
    handRef.current = hand;
  }, [hand]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  useEffect(() => {
    if (isDealer) setSeatWind(0);
    else setSeatWind(1);
  }, [isDealer]);
  useEffect(() => {
    if (!yRiichi) setYIppatsu(false);
  }, [yRiichi]);
  useEffect(() => {
    if (isTsumo) {
      setYChankan(false);
    } else {
      setYRinshan(false);
    }
  }, [isTsumo]);
  useEffect(() => {
    if (!isDealer || !isTsumo) setYTenhou(false);
  }, [isDealer, isTsumo]);
  useEffect(() => {
    if (isDealer || !isTsumo) setYChihou(false);
  }, [isDealer, isTsumo]);
  useEffect(() => {
    if (yTenhou || yChihou) {
      setYRiichi(false);
      setYIppatsu(false);
    }
  }, [yTenhou, yChihou]);

  const addTile = (tile: TileId, isAka?: boolean) => {
    haptic();
    const id = makeTileId();
    const prev = handRef.current;
    const next: PlacedTile[] = prev.map((p) => ({ ...p, winning: false }));
    next.push({
      id,
      tile,
      open: false,
      isAka: !!isAka,
      winning: true,
    });
    setStack((s) => [...s.slice(-40), prev]);
    setHand(next);
  };

  const undo = () => {
    if (stack.length === 0) return;
    const prev = stack[stack.length - 1]!;
    setStack((s) => s.slice(0, -1));
    setHand(prev);
    haptic();
  };

  const clear = () => {
    setStack((s) => [...s.slice(-40), handRef.current]);
    setHand([]);
  };

  const isOpen = forceOpen || isOpenHand(hand);
  useEffect(() => {
    if (isOpen) {
      setYRiichi(false);
      setYIppatsu(false);
    }
  }, [isOpen]);

  const doraH = useMemo(
    () => countDoraMatches(hand, dora, ura),
    [hand, dora, ura]
  );
  const detected = useMemo(
    () => detectYakuFromHand(hand, { isOpen, isTsumo, roundWind, seatWind }),
    [hand, isOpen, isTsumo, roundWind, seatWind]
  );
  const fuResult = useMemo(
    () => computeFuFromHand(hand, { isTsumo, isOpen, roundWind, seatWind }),
    [hand, isTsumo, isOpen, roundWind, seatWind]
  );
  const fu = fuResult.fu;
  const doraHans = doraH.dora + doraH.ura + doraH.aka;
  const yakuHMain = !detected.ok
    ? 0
    : yTenhou || yChihou
      ? 13
      : detected.yakuHan;
  const extraHan = (() => {
    if (!detected.ok || yTenhou || yChihou) return 0;
    let e = 0;
    if (yRiichi) e += 1;
    if (yIppatsu && yRiichi) e += 1;
    if (yChankan && !isTsumo) e += 1;
    if (yRinshan && isTsumo) e += 1;
    if (yHaitei) e += 1;
    return e;
  })();
  const totalHan = yakuHMain + (detected.ok ? doraHans : 0) + extraHan;
  const score = useMemo(
    () =>
      computeScores({
        fu,
        han: totalHan,
        isDealer,
        isTsumo,
        isDiscarderDealer: discarderDealer,
      }),
    [fu, totalHan, isDealer, isTsumo, discarderDealer]
  );
  const rb = rawBase(fu, totalHan);

  return (
    <div className="app-root">
      <header className="app-header">
        <h1 className="app-title">{t("app.title")}</h1>
        <div className="header-tools">
          <button
            type="button"
            className="btn-ghost haptic"
            onClick={() => {
              setLang(lang === "en" ? "zh" : "en");
              haptic();
            }}
          >
            {t("lang.switch")}
          </button>
          <button
            type="button"
            className="btn-ghost haptic"
            onClick={() => setTheme((x) => (x === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? t("theme.light") : t("theme.dark")}
          </button>
        </div>
      </header>

      <section className="card">
        <div className="seg">
          <button
            type="button"
            className={!isDealer ? "seg-on" : ""}
            onClick={() => setIsDealer(false)}
          >
            {t("win.ko")}
          </button>
          <button
            type="button"
            className={isDealer ? "seg-on" : ""}
            onClick={() => setIsDealer(true)}
          >
            {t("win.dealer")}
          </button>
        </div>
        <div className="seg mt-2">
          <button
            type="button"
            className={isTsumo ? "seg-on" : ""}
            onClick={() => setIsTsumo(true)}
          >
            {t("win.tsumo")}
          </button>
          <button
            type="button"
            className={!isTsumo ? "seg-on" : ""}
            onClick={() => setIsTsumo(false)}
          >
            {t("win.ron")}
          </button>
        </div>
        {!isTsumo && (
          <div className="row mt-2">
            <span className="muted small">{t("win.discarder")}:</span>
            <div className="seg seg-sm">
              <button
                type="button"
                className={discarderDealer ? "seg-on" : ""}
                onClick={() => setDiscarderDealer(true)}
              >
                {t("win.dealerAsDiscarder")}
              </button>
              <button
                type="button"
                className={!discarderDealer ? "seg-on" : ""}
                onClick={() => setDiscarderDealer(false)}
              >
                {t("win.koAsDiscarder")}
              </button>
            </div>
          </div>
        )}
        <p className="tip muted small mt-2">{t("wind.tip")}</p>
        <div className="row mt-1">
          <span className="muted small wlab">{t("wind.round")}</span>
          <div className="seg seg-sm flex-1">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                type="button"
                className={roundWind === i ? "seg-on" : ""}
                onClick={() => setRoundWind(i)}
              >
                {t((["wind.n0", "wind.n1", "wind.n2", "wind.n3"] as const)[i]!)}
              </button>
            ))}
          </div>
        </div>
        <div className="row mt-1">
          <span className="muted small wlab">{t("wind.seat")}</span>
          <div className="seg seg-sm flex-1">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                type="button"
                className={seatWind === i ? "seg-on" : ""}
                onClick={() => setSeatWind(i)}
              >
                {t((["wind.n0", "wind.n1", "wind.n2", "wind.n3"] as const)[i]!)}
              </button>
            ))}
          </div>
        </div>
        <h3 className="h3 mt-2">{t("situ.title")}</h3>
        <p className="tip muted small">{t("situ.tip")}</p>
        <div className="situ-btns">
          <button
            type="button"
            className={yRiichi && !isOpen ? "situ on" : "situ"}
            disabled={isOpen}
            onClick={() => {
              haptic();
              setYRiichi((v) => !v);
            }}
          >
            {t("situ.riichi")}
          </button>
          <button
            type="button"
            className={yIppatsu && yRiichi ? "situ on" : "situ"}
            disabled={!yRiichi}
            onClick={() => {
              haptic();
              setYIppatsu((v) => !v);
            }}
          >
            {t("situ.ippatsu")}
          </button>
          <button
            type="button"
            className={yChankan && !isTsumo ? "situ on" : "situ"}
            disabled={isTsumo}
            onClick={() => {
              haptic();
              setYChankan((v) => !v);
            }}
          >
            {t("situ.chankan")}
          </button>
          <button
            type="button"
            className={yRinshan && isTsumo ? "situ on" : "situ"}
            disabled={!isTsumo}
            onClick={() => {
              haptic();
              setYRinshan((v) => !v);
            }}
          >
            {t("situ.rinshan")}
          </button>
          <button
            type="button"
            className={yHaitei ? "situ on" : "situ"}
            onClick={() => {
              haptic();
              setYHaitei((v) => !v);
            }}
            title={t("situ.houteiTitle")}
          >
            {t("situ.houteiHaitei")}
          </button>
          <button
            type="button"
            className={yTenhou ? "situ on" : "situ"}
            disabled={!isDealer || !isTsumo}
            onClick={() => {
              haptic();
              setYTenhou((v) => {
                const n = !v;
                if (n) setYChihou(false);
                return n;
              });
            }}
          >
            {t("situ.tenhou")}
          </button>
          <button
            type="button"
            className={yChihou ? "situ on" : "situ"}
            disabled={isDealer || !isTsumo}
            onClick={() => {
              haptic();
              setYChihou((v) => {
                const n = !v;
                if (n) setYTenhou(false);
                return n;
              });
            }}
          >
            {t("situ.chihou")}
          </button>
        </div>
      </section>

      <section className="card">
        <h2 className="h2">{t("hand.title")}</h2>
        <p className="tip muted small">{t("hand.tip")}</p>
        <div className="row wrap hand-actions">
          <button
            type="button"
            className={markWin ? "btn on" : "btn"}
            onClick={() => setMarkWin((m) => !m)}
          >
            {t("hand.markWin")}
          </button>
          <button type="button" className="btn" onClick={undo} disabled={!stack.length}>
            {t("hand.undo")}
          </button>
          <button type="button" className="btn danger" onClick={clear} disabled={!hand.length}>
            {t("hand.clear")}
          </button>
        </div>
        <div className="row wrap hand-actions">
          <label className="check">
            <input
              type="checkbox"
              checked={forceOpen}
              onChange={() => setForceOpen((f) => !f)}
            />
            <span className="small"> {lang === "zh" ? "作為鸣牌" : "Treat as open"}</span>
          </label>
        </div>
        <div className="hand-strip">
          {hand.length === 0 && <span className="muted">—</span>}
          {hand.map((p) => (
            <TileFace
              key={p.id}
              tile={p.tile}
              open={p.open}
              winning={p.winning}
              isAka={p.isAka}
              onPointerDown={() => {
                longFired.current = false;
                if (longRef.current) clearTimeout(longRef.current);
                longRef.current = setTimeout(() => {
                  longFired.current = true;
                  haptic();
                  setStack((s) => [...s.slice(-40), handRef.current]);
                  setHand((h) =>
                    h.map((x) => (x.id === p.id ? { ...x, open: !x.open } : x))
                  );
                }, LONG_MS);
              }}
              onPointerUp={() => {
                if (longRef.current) {
                  clearTimeout(longRef.current);
                  longRef.current = null;
                }
                if (longFired.current) {
                  longFired.current = false;
                  return;
                }
                if (markWin) {
                  setHand((h) => h.map((x) => ({ ...x, winning: x.id === p.id })));
                  setMarkWin(false);
                  haptic();
                  return;
                }
                haptic();
                setStack((s) => [...s.slice(-40), handRef.current]);
                setHand((h) => {
                  const i = h.map((x) => x.id).lastIndexOf(p.id);
                  if (i < 0) return h;
                  return h.filter((_, j) => j !== i);
                });
              }}
              onPointerLeave={() => {
                if (longRef.current) {
                  clearTimeout(longRef.current);
                  longRef.current = null;
                }
              }}
            />
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="h2">{t("tiles.wall")}</h2>
        <TileKeyPad
          onTile={(id, o) => addTile(id, o?.aka)}
          beforeAkaRow={<p className="tip muted small mt-1">{t("hand.akaRow")}</p>}
        />
      </section>

      <section className="card">
        <h2 className="h2">{t("dora.title")}</h2>
        <p className="tip muted small">{t("dora.tap")}</p>
        <div className="dora-belt">
          {dora.length === 0 && <span className="muted">—</span>}
          {dora.map((til, i) => (
            <button
              key={`${til}-${i}`}
              type="button"
              className="dora-chip haptic"
              onClick={() => setDora((d) => d.filter((_, j) => j !== i))}
            >
              <TileFace tile={til} small />
            </button>
          ))}
        </div>
        <div className="mt-1">
          <TileKeyPad
            onTile={(id) => {
              haptic();
              setDora((d) => [...d, id]);
            }}
          />
        </div>
        <h3 className="h3 mt-2">{t("dora.ura")}</h3>
        <p className="tip muted small">{t("dora.uraNote")}</p>
        <div className="dora-belt">
          {ura.length === 0 && <span className="muted">—</span>}
          {ura.map((til, i) => (
            <button
              key={`u${til}-${i}`}
              type="button"
              className="dora-chip haptic"
              onClick={() => setUra((d) => d.filter((_, j) => j !== i))}
            >
              <TileFace tile={til} small />
            </button>
          ))}
        </div>
        <div className="mt-1">
          <TileKeyPad
            onTile={(id) => {
              haptic();
              setUra((d) => [...d, id]);
            }}
          />
        </div>
      </section>

      <section className="card result-card">
        <h2 className="h2">{t("result.title")}</h2>
        {!detected.ok && hand.length > 0 && (
          <p className="small warn">
            {detected.reasonKey ? t(detected.reasonKey) : ""}
          </p>
        )}
        {detected.ok && (
          <div className="yaku-wrap yaku-detected">
            {detected.yaku.map((y) => (
              <span key={y.id} className="yaku-chip on">
                {t(y.i18nKey)} <span className="han-badge">{y.han}</span>
              </span>
            ))}
            {detected.yaku.length === 0 && !yTenhou && !yChihou && (
              <span className="muted small">{t("result.noYaku")}</span>
            )}
            {(yTenhou || yChihou) && (
              <span className="yaku-chip on">
                {t(yTenhou ? "situ.tenhou" : "situ.chihou")}{" "}
                <span className="han-badge">13</span>
              </span>
            )}
            {yRiichi && (
              <span className="yaku-chip on">
                {t("situ.riichi")} <span className="han-badge">1</span>
              </span>
            )}
            {yIppatsu && yRiichi && (
              <span className="yaku-chip on">
                {t("situ.ippatsu")} <span className="han-badge">1</span>
              </span>
            )}
            {yChankan && !isTsumo && (
              <span className="yaku-chip on">
                {t("situ.chankan")} <span className="han-badge">1</span>
              </span>
            )}
            {yRinshan && isTsumo && (
              <span className="yaku-chip on">
                {t("situ.rinshan")} <span className="han-badge">1</span>
              </span>
            )}
            {yHaitei && (
              <span className="yaku-chip on">
                {isTsumo ? t("situ.haitei") : t("situ.houtei")} <span className="han-badge">1</span>
              </span>
            )}
          </div>
        )}
        <div className="result-grid">
          <div>
            <span className="muted">{t("result.han")}</span>{" "}
            <strong className="big">{totalHan}</strong>
            <div className="sub">
              {t("result.breakdown")
                .replace("{y}", String(yakuHMain))
                .replace("{d}", String(detected.ok ? doraH.dora : 0))
                .replace("{u}", String(detected.ok ? doraH.ura : 0))
                .replace("{a}", String(detected.ok ? doraH.aka : 0))}
              {extraHan > 0 && (
                <span>
                  {" "}
                  {t("result.extraSitu")}: +{String(extraHan)}
                </span>
              )}
            </div>
          </div>
          <div>
            <span className="muted">{t("result.fu")}</span>{" "}
            <strong className="big">{fu}</strong>
          </div>
          <div>
            <span className="muted">{t("result.limit")}</span> {t(score.limitLabelKey)}
          </div>
        </div>
        <p className="sub">{t("dora.doraUraAka")}</p>
        {detected.ok && (
          <>
            <p className="sub fu-break">
              {fuResult.breakdown.map((b, i) => (
                <span key={i}>
                  {t(b.key)} +{b.v}
                  {i < fuResult.breakdown.length - 1 ? " · " : ""}
                </span>
              ))}
            </p>
            {fuResult.totalUnrounded !== fuResult.fu && (
              <p className="sub muted small">
                {t("fu.preRound")}: {String(fuResult.totalUnrounded)} →{" "}
                {t("fu.label")} {String(fuResult.fu)}
              </p>
            )}
          </>
        )}
        <p className="sub">
          {t("result.rawBase")}: {String(rb)} {" · "} base×2^飜+2
        </p>
        <h3 className="h3">{t("result.payments")}</h3>
        <ul className="pay-list">
          {score.payments.items.map((it, i) => (
            <li key={i}>
              {t(it.label)}: {it.count}×{it.amount} = {it.count * it.amount}
            </li>
          ))}
        </ul>
        <p className="total-line">
          {t("result.total")}: <strong>{score.totalTransferred}</strong>
        </p>
      </section>

      <section className="card">
        <h2 className="h2">{t("hand.presets")}</h2>
        <div className="row wrap">
          {PRESETS.map((pr) => (
            <button
              key={pr.id}
              type="button"
              className="btn"
              onClick={() => {
                setStack([]);
                setHand(pr.hand.map((p) => ({ ...p, id: makeTileId() })));
                haptic();
              }}
            >
              {t(pr.i18nKey)}
            </button>
          ))}
        </div>
      </section>

      <footer className="footer small muted">{t("footer.note")}</footer>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppInner />
    </I18nProvider>
  );
}
