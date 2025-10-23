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
      className={`border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 ease-in-out hover:border-white/20 hover:-translate-y-1 ${className}`}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          {icon && <span className="text-gray-300">{icon}</span>}
          <h2 className="text-module-header">{title}</h2>
        </div>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

export default Module;