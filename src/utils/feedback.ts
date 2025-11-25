import type { GitHubProfile, GitHubRepo } from './github';

export function generateFeedback(profile: GitHubProfile, repos: GitHubRepo[]): string[] {
  const feedback: string[] = [];

  // Bio
  if (!profile.bio) {
    feedback.push("Add a bio! A short description helps people know who you are and what you do.");
  }

  // Readmes
  // Note: We can't check readmes directly without more API calls, but we can infer from descriptions
  const reposWithDesc = repos.filter(r => r.description).length;
  if (repos.length > 0 && reposWithDesc / repos.length < 0.5) {
    feedback.push("Add descriptions to your repositories. It helps others understand your projects at a glance.");
  }

  // Pinned/Starred (Proxy: check if they have any highly starred repos)
  const hasPopularRepo = repos.some(r => r.stargazers_count > 5);
  if (!hasPopularRepo && repos.length > 5) {
    feedback.push("Try to polish one of your projects to get some community traction. Good documentation helps!");
  }

  // Activity
  const lastUpdate = new Date(profile.updated_at).getTime();
  const now = new Date().getTime();
  const daysSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24);
  
  if (daysSinceUpdate > 30) {
    feedback.push("Your profile looks a bit inactive. Pushing a small update or contributing to open source can help!");
  }

  // Location/Company
  if (!profile.location && !profile.company) {
    feedback.push("Consider adding your location or company/university to build more trust.");
  }

  // Default positive feedback
  if (feedback.length === 0) {
    feedback.push("Your profile looks great! Keep up the good work.");
    feedback.push("Maybe try contributing to a major open source project next?");
  }

  return feedback;
}
