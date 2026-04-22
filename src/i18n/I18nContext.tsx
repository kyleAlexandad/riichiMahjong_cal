import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import en from "./en.json";
import zh from "./zh.json";

type Lang = "en" | "zh";
type Dict = Record<string, string>;

const BUNDLES: Record<Lang, Dict> = { en, zh };

const I18nCtx = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
} | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof navigator !== "undefined" && navigator.language?.startsWith("zh")) {
      return "zh";
    }
    return "en";
  });
  const t = useCallback(
    (key: string) => BUNDLES[lang][key] ?? BUNDLES.en[key] ?? key,
    [lang]
  );
  const v = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <I18nCtx.Provider value={v}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const c = useContext(I18nCtx);
  if (!c) throw new Error("useI18n");
  return c;
}
