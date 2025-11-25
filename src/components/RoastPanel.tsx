import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface RoastPanelProps {
    roast: string[] | null;
}

export const RoastPanel: React.FC<RoastPanelProps> = ({ roast }) => {
    if (!roast) return null;

    return (
        <div className="max-w-2xl mx-auto w-full mt-8">
            <div className="flex items-center gap-2 mb-4">
                <Flame className="w-6 h-6 text-roast-500" />
                <h2 className="text-xl font-bold text-white">The Roast</h2>
            </div>

            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-dark-card border border-roast-900/50 p-6 rounded-xl shadow-lg relative overflow-hidden group hover:border-roast-500/30 transition-colors"
            >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-roast-500 to-roast-700" />
                <ul className="space-y-3 pl-2">
                    {roast.map((point, index) => (
                        <li key={index} className="text-gray-200 font-medium text-lg leading-relaxed flex items-start gap-3">
                            <span className="text-roast-500 mt-1.5 text-xs">🔥</span>
                            <span>{point}</span>
                        </li>
                    ))}
                </ul>
            </motion.div>
        </div>
    );
};
