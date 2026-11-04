# Sreekesh & Karthika Wedding Invitation

A static, mobile-first Kerala Hindu wedding invitation built with React, TypeScript, and Vite.

## Edit wedding details

All names, dates, venues, map links, and image URLs are in `src/config.ts`.

## Local development

```bash
pnpm install
pnpm dev:vite
```

## GitHub Pages

Push this project to a GitHub repository, then open **Settings → Pages** and choose **GitHub Actions** as the source. The included workflow builds and deploys the site on every push to `main`. Vite uses a relative base path, so project-site repository paths work without additional configuration.

The existing repository is `https://github.com/arjunprmeg/sreekesh-karthika`.
Its default Pages address is `https://arjunprmeg.github.io/sreekesh-karthika/`.
The workflow installs the pnpm version declared in `package.json` and publishes
the Vite `dist` output. Run `pnpm build` to verify production changes locally.

`pnpm dev` starts the separate Next.js preview wrapper; GitHub Pages uses the
Vite build and does not require a Next.js server. Keep local image paths relative
so they work under the repository's Pages URL.
