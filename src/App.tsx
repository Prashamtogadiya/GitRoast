import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Flame } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import { SearchInput } from './components/SearchInput';
import { ProfileCard } from './components/ProfileCard';
import { RoastPanel } from './components/RoastPanel';
import { FeedbackPanel } from './components/FeedbackPanel';
import { fetchUserProfile, fetchUserRepos, fetchUserEvents, fetchRepoReadme, type GitHubProfile, type GitHubRepo } from './utils/github';
import { analyzeProfileWithGroq, type RoastResult } from './utils/ai-roast';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [roastData, setRoastData] = useState<RoastResult | null>(null);
  const [mode, setMode] = useState<'roast' | 'feedback'>('roast');

  const handleSearch = async (username: string) => {
    setIsLoading(true);
    setError(null);
    setProfile(null);
    setRepos([]);
    setRoastData(null);

    try {
      const [userProfile, userRepos, userEvents] = await Promise.all([
        fetchUserProfile(username),
        fetchUserRepos(username),
        fetchUserEvents(username)
      ]);

      setProfile(userProfile);
      setRepos(userRepos);

      // Fetch README for the most popular repo (top of the list usually if sorted by stars, but API default sort is full_name. 
      // We requested sort=updated in fetchUserRepos. Let's sort by stars here to get the "best" repo.)
      const topRepo = [...userRepos].sort((a, b) => b.stargazers_count - a.stargazers_count)[0];
      const readme = topRepo ? await fetchRepoReadme(username, topRepo.name) : null;

      const analysis = await analyzeProfileWithGroq(userProfile, userRepos, userEvents, readme);
      setRoastData(analysis);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 p-4 md:p-8 font-body selection:bg-roast-500/30">
      <Analytics />
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12 pt-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="inline-block p-4 rounded-full bg-dark-card border border-dark-border mb-6 shadow-2xl shadow-roast-500/10"
          >
            <Flame className="w-12 h-12 text-roast-500" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-heading font-bold mb-4 bg-gradient-to-r from-roast-400 to-roast-600 bg-clip-text text-transparent"
          >
            GitHub Roaster
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg max-w-lg mx-auto"
          >
            Enter a username to get roasted by AI (and maybe some helpful feedback).
          </motion.p>
        </header>

        <SearchInput onSearch={handleSearch} isLoading={isLoading} />

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center max-w-md mx-auto"
            >
              {error}
            </motion.div>
          )}

          {profile && roastData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-12 space-y-8"
            >
              <div className="flex justify-center gap-4 mb-8">
                <button
                  onClick={() => setMode('roast')}
                  className={`px-6 py-2 rounded-full font-bold transition-all duration-300 ${mode === 'roast'
                    ? 'bg-roast-500 text-white shadow-lg shadow-roast-500/25 scale-105'
                    : 'bg-dark-card text-gray-400 hover:bg-dark-border'
                    }`}
                >
                  🔥 Roast Me
                </button>
                <button
                  onClick={() => setMode('feedback')}
                  className={`px-6 py-2 rounded-full font-bold transition-all duration-300 ${mode === 'feedback'
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/25 scale-105'
                    : 'bg-dark-card text-gray-400 hover:bg-dark-border'
                    }`}
                >
                  🌱 Motivate Me
                </button>
              </div>

              <ProfileCard profile={profile} repos={repos} />

              <AnimatePresence mode="wait">
                {mode === 'roast' ? (
                  <motion.div
                    key="roast"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <RoastPanel roast={roastData.roast} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="feedback"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FeedbackPanel data={roastData} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-20 text-center text-gray-500 text-sm pb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Github className="w-4 h-4" />
            <span>Powered by GitHub API & Groq AI</span>
          </div>
          <p>Built with React, Tailwind & Framer Motion</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
