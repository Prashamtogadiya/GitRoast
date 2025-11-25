
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Trophy, Code, Zap, Users } from 'lucide-react';
import type { RoastResult } from '../utils/ai-roast';

interface FeedbackPanelProps {
    data: RoastResult | null;
}

const ScoreCard: React.FC<{ score: number; label: string; icon: React.ReactNode }> = ({ score, label, icon }) => {
    const getColor = (s: number) => {
        if (s >= 80) return 'text-green-500';
        if (s >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getBgColor = (s: number) => {
        if (s >= 80) return 'bg-green-500';
        if (s >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="flex flex-col items-center p-4 bg-dark-card border border-dark-border rounded-xl">
            <div className="mb-2 text-roast-400">{icon}</div>
            <div className={`text - 3xl font - bold mb - 1 ${getColor(score)} `}>{score}</div>
            <div className="text-sm text-gray-400 font-medium">{label}</div>
            <div className="w-full h-2 bg-dark-bg rounded-full mt-3 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}% ` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h - full rounded - full ${getBgColor(score)} `}
                />
            </div>
        </div>
    );
};

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ data }) => {
    if (!data) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full max-w-4xl mx-auto mt-12 space-y-8"
        >
            {data.feedback && (
                <div className="bg-dark-card border border-green-500/30 p-6 rounded-xl shadow-lg relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-green-600" />
                    <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        Constructive Feedback
                    </h3>
                    <ul className="space-y-3 pl-2">
                        {data.feedback.map((point, index) => (
                            <li key={index} className="text-gray-200 font-medium text-lg leading-relaxed flex items-start gap-3">
                                <span className="text-green-500 mt-1.5 text-xs">🌱</span>
                                <span>{point}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ScoreCard score={data.overallScore} label="Overall" icon={<Trophy className="w-6 h-6" />} />
                <ScoreCard score={data.codeQuality.score} label="Code Quality" icon={<Code className="w-6 h-6" />} />
                <ScoreCard score={data.productivity.score} label="Productivity" icon={<Zap className="w-6 h-6" />} />
                <ScoreCard score={data.collaboration.score} label="Collaboration" icon={<Users className="w-6 h-6" />} />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {[
                    { title: "Code Quality", tips: data.codeQuality.tips },
                    { title: "Productivity", tips: data.productivity.tips },
                    { title: "Collaboration", tips: data.collaboration.tips }
                ].map((section, idx) => (
                    <div key={idx} className="bg-dark-card border border-dark-border rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">{section.title}</h3>
                        <div className="space-y-3">
                            {section.tips.map((tip, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <CheckCircle className="w-4 h-4 text-roast-500 shrink-0 mt-1" />
                                    <p className="text-gray-300 text-sm">{tip}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

