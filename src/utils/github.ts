export interface GitHubProfile {
  login: string;
  avatar_url: string;
  html_url: string;
  name: string;
  company: string | null;
  blog: string;
  location: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  fork: boolean;
  forks_count: number;
  updated_at: string;
  size: number; // NEW: repo size (KB)
}

export async function fetchUserProfile(username: string): Promise<GitHubProfile> {
  const response = await apiFetch(`https://api.github.com/users/${username}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('User not found');
    }
    if (response.status === 403) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }
    throw new Error('Failed to fetch user profile');
  }
  return response.json();
}

export async function fetchUserRepos(username: string): Promise<GitHubRepo[]> {
  const response = await apiFetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`);
  if (!response.ok) {
    throw new Error('Failed to fetch user repositories');
  }
  return response.json();
}

export interface GitHubEvent {
  type: string;
  created_at: string;
  repo: {
    name: string;
  };
  payload: {
    commits?: Array<{
      message: string;
    }>;
  };
}

export async function fetchUserEvents(username: string): Promise<GitHubEvent[]> {
  const response = await apiFetch(`https://api.github.com/users/${username}/events/public?per_page=20`);
  if (!response.ok) {
    // Events are not critical, return empty array on failure
    return [];
  }
  return response.json();
}

export async function fetchRepoReadme(username: string, repo: string): Promise<string | null> {
  try {
    const response = await apiFetch(`https://api.github.com/repos/${username}/${repo}/readme`, {
      headers: {
        Accept: 'application/vnd.github.raw'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.text();
  } catch (error) {
    return null;
  }
}

// New types for richer repo data
export interface GitHubCommit {
  sha: string;
  html_url?: string;
  commit: {
    message: string;
    author: {
      name: string;
      email?: string;
      date: string;
    };
  };
  author?: {
    login: string;
    avatar_url?: string;
    html_url?: string;
  } | null;
  parents?: Array<{ sha: string }>;
}

export interface GitHubContributorStats {
  total: number;
  author: {
    login: string;
    id: number;
    avatar_url?: string;
    html_url?: string;
  };
  weeks?: Array<{
    w: number; // unix timestamp
    a: number; // additions
    d: number; // deletions
    c: number; // commits
  }>;
}

export type GitHubLanguages = { [language: string]: number };

export interface GitHubBranch {
  name: string;
  protected?: boolean;
  commit: {
    sha: string;
    url?: string;
  };
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  html_url: string;
  user: {
    login: string;
  };
  created_at: string;
  closed_at: string | null;
}

export interface GitHubPull {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  merged_at: string | null;
  html_url: string;
  user: {
    login: string;
  };
  created_at: string;
  closed_at: string | null;
}

export interface GitHubGist {
  id: string;
  html_url: string;
  description: string | null;
  public: boolean;
  files: { [filename: string]: { filename: string; type?: string; language?: string; raw_url?: string } };
  created_at: string;
  updated_at: string;
  comments: number;
  owner?: {
    login: string;
  } | null;
}

// New helper functions

// 1. Get commits for a repo; optional author to filter by username
export async function fetchRepoCommits(owner: string, repo: string, author?: string): Promise<GitHubCommit[]> {
  const params = new URLSearchParams({ per_page: '100' });
  if (author) params.set('author', author);
  const url = `https://api.github.com/repos/${owner}/${repo}/commits?${params.toString()}`;
  const res = await apiFetch(url);
  if (!res.ok) {
    // Return empty list on failure (caller can treat as no commits or handle separately)
    return [];
  }
  return res.json();
}

// 2. Get contributor stats (may return 202 while being generated)
export async function fetchRepoContributorStats(owner: string, repo: string): Promise<GitHubContributorStats[] | null> {
  const url = `https://api.github.com/repos/${owner}/${repo}/stats/contributors`;
  const res = await apiFetch(url);
  if (res.status === 202) {
    // GitHub is generating the stats; return null so caller can decide to retry
    return null;
  }
  if (!res.ok) {
    return null;
  }
  return res.json();
}

// 3. Get languages used in a repo
export async function fetchRepoLanguages(owner: string, repo: string): Promise<GitHubLanguages> {
  const url = `https://api.github.com/repos/${owner}/${repo}/languages`;
  const res = await apiFetch(url);
  if (!res.ok) {
    return {};
  }
  return res.json();
}

// 4. Get branches for a repo
export async function fetchRepoBranches(owner: string, repo: string): Promise<GitHubBranch[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`;
  const res = await apiFetch(url);
  if (!res.ok) {
    return [];
  }
  return res.json();
}

// 5. Get issues created by a user in a repo (all states)
export async function fetchRepoIssuesByCreator(owner: string, repo: string, creator: string): Promise<GitHubIssue[]> {
  const params = new URLSearchParams({ state: 'all', creator, per_page: '100' });
  const url = `https://api.github.com/repos/${owner}/${repo}/issues?${params.toString()}`;
  const res = await apiFetch(url);
  if (!res.ok) {
    return [];
  }
  return res.json();
}

// 5b. Get pulls created by a user in a repo (all states)
export async function fetchRepoPullsByCreator(owner: string, repo: string, creator: string): Promise<GitHubPull[]> {
  const params = new URLSearchParams({ state: 'all', per_page: '100' });
  // GitHub pulls API doesn't support creator filter in query string same as issues; use creator param if needed via search or filter locally
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls?${params.toString()}`;
  const res = await apiFetch(url);
  if (!res.ok) {
    return [];
  }
  const pulls: GitHubPull[] = await res.json();
  // If creator filtering is required, filter locally to ensure correct results
  return pulls.filter(p => p.user?.login?.toLowerCase() === creator.toLowerCase());
}

// 6. Get user's gists
export async function fetchUserGists(username: string): Promise<GitHubGist[]> {
  const url = `https://api.github.com/users/${username}/gists?per_page=100`;
  const res = await apiFetch(url);
  if (!res.ok) {
    return [];
  }
  return res.json();
}

// New helper: get full repo details (includes size and other fields)
export async function fetchRepoDetails(owner: string, repo: string): Promise<GitHubRepo | null> {
  try {
    const res = await apiFetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    return null;
  }
}

// New aggregated type for richer repo data
export interface FullRepoData {
  repo: GitHubRepo;
  readme: string | null;
  commits: GitHubCommit[]; // filtered by author when username provided
  contributorStats: GitHubContributorStats[] | null;
  languages: GitHubLanguages;
  branches: GitHubBranch[];
  issuesByCreator: GitHubIssue[]; // issues created by username (if provided) otherwise []
  pullsByCreator: GitHubPull[];   // pulls created by username (if provided) otherwise []
}

// Aggregator: fetch the richer data for a repository.
// owner, repo: repo owner/name
// username (optional): used to filter commits/issues/pulls to that user when desired
// repoObj (optional): pass the existing GitHubRepo to preserve metadata and avoid placeholder
export async function fetchFullRepoData(
  owner: string,
  repo: string,
  username?: string,
  repoObj?: GitHubRepo
): Promise<FullRepoData> {
  // Run independent requests in parallel
  const [
    readme,
    commits,
    contributorStats,
    languages,
    branches,
    issuesByCreator,
    pullsByCreator
  ] = await Promise.all([
    // readme
    fetchRepoReadme(owner, repo).catch(() => null),
    // commits (filter by author if username provided)
    fetchRepoCommits(owner, repo, username).catch(() => []),
    // contributor stats (may be null if GitHub returns 202 or error)
    fetchRepoContributorStats(owner, repo).catch(() => null),
    // languages
    fetchRepoLanguages(owner, repo).catch(() => ({})),
    // branches
    fetchRepoBranches(owner, repo).catch(() => []),
    // issues created by username (or empty if username not provided)
    username ? fetchRepoIssuesByCreator(owner, repo, username).catch(() => []) : Promise.resolve([]),
    // pulls created by username (or empty if username not provided)
    username ? fetchRepoPullsByCreator(owner, repo, username).catch(() => []) : Promise.resolve([]),]
  );

  // use provided repo object when available to keep real metadata
  const repoInfo: GitHubRepo = repoObj ?? {
    id: -1,
    name: repo,
    html_url: `https://github.com/${owner}/${repo}`,
    description: null,
    stargazers_count: 0,
    language: null,
    fork: false,
    forks_count: 0,
    updated_at: new Date().toISOString(),
    size: 0 // default size
  };

  return {
    repo: repoInfo,
    readme,
    commits,
    contributorStats,
    languages,
    branches,
    issuesByCreator,
    pullsByCreator
  };
}

// New helper: fetch top N repos (using fetchUserRepos) and enrich each with the richer data
export async function fetchUserTopReposDetailed(username: string, topN = 5): Promise<FullRepoData[]> {
  const repos = await fetchUserRepos(username);
  const top = repos.slice(0, topN);
  const enriched = await Promise.all(
    top.map(r =>
      fetchFullRepoData(username, r.name, username, r).catch(() => ({
        repo: r,
        readme: null,
        commits: [],
        contributorStats: null,
        languages: {},
        branches: [],
        issuesByCreator: [],
        pullsByCreator: []
      }))
    )
  );
  return enriched;
}

// Insert/replace: improved GitHub token detection and resilient apiFetch
const GITHUB_TOKEN = (() => {
	// prefer Node-like env, then Vite import.meta, then empty
	try {
		if (typeof (globalThis as any).process !== "undefined" && (globalThis as any).process.env?.GITHUB_TOKEN) {
			return (globalThis as any).process.env.GITHUB_TOKEN;
		}
	} catch {}
	try {
		if (typeof (import.meta as any) !== "undefined" && (import.meta as any).env?.VITE_GITHUB_TOKEN) {
			return (import.meta as any).env.VITE_GITHUB_TOKEN;
		}
	} catch {}
	return "";
})();

if (!GITHUB_TOKEN) {
	// helpful dev-time warning; remove if noisy
	/* eslint-disable no-console */
	console.warn("[GitRoast] No GITHUB_TOKEN found — you may hit rate limits.");
	/* eslint-enable no-console */
}

const defaultHeaders: HeadersInit = {
	Accept: "application/vnd.github.v3+json",
	...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
};

function wait(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Robust fetch wrapper that merges default headers and retries transient errors:
 * - retries on 5xx
 * - retries on 429 or 403 when X-RateLimit-Remaining === "0"
 * - honors Retry-After and X-RateLimit-Reset headers when present
 */
async function apiFetch(url: string, options: RequestInit = {}, maxRetries = 3) {
	const mergedHeaders: HeadersInit = {
		...(defaultHeaders || {}),
		...(options.headers || {}),
	};

	let attempt = 0;
	while (attempt <= maxRetries) {
		const res = await fetch(url, { ...options, headers: mergedHeaders });

		// successful
		if (res.ok) return res;

		const status = res.status;
		const remaining = res.headers.get("x-ratelimit-remaining");
		const reset = res.headers.get("x-ratelimit-reset"); // unix seconds
		const retryAfter = res.headers.get("retry-after"); // seconds

		// rate limit hit (GitHub uses 403 with remaining=0) or explicit 429
		if ((status === 403 && remaining === "0") || status === 429) {
			// calculate waitMs using Retry-After or X-RateLimit-Reset if available
			let waitMs = 0;
			if (retryAfter) {
				const secs = parseInt(retryAfter, 10);
				if (!isNaN(secs)) waitMs = secs * 1000;
			} else if (reset) {
				const resetTs = parseInt(reset, 10) * 1000;
				waitMs = Math.max(0, resetTs - Date.now());
			} else {
				// exponential fallback
				waitMs = Math.pow(2, attempt) * 1000;
			}

			// if we can retry, wait then continue
			if (attempt < maxRetries) {
				await wait(waitMs || Math.pow(2, attempt) * 1000);
				attempt++;
				continue;
			}
			// last attempt: return response so caller can inspect and handle
			return res;
		}

		// server error (5xx) -> retry with backoff
		if (status >= 500 && status < 600) {
			if (attempt < maxRetries) {
				const backoff = Math.pow(2, attempt) * 1000;
				await wait(backoff);
				attempt++;
				continue;
			}
			return res;
		}

		// other client errors (4xx not rate-limit) — do not retry
		return res;
	}

	// fallback (should not reach)
	return fetch(url, { ...options, headers: mergedHeaders });
}
