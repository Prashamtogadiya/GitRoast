import React from 'react';
import { motion } from 'framer-motion';
import { Users, Book, MapPin, Link as LinkIcon, Building } from 'lucide-react';
import type { GitHubProfile, GitHubRepo } from '../utils/github';
import { LanguageBadges } from './LanguageBadges';

interface ProfileCardProps {
    profile: GitHubProfile;
    repos: GitHubRepo[];
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ profile, repos }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-dark-card border border-dark-border rounded-2xl p-6 md:p-8 shadow-xl max-w-2xl mx-auto w-full"
        >
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <motion.img
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    src={profile.avatar_url}
                    alt={profile.login}
                    className="w-32 h-32 rounded-full border-4 border-roast-500 shadow-lg shadow-roast-500/20"
                />

                <div className="flex-1 text-center md:text-left">
                    <h2 className="text-3xl font-bold text-white mb-1">{profile.name || profile.login}</h2>
                    <a
                        href={profile.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-roast-400 hover:text-roast-300 transition-colors font-mono text-sm"
                    >
                        @{profile.login}
                    </a>

                    {profile.bio && (
                        <p className="text-gray-400 mt-3 text-sm md:text-base leading-relaxed">
                            {profile.bio}
                        </p>
                    )}

                    <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 text-sm text-gray-400">
                        {profile.location && (
                            <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{profile.location}</span>
                            </div>
                        )}
                        {profile.company && (
                            <div className="flex items-center gap-1">
                                <Building className="w-4 h-4" />
                                <span>{profile.company}</span>
                            </div>
                        )}
                        {profile.blog && (
                            <div className="flex items-center gap-1">
                                <LinkIcon className="w-4 h-4" />
                                <a href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`} target="_blank" rel="noopener noreferrer" className="hover:text-roast-400 truncate max-w-[150px]">
                                    Website
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-dark-border">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400 mb-1">
                        <Book className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider">Repos</span>
                    </div>
                    <span className="text-2xl font-bold text-white">{profile.public_repos}</span>
                </div>
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400 mb-1">
                        <Users className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider">Followers</span>
                    </div>
                    <span className="text-2xl font-bold text-white">{profile.followers}</span>
                </div>
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400 mb-1">
                        <Users className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider">Following</span>
                    </div>
                    <span className="text-2xl font-bold text-white">{profile.following}</span>
                </div>
            </div>

            <LanguageBadges repos={repos} />
        </motion.div>
    );
};
