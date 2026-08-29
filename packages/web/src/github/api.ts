// ---------------------------------------------------------------------------
// GitHub REST API client
//
// Design rules (enforced structurally):
//   • `token` is always an optional parameter — the caller holds it in a local
//     variable. This module never reads or writes any storage (localStorage,
//     sessionStorage, cookies, IndexedDB). It cannot accidentally leak keys.
//   • Functions never throw across the public boundary — all error paths are
//     returned as GitRunError so callers get exhaustive type coverage.
//   • AbortSignal is accepted everywhere so the UI can cancel in-flight fetches
//     (e.g. when the user navigates away mid-detection).
// ---------------------------------------------------------------------------

import type {
  ContentEntry,
  GitRunError,
  GitRunErrorKind,
  RepoMeta,
} from "./types";

const BASE = "https://api.github.com";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function makeError(
  kind: GitRunErrorKind,
  message: string,
  status?: number
): GitRunError {
  return { _error: true, kind, message, status };
}

function authHeaders(token: string | undefined): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) {
    // Token is passed by value from the caller's local variable — this
    // function is synchronous and adds no persistence.
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Shared fetch wrapper. Converts HTTP errors and network failures into
 * GitRunError. Returns the parsed JSON body on success.
 */
async function ghFetch<T>(
  url: string,
  token: string | undefined,
  signal: AbortSignal | undefined
): Promise<T | GitRunError> {
  let res: Response;
  try {
    res = await fetch(url, { headers: authHeaders(token), signal });
  } catch (err) {
    // fetch() itself threw — network failure, CORS, or abort.
    if (err instanceof DOMException && err.name === "AbortError") {
      return makeError("network", "Request was aborted.");
    }
    return makeError(
      "network",
      `Network error: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (res.ok) {
    return (await res.json()) as T;
  }

  // GitHub returns 403 with X-RateLimit-Remaining: 0 when unauthenticated
  // requests are exhausted, and sometimes 429 as well.
  const remaining = res.headers.get("X-RateLimit-Remaining");
  if (
    (res.status === 403 || res.status === 429) &&
    remaining === "0"
  ) {
    const reset = res.headers.get("X-RateLimit-Reset");
    const resetAt = reset
      ? new Date(parseInt(reset, 10) * 1000).toLocaleTimeString()
      : "soon";
    return makeError(
      "rate_limited",
      `GitHub rate limit hit. Resets at ${resetAt}. Add a GitHub token to raise the limit to 5,000 requests/hour.`,
      res.status
    );
  }

  if (res.status === 404) {
    return makeError(
      "not_found",
      "This repo doesn't exist or is private. GitRun only works with public repos for now.",
      404
    );
  }

  // Catch-all for other 4xx / 5xx.
  return makeError(
    "network",
    `GitHub API returned ${res.status}. Try again in a moment.`,
    res.status
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch top-level repository metadata (language, topics, default branch).
 *
 * @param owner  GitHub username or org (e.g. "gradio-app")
 * @param repo   Repository name (e.g. "gradio")
 * @param token  Optional GitHub PAT — held by the caller, never stored here
 * @param signal Optional AbortSignal for cancellation
 */
export async function getRepoMeta(
  owner: string,
  repo: string,
  token?: string,
  signal?: AbortSignal
): Promise<RepoMeta | GitRunError> {
  const url = `${BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const raw = await ghFetch<{
    language: string | null;
    description: string | null;
    topics: string[];
    default_branch: string;
    private: boolean;
  }>(url, token, signal);

  if ("_error" in raw) return raw;

  return {
    owner,
    repo,
    language: raw.language,
    description: raw.description,
    topics: raw.topics ?? [],
    default_branch: raw.default_branch,
    private: raw.private,
  };
}

/**
 * List the files and directories at the repository root.
 *
 * @param owner  GitHub username or org
 * @param repo   Repository name
 * @param token  Optional GitHub PAT
 * @param signal Optional AbortSignal
 */
export async function listRootContents(
  owner: string,
  repo: string,
  token?: string,
  signal?: AbortSignal
): Promise<ContentEntry[] | GitRunError> {
  const url = `${BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/`;
  const raw = await ghFetch<Array<{
    name: string;
    path: string;
    type: "file" | "dir" | "submodule" | "symlink";
    download_url: string | null;
    sha: string;
    size: number;
  }>>(url, token, signal);

  if ("_error" in raw) return raw;

  return raw.map((entry) => ({
    name: entry.name,
    path: entry.path,
    type: entry.type,
    download_url: entry.download_url,
    sha: entry.sha,
    size: entry.size,
  }));
}

/**
 * Fetch the text content of a single file in the repository.
 * GitHub returns file contents as base64-encoded JSON — this function
 * decodes that transparently and returns the plain text.
 *
 * @param owner  GitHub username or org
 * @param repo   Repository name
 * @param path   File path relative to root (e.g. "requirements.txt")
 * @param token  Optional GitHub PAT
 * @param signal Optional AbortSignal
 */
export async function fetchFileText(
  owner: string,
  repo: string,
  path: string,
  token?: string,
  signal?: AbortSignal
): Promise<string | GitRunError> {
  const url = `${BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path}`;
  const raw = await ghFetch<{ content: string; encoding: string }>(
    url,
    token,
    signal
  );

  if ("_error" in raw) return raw;

  if (raw.encoding !== "base64") {
    // Should never happen for normal files, but guard it.
    return makeError(
      "network",
      `Unexpected encoding from GitHub API: ${raw.encoding}`
    );
  }

  // atob handles standard base64; GitHub wraps lines with \n.
  try {
    return atob(raw.content.replace(/\n/g, ""));
  } catch {
    return makeError("network", `Failed to decode base64 content for ${path}`);
  }
}

/**
 * Convenience: parse a full GitHub URL into { owner, repo }.
 * Returns null if the URL is not a recognisable github.com repo URL.
 *
 * Examples accepted:
 *   https://github.com/gradio-app/gradio
 *   https://github.com/gradio-app/gradio/tree/main/demo
 */
export function parseGitHubUrl(
  url: string
): { owner: string; repo: string } | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "github.com") return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1] };
  } catch {
    return null;
  }
}
