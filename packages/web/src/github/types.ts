// ---------------------------------------------------------------------------
// GitHub REST API — response types used by GitRun
// Only fields GitRun actually reads are typed; the rest is discarded.
// ---------------------------------------------------------------------------

export interface RepoMeta {
  owner: string;
  repo: string;
  /** Primary language as reported by GitHub (e.g. "Python", "TypeScript"). */
  language: string | null;
  description: string | null;
  /** GitHub topics (e.g. ["gradio", "ai", "demo"]). */
  topics: string[];
  default_branch: string;
  /** Whether the repository is private. Always false for public repos. */
  private: boolean;
}

export interface ContentEntry {
  name: string;
  path: string;
  /** "file" | "dir" | "submodule" | "symlink" */
  type: "file" | "dir" | "submodule" | "symlink";
  /** Present for files; absent for dirs. */
  download_url: string | null;
  sha: string;
  size: number;
}

// ---------------------------------------------------------------------------
// Error discriminant — callers pattern-match on `kind`, never on `.message`.
// ---------------------------------------------------------------------------

export type GitRunErrorKind =
  | "not_found"     // 404 — repo doesn't exist or is private
  | "rate_limited"  // 403/429 with X-RateLimit-Remaining: 0
  | "private"       // 404 where we have strong reason to believe it's private
  | "network";      // fetch() itself threw (offline, CORS, etc.)

export interface GitRunError {
  readonly _error: true;
  readonly kind: GitRunErrorKind;
  readonly message: string;
  /** HTTP status if available. */
  readonly status?: number;
}

export function isError(v: unknown): v is GitRunError {
  return typeof v === "object" && v !== null && (v as GitRunError)._error === true;
}
