import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface SearchInputProps {
    onSearch: (username: string) => void;
    isLoading: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({ onSearch, isLoading }) => {
    const [username, setUsername] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim()) {
            onSearch(username.trim());
        }
    };

    return (
        <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onSubmit={handleSubmit}
            className="w-full max-w-md mx-auto relative"
        >
            <div className="relative group">
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter GitHub username..."
                    className="w-full px-6 py-4 bg-dark-card border-2 border-dark-border rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-roast-500 transition-colors duration-300 pr-14 shadow-lg group-hover:shadow-roast-500/10"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !username.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-roast-600 rounded-full text-white hover:bg-roast-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Search className="w-5 h-5" />
                    )}
                </button>
            </div>
        </motion.form>
    );
};
