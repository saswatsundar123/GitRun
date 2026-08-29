# GitRun Chrome Extension

Manifest V3 Chrome extension — Phase 1 stub.

**Phase 6** will implement:
- Language badge detection from the GitHub DOM
- `▶ Run in Browser` button injection next to GitHub's "Code" dropdown
- Routing to `https://gitrun.dev/run?repo=<repo_url>`
- Button state machine (supported / unsupported / unknown)

## Loading in dev

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select this `packages/extension/` directory
4. Navigate to any `github.com/<owner>/<repo>` page
5. Check the browser console for `[GitRun] content script loaded.`
