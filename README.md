# Riichi Mahjong score

Live site: **https://kyleAlexandad.github.io/riichiMahjong_cal/** (after Pages workflow succeeds).

## Deploy (GitHub Actions source)

1. Push the `main` (or `master`) branch to [kyleAlexandad/riichiMahjong_cal](https://github.com/kyleAlexandad/riichiMahjong_cal).
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Wait for the **Deploy to GitHub Pages** workflow to finish (green) on the **Actions** tab.

If you still see 404, check whether the workflow needs one-time environment approval (`github-pages`), then rerun it.

## Local

```bash
npm install
npm run dev
```

Production build (same base as GitHub Pages):

```bash
npm run build:gh
```

Manual deploy to `gh-pages` branch (optional fallback):

```bash
npm run deploy
```

`vite.config.ts` still defaults to `./` for local `npm run build`; use `build:gh` for hosting under `/riichiMahjong_cal/`.
