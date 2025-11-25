import React from 'react';
import type { GitHubRepo } from '../utils/github';

interface LanguageBadgesProps {
    repos: GitHubRepo[];
}

export const LanguageBadges: React.FC<LanguageBadgesProps> = ({ repos }) => {
    const languages = repos.reduce((acc, repo) => {
        if (repo.language) {
            acc[repo.language] = (acc[repo.language] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const sortedLanguages = Object.entries(languages)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    if (sortedLanguages.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 justify-center mt-4">
            {sortedLanguages.map(([lang, count]) => (
                <span
                    key={lang}
                    className="px-3 py-1 text-xs font-medium rounded-full bg-dark-border text-gray-300 border border-dark-border/50"
                >
                    {lang} <span className="text-gray-500 ml-1">{count}</span>
                </span>
            ))}
        </div>
    );
};
