import { Routes, Route } from "react-router-dom";

// Phase 5 will replace these stubs with full implementations.
function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[--color-surface] text-white">
      <h1 className="text-4xl font-bold tracking-tight">GitRun</h1>
      <p className="mt-3 text-[--color-muted]">
        Run any GitHub repo. Right here. Right now.
      </p>
      <p className="mt-8 text-sm text-[--color-muted]">
        Paste a GitHub URL or use the{" "}
        <code className="rounded bg-[--color-surface-2] px-1 py-0.5 text-xs">
          ?repo=
        </code>{" "}
        query parameter.
      </p>
    </main>
  );
}

function RunPage() {
  const params = new URLSearchParams(window.location.search);
  const repo = params.get("repo");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[--color-surface] text-white">
      <h1 className="text-2xl font-semibold">RunPage stub</h1>
      {repo ? (
        <p className="mt-3 break-all text-sm text-[--color-muted]">
          Detected repo: <span className="text-white">{repo}</span>
        </p>
      ) : (
        <p className="mt-3 text-sm text-[--color-muted]">
          No <code>?repo=</code> parameter supplied.
        </p>
      )}
      <p className="mt-6 text-xs text-[--color-muted]">
        Detection pipeline and runners land in Phase 2 / 3.
      </p>
    </main>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/run" element={<RunPage />} />
    </Routes>
  );
}
