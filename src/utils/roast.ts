import type { GitHubProfile, GitHubRepo } from './github';

// Simple string hashing for deterministic seed
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Deterministic random number generator
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function generateRoast(profile: GitHubProfile, repos: GitHubRepo[]): string[] {
  const roasts: string[] = [];
  const seed = hashString(profile.login);
  let currentSeed = seed;

  const nextRandom = () => {
    const r = seededRandom(currentSeed);
    currentSeed++;
    return r;
  };

  const pickOne = (options: string[]) => options[Math.floor(nextRandom() * options.length)];

  // 1. Bio Roast
  if (!profile.bio) {
    roasts.push(pickOne([
      "No bio? You're mysterious, or just lazy. Probably lazy.",
      "Your bio is as empty as your commit history on weekends.",
      "A ghost has more personality than your profile bio."
    ]));
  } else if (profile.bio.length < 20) {
    roasts.push(pickOne([
      `"${profile.bio}" - wow, don't strain yourself with all those words.`,
      "Short bio. Saving your energy for writing bugs?",
      "Minimalist bio. I bet your code comments are just as helpful."
    ]));
  } else if (profile.bio.toLowerCase().includes('student') || profile.bio.toLowerCase().includes('learning')) {
    roasts.push(pickOne([
      "Ah, a 'lifelong learner'. Code for 'I still copy-paste from StackOverflow'.",
      "Student of the game? Hopefully you graduate to writing tests one day.",
      "Learning is great. Shipping is better. Just saying."
    ]));
  }

  // 2. Follower/Following Ratio
  if (profile.followers < 5 && profile.following > 20) {
    roasts.push(pickOne([
      "Following everyone, followed by no one. The GitHub equivalent of a stalker.",
      "Your follower count is lower than the number of bugs in your last PR.",
      "You're shouting into the void, and the void isn't following back."
    ]));
  } else if (profile.followers > 100 && profile.public_repos < 5) {
    roasts.push(pickOne([
      "Famous for what? Tweeting? Because it sure isn't code.",
      "Influencer vibes. All clout, no commits.",
      "More followers than lines of code written this year."
    ]));
  }

  // 3. Repo Stats
  const totalStars = repos.reduce((acc, repo) => acc + repo.stargazers_count, 0);
  const forkedRepos = repos.filter(r => r.fork).length;
  const originalRepos = repos.length - forkedRepos;

  if (repos.length === 0) {
    roasts.push(pickOne([
      "Zero repositories. Are you here for the free stickers?",
      "Your profile is a blank canvas. A very, very blank canvas.",
      "No code? No problem. Just don't call yourself a developer."
    ]));
  } else if (totalStars === 0) {
    roasts.push(pickOne([
      `You have ${repos.length} repos and 0 stars. Even your mom hasn't starred your projects.`,
      "A perfect zero stars. Consistency is key!",
      "Your code is so underground, literally no one has found it."
    ]));
  } else if (totalStars < 5 && repos.length > 20) {
    roasts.push(pickOne([
      "Quantity over quality, I see.",
      "Spamming repos hoping one sticks? It's not working.",
      "So many repos, so little interest. It's almost tragic."
    ]));
  }

  if (forkedRepos > originalRepos && repos.length > 10) {
    roasts.push(pickOne([
      "Fork master! Do you ever write your own code?",
      "Your profile is basically a bookmark collection.",
      "Ctrl+C, Ctrl+V is your favorite workflow."
    ]));
  }

  // 4. Language Roast
  const languages = repos.map(r => r.language).filter(Boolean) as string[];
  const uniqueLangs = new Set(languages);
  
  if (uniqueLangs.has('Java')) {
    roasts.push(pickOne([
      "Java developer? I can smell the boilerplate from here.",
      "AbstractFactorySingletonProxyBean... did I scare you?",
      "You probably think verbose code means 'enterprise quality'."
    ]));
  }
  if (uniqueLangs.has('PHP')) {
    roasts.push(pickOne([
      "PHP in 2024? Blink twice if you're being held hostage.",
      "The 90s called, they want their backend back.",
      "Dollar signs everywhere. Too bad none of them are in your bank account."
    ]));
  }
  if (uniqueLangs.has('JavaScript') || uniqueLangs.has('TypeScript')) {
    roasts.push(pickOne([
      "Another JS dev. How many node_modules does it take to screw in a lightbulb?",
      "npm install life --save-dev. Oh wait, package not found.",
      "Undefined is not a function. Neither is your career plan."
    ]));
  }
  if (uniqueLangs.has('HTML')) {
    roasts.push(pickOne([
      "HTML is a programming language! ...said no one ever.",
      "<div><div><div>Help me</div></div></div>",
      "You center divs for a living. Respect? Maybe."
    ]));
  }

  // 5. Activity
  const lastUpdate = new Date(profile.updated_at).getTime();
  const now = new Date().getTime();
  const daysSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24);

  if (daysSinceUpdate > 90) {
    roasts.push(pickOne([
      "Your profile is gathering dust. Blow on the cartridge and try again.",
      "Dormant. Like a volcano, but without the explosive potential.",
      "Have you considered... coding?"
    ]));
  }

  // Fallback if we don't have enough roasts
  if (roasts.length < 3) {
    roasts.push(pickOne([
      "You're so average, I can't even find anything specific to roast.",
      "Your profile is the vanilla ice cream of GitHub.",
      "You exist. That's about it."
    ]));
  }

  // Shuffle and return top 4-5
  return roasts.sort(() => nextRandom() - 0.5).slice(0, 5);
}
