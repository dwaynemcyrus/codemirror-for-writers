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

Opens demo at http://localhost:3000

### Build Library

```bash
npm run build:lib
```

Output: `dist/index.es.js` and `dist/index.umd.js`

### Build Demo

```bash
npm run build
```

Output: `demo-dist/`

## Publishing

### Option 1: npm Package

```bash
# Update version in package.json
npm version patch  # or minor, major

# Login to npm
npm login

# Publish
npm publish --access public
```

### Option 2: GitHub Packages

```bash
# Add to package.json
{
  "name": "@your-username/codemirror-for-writers",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}

# Create .npmrc in project root
@your-username:registry=https://npm.pkg.github.com

# Login
npm login --registry=https://npm.pkg.github.com

# Publish
npm publish
```

### Option 3: Private Registry

If you want to keep it private for your personal OS:

```bash
# Use Verdaccio or similar
npm install -g verdaccio
verdaccio

# Publish to local registry
npm publish --registry http://localhost:4873
```

### Option 4: Git Dependency

In your Next.js app's package.json:

```json
{
  "dependencies": {
    "codemirror-for-writers": "git+https://github.com/your-username/codemirror-for-writers.git"
  }
}
```

Or for local development:

```json
{
  "dependencies": {
    "codemirror-for-writers": "file:../codemirror-for-writers"
  }
}
```

## Integration into Next.js PWA

### Step 1: Install

```bash
cd your-nextjs-pwa
npm install codemirror-for-writers
# or
npm install file:../codemirror-for-writers
```

### Step 2: Create Component

See `INTEGRATION.md` for complete component examples.

### Step 3: Handle Dynamic Import

```typescript
// components/Editor.tsx
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const MarkdownEditor = dynamic(
  () => import('./MarkdownEditor'),
  { 
    ssr: false,
    loading: () => <div>Loading editor...</div>
  }
);

export default function Editor() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MarkdownEditor />
    </Suspense>
  );
}
```

### Step 4: Configure Next.js

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['codemirror-for-writers'],
  webpack: (config) => {
    // Handle CodeMirror's ES modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

module.exports = nextConfig;
```

## Deployment

### Vercel

```bash
# Deploy
vercel

# Or add to vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

### Netlify

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Self-Hosted

```bash
# Build for production
npm run build

# Start server
npm start

# Or with PM2
pm2 start npm --name "personal-os" -- start
```

## PWA Configuration

Ensure your PWA manifest includes:

```json
{
  "name": "Personal OS",
  "short_name": "OS",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## Testing on Mobile

### iOS Safari Testing

```bash
# Start dev server
npm run dev

# Get local IP
ipconfig getifaddr en0  # macOS
# or
hostname -I  # Linux

# Access from iPhone
http://YOUR_IP:3000
```

### Add to Home Screen
1. Open in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. Test as standalone app

### Debug on iOS

1. Enable Web Inspector on iPhone (Settings > Safari > Advanced)
2. Connect iPhone to Mac
3. Safari > Develop > [Your iPhone] > [Your PWA]

### Android Testing

```bash
# Enable USB debugging on Android
# Connect via USB
adb reverse tcp:3000 tcp:3000

# Or use ngrok for remote testing
npx ngrok http 3000
```

## Performance Monitoring

### Add Analytics

```typescript
// lib/analytics.ts
export function trackEditorLoad() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const loadTime = performance.now();
    console.log('Editor loaded in:', loadTime, 'ms');
  }
}
```

### Bundle Analysis

```bash
# Add to package.json
npm install -D @next/bundle-analyzer

# Configure in next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);

# Run analysis
ANALYZE=true npm run build
```

## Troubleshooting

### Build Errors

```bash
# Clear cache
rm -rf .next node_modules
npm install

# Clear npm cache
npm cache clean --force
```

### TypeScript Errors

```bash
# Generate types
npm run build:lib

# Check types
npx tsc --noEmit
```

### Performance Issues

1. Check bundle size
2. Use code splitting
3. Lazy load editor
4. Enable compression

### iOS Issues

- Font size minimum 16px
- Viewport meta tag
- Touch event handlers
- Scroll behavior

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build:lib
      - run: npm test
```

## Maintenance

### Update Dependencies

```bash
# Check outdated
npm outdated

# Update
npm update

# Or use npm-check-updates
npx npm-check-updates -u
npm install
```

### Security Audit

```bash
npm audit
npm audit fix
```

## Rollback Strategy

Keep version history:

```bash
# Tag releases
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0

# Rollback if needed
npm install codemirror-for-writers@1.0.0
```

## Next Steps

1. ✅ Build the library (`npm run build:lib`)
2. ✅ Test locally (`npm run dev`)
3. ✅ Publish to npm or GitHub packages
4. ✅ Install in your Next.js PWA
5. ✅ Create editor component
6. ✅ Test on iPhone
7. ✅ Deploy to production
8. ✅ Monitor performance
