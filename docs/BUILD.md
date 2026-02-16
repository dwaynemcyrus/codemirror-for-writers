# Build & Deployment Guide

## Local Development

### Setup

```bash
cd codemirror-for-writers
npm install
```

### Run Demo

```bash
npm run dev
```

Runs the demo app at `http://127.0.0.1:4173`.

### Build Library

```bash
npm run build:lib
```

Output files:

- `dist/index.js` (ESM)
- `dist/index.cjs` (CJS)
- `dist/index.d.ts` (types)

### Build Demo (GitHub Pages artifact)

```bash
npm run build
```

Output directory:

- `dist-demo/`

## Testing

```bash
npm test
```

Playwright requires browser binaries. Install once:

```bash
npx playwright install chromium
```

## Publishing to npm

```bash
# Update version first
npm version patch   # or minor/major

# Publish
npm publish --access public
```

`prepublishOnly` runs `npm run build:lib` before publish.

## GitHub Actions Notes

- Library publish workflow: `.github/workflows/publish.yml`
- Demo deploy workflow (Pages): `.github/workflows/deploy.yml`
- Test workflow: `.github/workflows/test.yml`
