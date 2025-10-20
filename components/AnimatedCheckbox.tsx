import React, { useState, useEffect } from 'react';
import { CheckIcon } from './icons';

interface AnimatedCheckboxProps {
  checked: boolean;
  onChange: () => void;
  variant?: 'round' | 'square';
  className?: string;
  disabled?: boolean;
}

const PARTICLE_COLORS = ['#818cf8', '#a5b4fc', '#f472b6', '#facc15', '#4ade80'];

const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({ checked, onChange, variant = 'round', className = '', disabled = false }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  // This effect will trigger the animation only when the checkbox becomes checked.
  useEffect(() => {
    if (checked && !disabled) {
      setIsAnimating(true);
      // Reset the animation state after it has finished
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [checked, disabled]);

  const shapeClass = variant === 'round' ? 'rounded-full' : 'rounded-sm';
  const checkedBgClass = checked ? 'bg-indigo-500 border-transparent' : 'bg-gray-800/50 border-gray-600';
  const disabledClass = disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer';

  const handleClick = () => {
    if (!disabled) {
      onChange();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      onChange();
    }
  };

  return (
    <div 
      className={`relative flex items-center justify-center h-6 w-6 flex-shrink-0 ${disabledClass} ${className}`}
      onClick={handleClick}
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
    >
      <input 
        type="checkbox" 
        checked={checked} 
        readOnly 
        disabled={disabled}
        tabIndex={-1} 
        className="appearance-none absolute inset-0"
      />

      {/* The visual checkbox box */}
      <div className={`h-6 w-6 border transition-all duration-200 ${shapeClass} ${checkedBgClass}`}></div>

      {/* The checkmark icon */}
      {checked && (
        <CheckIcon className="absolute w-4 h-4 text-white checkmark-animation" />
      )}
      
      {/* The particle burst effect */}
      {isAnimating && (
        <div className="absolute inset-0 flex items-center justify-center">
            {Array.from({ length: 8 }).map((_, i) => (
                <div
                    key={i}
                    className="particle"
                    style={{
                        '--angle': `${i * 45}deg`,
                        '--color': PARTICLE_COLORS[i % PARTICLE_COLORS.length]
                    } as React.CSSProperties}
                />
            ))}
        </div>
      )}
    </div>
  );
};

export default AnimatedCheckbox;