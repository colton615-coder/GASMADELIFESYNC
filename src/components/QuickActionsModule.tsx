import React from 'react';
import Module from './Module';
import { BoltIcon, PlusCircleIcon, UploadIcon, MessageSquareIcon } from './icons';

const QuickActionButton: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <button className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 rounded-lg w-full text-center transition-all duration-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-400 active:scale-95">
    <span className="text-indigo-300">{icon}</span>
    <span className="text-sm text-gray-200">{label}</span>
  </button>
);

const QuickActionsModule: React.FC = () => {
  return (
    <Module title="Quick Actions" icon={<BoltIcon />}>
      <div className="grid grid-cols-2 gap-4">
        <QuickActionButton icon={<PlusCircleIcon />} label="New Note" />
        <QuickActionButton icon={<UploadIcon />} label="Upload File" />
        <QuickActionButton icon={<MessageSquareIcon />} label="New Message" />
        <QuickActionButton icon={<BoltIcon />} label="Run Task" />
      </div>
    </Module>
  );
};

export default QuickActionsModule;