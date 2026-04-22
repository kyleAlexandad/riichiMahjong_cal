# Riichi Mahjong score

Live site: **https://kyleAlexandad.github.io/riichiMahjong_cal/** (after the steps below).

## GitHub Pages (fix 404)

The workflow publishes the built site to the **`gh-pages`** branch. You must point Pages at that branch:

1. **Settings → Pages → Build and deployment**
2. **Source: Deploy from a branch** (not “GitHub Actions”).
3. **Branch:** `gh-pages`, **folder:** `/ (root)` → Save.
4. Wait for the **Deploy to GitHub Pages** workflow to finish (green) on the **Actions** tab, then refresh the live URL.

If you only see a 404, you were still on “GitHub Actions” as the source while no artifact was being published; switching to **`gh-pages`** fixes that for this setup.

## Local

```bash
npm install
npm run dev
```

Production build (same base as GitHub Pages):

```bash
npm run build:gh
```

Manual deploy to `gh-pages` branch (optional if you do not use Actions):

```bash
npm run deploy
```

`vite.config.ts` still defaults to `./` for local `npm run build`; use `build:gh` for hosting under `/riichiMahjong_cal/`.
