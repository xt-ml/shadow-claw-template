# [ShadowClaw Template](https://xt-ml.github.io/shadow-claw-template/)

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/xt-ml/shadow-claw-template)

This is a starter template for publishing your own static site using
[ShadowClaw](https://github.com/xt-ml/shadow-claw) as the build engine.

## How it works

1. You write your content as markdown (`.md`) or HTML (`.html`) files under
   `pages/main/`.
2. You can add Agent Skills under `.agents/skills/main/`. Each skill is a directory containing a standard `SKILL.md`; these skills are available to the main ShadowClaw conversation.
3. You can add Declarative Tools under `.agents/tools/main/` as JSON files to declare custom executable tools for your site.
4. When you push to `main`, the included GitHub Actions workflow:
   - Checks out ShadowClaw's source as a **build dependency** (not redistributed).
   - Copies your `pages/` and `.agents/` into the build root.
   - Runs `npm run build:prod` with your repo's GitHub Pages URL injected
     automatically.
   - Deploys `dist/public/` to GitHub Pages via `actions/deploy-pages`.

No ShadowClaw source lives in this repo — only your content and the workflow.

## Local Development

To run or build your template site locally, use the `shadow-claw` CLI:

```bash
# Preview and run live dev server on http://127.0.0.1:8888
npx shadow-claw dev

# Or build the static distribution locally into ./dist/public
npx shadow-claw build
```

## Quick start

1. Click **Use this template** on GitHub (or fork/clone).
2. In your new repo, go to **Settings → Pages → Source** and select
   **GitHub Actions**.
3. Optionally drop your markdown files into `pages/main/`. A repository with
   no `pages/` directory still builds with ShadowClaw's default Pages content.
4. Optionally add skills under `.agents/skills/main/`; a repository without that directory simply has no bundled skills.
5. Optionally add tools under `.agents/tools/main/`; a repository without that directory has no bundled custom tools.
6. Optionally configure `shadow-claw.config.json` (repo root) for site branding, sidebar navigation visibility, initial tool enablement (`enabledTools`), and page sort order.
7. Optionally edit `pages/resources/routes.json` to add pretty-path URLs.
8. Push to `main` — the workflow builds and deploys automatically.

## Directory layout

```txt
shadow-claw.config.json   ← declarative site branding, sidebar, enabled tools, and sorting config
pages/
  main/
    index.html        ← your home page
    ~/content/
      about.md        ← any other pages
  resources/          ← root level files & resources (routes.json, 404.html, manifest.json, sitemap.xml / sitemap.txt, favicon.svg, assets/)
.agents/
  skills/
    main/
      toast-random-number/
        SKILL.md      ← optional Agent Skills for the main conversation
  tools/
    main/
      generate_random_number.json ← optional executable tool definition
.github/
  workflows/
    deploy-pages.yml  ← the build + deploy workflow (no changes needed)
```

### Declarative Agent Skills (`.agents/skills/main/`)

Agent Skills follow the open Agent Skills format. Place skills in `.agents/skills/main/<skill-name>/SKILL.md`.

#### Frontmatter specification

- **Required fields**:
  - `name`: 1–64 characters using lowercase letters, digits, and single hyphens.
  - `description`: Up to 1,024 characters describing what the skill does.
- **Optional standard fields**:
  - `license`, `compatibility`, `user-invocable`, `disable-model-invocation`, `argument-hint`.
  - `metadata`: Key-value map for skill metadata. Tool allowlists belong under `metadata.allowed-tools` (e.g. `allowed-tools: javascript show_toast generate_random_number`).
  - `execution`: Defines deterministic execution tool chains.

#### Slash Commands & User Invocability

Skills with `user-invocable: true` (or where `user-invocable` is omitted) can be invoked directly by users in chat using slash commands matching the skill name (for example `/toast-random-number` or `/skill-creator`).

#### Declarative Execution Pipelines (`execution.type: "tools"`)

Skills can define deterministic, sequential tool pipelines in frontmatter. When triggered via slash command or agent invocation, tool chains execute directly via `executeToolChain` on the worker thread without scheduling LLM prompts or calling model endpoints.

```yaml
---
name: toast-random-number
description: Generate a random integer from 1 to 1000000 and display it in a toast notification silently.
user-invocable: true
metadata:
  allowed-tools: javascript show_toast generate_random_number
execution:
  type: tools
  suppressToast: true
  suppressOutput: true
  tools:
    - name: generate_random_number
      input:
        min: 1
        max: 1000000
    - name: show_toast
      input:
        title: Random Number
        message:
          $pipe: prev
---
```

#### Pipeline Features

1. **Output Pipelining (`$pipe`)**: Pass outputs between steps using:
   - `{ "$pipe": "prev" }` — output of the immediately preceding step.
   - `{ "$pipe": 0 }` — output of step index 0.
   - `{ "$pipe": "generate_random_number" }` — output of the step executing `generate_random_number`.
2. **Notification & Output Suppression**:
   - `suppressToast: true` — suppresses step-by-step progress toasts ("Running skill tool...").
   - `suppressOutput: true` — suppresses raw step output blocks from cluttering the chat thread.
   - Setting suppression at the top-level `execution` block automatically cascades down to all steps in the chain.
3. **Auto-returning JavaScript Evaluation**: Single expressions in `javascript` tool steps (e.g., `Math.floor(Math.random() * 100) + 1`) evaluate and return automatically without requiring explicit `return` statements.

#### Storage & Scope

Skills are seeded into the main conversation's OPFS workspace (`.agents/skills/main/`) on initial boot. They do not become host filesystem commands and are scoped to the main workspace.

---

### Declarative Tools (`.agents/tools/main/`)

Add executable tools under `.agents/tools/main/` as JSON files. Each file defines a standard tool schema and an explicit `execution` object.

```json
{
  "name": "generate_random_number",
  "description": "Generate a random integer within a specified range.",
  "input_schema": {
    "type": "object",
    "properties": {
      "min": { "type": "integer", "description": "Minimum value (inclusive)" },
      "max": { "type": "integer", "description": "Maximum value (inclusive)" }
    },
    "required": ["min", "max"]
  },
  "execution": {
    "type": "javascript",
    "code": "const input = typeof data === 'string' ? JSON.parse(data) : data; const min = Number(input?.min ?? 1); const max = Number(input?.max ?? 100); return Math.floor(Math.random() * (max - min + 1)) + min;"
  }
}
```

#### Execution Types

- **`javascript`**: Runs inside ShadowClaw's sandboxed JavaScript worker. The parsed arguments are available via `data`. Single expressions evaluate and return automatically.
- **`bash`**: Runs through the sandboxed JS shell / WebVM. Arguments are passed as serialized JSON via `stdin`.
- **`tool`**: Delegates to another allowlisted ShadowClaw tool with optional pre-configured input parameter merging.

#### Execution Guardrails & WebMCP:

- Tool names must match `^[a-z][a-z0-9_]{0,63}$`.
- Built-in tool names cannot be shadowed.
- Declarative tool delegation is capped at eight levels to prevent recursion loops.
- Loaded declarative tools automatically register with the browser's WebMCP Model Context API (`document.modelContext` / `navigator.modelContext`) for native model execution.

---

## Declarative Site Configuration (`shadow-claw.config.json`)

Configure your site metadata, branding, navigation visibility, tool defaults, and sorting declaratively without touching source code:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "site": {
    "title": "My Site",
    "description": "Published with ShadowClaw",
    "themeColor": "#121212",
    "lang": "en"
  },
  "branding": {
    "titleText": "My Project",
    "siteUrl": "https://example.com",
    "repoUrl": "https://github.com/my-user/my-project"
  },
  "sidebar": {
    "pagesHidden": false,
    "chatHidden": false,
    "tasksHidden": true,
    "filesHidden": false,
    "defaultPage": "pages"
  },
  "pages": {
    "sortOrder": "desc"
  },
  "enabledTools": [
    "bash",
    "javascript",
    "read_file",
    "write_file",
    "generate_random_number"
  ],
  "customElements": {
    "allowedElements": ["block-garden", "block-garden-select", "x-pwgen"],
    "allowedDomains": ["kherrick.github.io", "xt-ml.github.io"],
    "scripts": [
      "https://kherrick.github.io/block-garden/block-garden-bundle-min.mjs"
    ]
  }
}
```

### Initial Tool Enablement (`enabledTools`)

`enabledTools` specifies the initial active tool profile applied on first run for the main conversation. When omitted, ShadowClaw uses its standard default tool profile. User modifications made later in the UI are preserved.

### Version Pinning

ShadowClaw builds via `npx --yes shadow-claw@latest build --prod`. To pin to a specific npm release (e.g. `1.23.3`), specify the version in `.github/workflows/deploy-pages.yml` or supply `shadowclaw_version` when triggering the GitHub Actions workflow manually.

### Skill & Page Purge Markers

To reset bundled skills on a later deployment, add a Markdown file under `.agents/skills/main/` with this frontmatter, updating `purge-id` for each reset:

```markdown
---
slug: shadow-claw--purge-skills
purge-id: skills-build-002
---
```

The purge marker is removed from the catalog before seeding, and the main conversation's `.agents/skills/main/` OPFS directory is cleared and re-seeded with current published skills. Page purge markers (`slug: shadow-claw--purge-pages`) operate independently.

### Sidebar Visibility Options

You can hide or show individual sidebar navigation items (`pagesHidden`, `chatHidden`, `tasksHidden`, `filesHidden`) and set the default landing section (`defaultPage`: `"pages"` | `"chat"` | `"tasks"` | `"files"`). When hidden, the corresponding section is hidden from the sidebar at build time and on first boot.

### Custom Element & Script Security (`customElements`)

ShadowClaw enforces a deny-by-default security stance on custom elements and external scripts rendered within articles and pages. Site authors can declare approved elements and trusted host domains in `customElements`:

- `allowedElements`: List of custom element tag names permitted in page markup and HTML sanitization (e.g. `["block-garden", "block-garden-select"]`). Unapproved custom elements are blocked from registration and stripped from the DOM.
- `allowedDomains`: List of approved domains or wildcard patterns (e.g. `["kherrick.github.io", "*.github.io"]`) permitted to load scripts or custom element bundles.
- `scripts`: Array of approved script URLs (or objects `{ "src": "...", "type": "module" }`) to preload at build time and on boot.

---

## Pretty paths (`routes.json`)

Map source files to clean URLs:

```json
{
  "routes": {
    "/pages/main/index.html": { "prettyPath": "/main" },
    "/pages/main/~/content/about.md": { "prettyPath": "/main/about" },
    "/pages/main/MEMORY.md": { "prettyPath": "/main/memory" }
  }
}
```

The prerender pipeline generates a physical `index.html` for every mapped path so direct links and page refreshes work correctly on GitHub Pages without any server-side rewrites.

> **Reserved path prefixes** — the following first-path-segments are owned by ShadowClaw's router and **must not** be used as pretty path prefixes: `/`, `/chat`, `/files`, `/tasks`, `/pages`, `/settings`, `/tools`, `/channels`. Additionally, `/` (root) is reserved as the default pinned page and is unreachable as a pretty path. Use a safe namespace like `/main/`, `/articles/`, `/docs/`, or any other prefix that doesn't conflict with the above list.

---

## Default Pinned Page (`/`)

When a visitor loads the root URL (`/`) of your published site, ShadowClaw automatically displays the **default pinned page**.

### How ShadowClaw selects the default page for `/`:

1. Both the static site build pipeline (`prerender-dsd-shell`) and runtime page store (`orchestratorStore`) collect all files in `pages/main/`.
2. `MEMORY.md` is always sorted to the bottom of the list.
3. All other pages are sorted by `pages.sortOrder` from `shadow-claw.config.json` (`"desc"` by default, natural numeric, or `"asc"`).
4. The first file in this sorted list (`pages[0]`) becomes the **default page** pre-rendered into the DSD shell at `/`.

---

## Custom domain

If you use a custom apex domain (e.g. `example.com`), override the two URL env vars in the workflow:

```yaml
env:
  PAGES_ORIGIN: "https://example.com/"
  PAGES_BASE_PATH: "/"
```

---

## In-browser automation (optional)

You can drive publishing from inside the ShadowClaw app itself using a `type: "tools"` task chain — no LLM calls required:

```json
{
  "type": "tools",
  "tools": [
    {
      "name": "write_file",
      "input": {
        "path": "repos/my-site/pages/main/post.md",
        "content": "# Hello\n\nContent."
      }
    },
    {
      "name": "git_add",
      "input": { "repo": "my-site", "files": ["pages/main/post.md"] }
    },
    {
      "name": "git_commit",
      "input": { "repo": "my-site", "message": "publish: new post" }
    },
    { "name": "git_push", "input": { "repo": "my-site" } }
  ]
}
```

Pushing triggers the workflow, which builds and publishes the site automatically.
