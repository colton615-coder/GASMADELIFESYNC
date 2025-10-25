import React, { ReactNode } from 'react';

interface ModuleProps {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

const Module: React.FC<ModuleProps> = ({ title, children, icon, className = '' }) => {
  return (
    <div 
      style={{
        backgroundColor: 'var(--color-surface-module)',
        boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.07)',
        transition: 'background-color 0.5s ease'
      }}
      className={`border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 ease-in-out hover:border-white/20 hover:-translate-y-1 shadow-lg ${className}`}
    >
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-5">
          {icon && <span className="text-gray-300 text-2xl">{icon}</span>}
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{title}</h2>
        </div>
      </div>
      <div className="px-6 py-5">
        {children}
      </div>
    </div>
  );
};

export default Module;