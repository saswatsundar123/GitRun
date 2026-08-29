# GitRun

> **"We can't leak your API keys because we never see them."**

[![Run in Browser](https://img.shields.io/badge/gitrun-run%20in%20browser-22c55e?style=flat)](https://gitrun.pages.dev/run?repo=https://github.com/saswatsundar123/GitRun)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat)](LICENSE)

**Run any GitHub repository directly in your browser. No terminal. No installation. No account.**

GitRun detects the language and framework of any public GitHub repo, routes it to the right WebAssembly runtime (Pyodide, WebContainers, Gradio Lite, or stlite), installs dependencies, and launches it — entirely client-side. No servers. No cost.

---

## How it works

1. Paste a GitHub URL or use the `?repo=` query parameter: `https://gitrun.pages.dev/run?repo=<github_url>`
2. GitRun fetches repo metadata via the GitHub REST API
3. It detects the framework (Gradio, Streamlit, React, Next.js, etc.)
4. Dependencies install in the browser via micropip or npm
5. The app runs — in an embedded terminal or iframe preview

## Supported runtimes

| Language | Framework | Runtime |
|---|---|---|
| Python | Gradio | Gradio Lite (`@gradio/lite`) |
| Python | Streamlit | stlite (`@stlite/browser`) |
| Python | CLI / generic | Pyodide + xterm.js |
| JS / TS | React, Vue, Svelte, Next.js | WebContainers + iframe |
| JS / TS | Express, generic Node.js | WebContainers + terminal |

## API key handling

Many AI apps need API keys. GitRun asks for them before running and keeps them in browser memory only — never written to `localStorage`, cookies, or any server. When the tab closes, the key is gone.

This is guaranteed by architecture: there are no servers for keys to go to.

## Entry points

- **Web app:** `https://gitrun.pages.dev/run?repo=<github_url>`
- **Browser extension:** Injects a `▶ Run in Browser` button on GitHub repo pages (Chrome MV3, Phase 6)
- **README badge:** Embed in your own project's README:

```markdown
[![Run in Browser](https://gitrun.pages.dev/badge.svg)](https://gitrun.pages.dev/run?repo=https://github.com/YOUR_USERNAME/YOUR_REPO)
```

## Project structure

```
gitrun/
├── packages/
│   ├── web/          # Vite + React + TypeScript web app
│   │   └── src/
│   │       ├── github/     # GitHub REST API client
│   │       ├── detector/   # Framework detection engine (Phase 2)
│   │       ├── runners/    # Runtime adapters (Phase 3)
│   │       ├── security/   # Pre-run safety checks (Phase 4)
│   │       └── ui/         # React components (Phase 5)
│   └── extension/    # Chrome MV3 extension (Phase 6)
└── docs/             # Architecture docs
```

## Development

```bash
# Install dependencies
pnpm install

# Start dev server (localhost:5173)
pnpm --filter @gitrun/web dev

# Build all packages
pnpm turbo build

# Type-check
pnpm turbo type-check
```

Requires Node ≥ 20 and pnpm ≥ 9.

## Deployment

Deployed automatically to Cloudflare Pages on push to `main`. Required GitHub secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Security model

- All code runs inside the browser's native sandbox
- Cannot access your file system, spawn processes, or persist anything
- COOP/COEP headers enforced in both dev and production (required for WebContainers + Pyodide SharedArrayBuffers)
- Pre-run static checks: OSV CVE scan, typosquatting detection, obfuscation detection
- Full transparency panel before every run: "What can this app do?"

See [GITRUN_PRD.md](https://github.com/saswatsundar123/GitRun/blob/main/internal_dev/GITRUN_PRD.md) for the full product spec.

## License

MIT — see [LICENSE](LICENSE).

---

*GitRun is not affiliated with GitHub, Microsoft, StackBlitz, or any other company whose technologies are referenced in this project.*
