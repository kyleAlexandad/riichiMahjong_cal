# Riichi Mahjong score

Live site: **https://kyleAlexandad.github.io/riichiMahjong_cal/** (after Pages is enabled; first deploy may take a minute.)

## Deploy (this repo)

1. Push the `main` (or `master`) branch to [kyleAlexandad/riichiMahjong_cal](https://github.com/kyleAlexandad/riichiMahjong_cal).
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions** (use the *Deploy to GitHub Pages* workflow, not a branch named `gh-pages` unless you switch setups).
3. The workflow in `.github/workflows/deploy.yml` runs on push; approve the *github-pages* environment the first time if GitHub asks.

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
