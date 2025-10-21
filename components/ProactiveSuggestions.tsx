import React from 'react';
import { SparklesIcon } from './icons';

const ProactiveSuggestions: React.FC<{ setActiveModule: (module: string) => void }> = ({ setActiveModule }) => {
  const handleRequestAnalysis = () => {
    console.log('User requested analysis.');
  };

  return (
    <button
      onClick={handleRequestAnalysis}
      className="w-full flex items-center justify-center gap-4 p-6 bg-white/5 rounded-2xl border border-indigo-500/30 hover:bg-white/10 transition-colors group"
      aria-label="Get Your Weekly Insight"
    >
      <SparklesIcon className="w-6 h-6 text-indigo-300 transition-transform group-hover:scale-110" />
      <span className="text-body-emphasis font-semibold text-indigo-200">Get Your Weekly Insight</span>
    </button>
  );
};

export default ProactiveSuggestions;