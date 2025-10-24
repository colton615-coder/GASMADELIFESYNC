import React from 'react';
import Module from '@/components/Module';
import { BrainCircuitIcon } from '@/components/icons';

const MindfulMomentsWidget: React.FC<{
  setActiveModule: (module: string) => void;
}> = ({ setActiveModule }) => {
  return (
    <Module title="Mindful Moments" icon={<BrainCircuitIcon />} className="!border-indigo-500/30">
        <div className="flex flex-col items-center text-center p-4">
            <p className="text-caption mb-4">
                Feeling overwhelmed or just need to talk? Aura, your AI coach, is here to listen.
            </p>
            <button
                onClick={() => setActiveModule('MINDFUL_MOMENTS')}
                className="w-full px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
            >
                Start a Conversation
            </button>
        </div>
    </Module>
  );
};

export default MindfulMomentsWidget;
