# AGENTS.md — ShadowClaw Template

> Guidance for AI agents working on a site published from this template.

## Project Snapshot

Starter template for static sites built with [ShadowClaw](https://xt-ml.github.io/shadow-claw/) as the build engine. There is no ShadowClaw source in the repo, only content and configuration.

## Layout

- `pages/main/index.html` — home page
- `pages/main/~/content/NN-*.md` — numbered content pages; the filename slug becomes the URL (`/main/<slug>`)
- `pages/main/MEMORY.md`, `pages/main/RESET.md` — agent memory and reset prompt
- `pages/resources/` — static resources copied to the site root (`robots.txt`, `llms.txt`, `manifest.json`, `404.html`, `assets/`)
- `pages/resources/routes.json` — maps source files to pretty URLs and drives `sitemap.xml` generation
- `shadow-claw.config.json` — site, branding, and security settings
- `.agents/skills/`, `.agents/tools/`, `.agents/scripts/` — agent skills, declarative tools, and helper scripts
- `AGENTS.md`, `README.md` — repository documentation copied to the site root during deployment

## Conventions

- Add a page by creating the markdown file and adding a matching entry to `pages/resources/routes.json`; `sitemap.xml` is generated from it at build time. Do not hand-edit a sitemap.
- Update `pages/resources/llms.txt` when pages are added, renamed, or removed.
- Files in `pages/resources/` override ShadowClaw's defaults for the same root file.

## Commands

```bash
npx shadow-claw dev --open   # local dev server on http://127.0.0.1:8888
npx shadow-claw build        # build to dist/public
```

## Reference

- [ShadowClaw AGENTS.md](https://xt-ml.github.io/shadow-claw/AGENTS.md)
- [llms.txt](llms.txt)
