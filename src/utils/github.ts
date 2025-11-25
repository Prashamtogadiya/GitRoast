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
}

export async function fetchUserProfile(username: string): Promise<GitHubProfile> {
  const response = await fetch(`https://api.github.com/users/${username}`);
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
  const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`);
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
  const response = await fetch(`https://api.github.com/users/${username}/events/public?per_page=20`);
  if (!response.ok) {
    // Events are not critical, return empty array on failure
    return [];
  }
  return response.json();
}

export async function fetchRepoReadme(username: string, repo: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${username}/${repo}/readme`, {
      headers: {
        'Accept': 'application/vnd.github.raw'
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
