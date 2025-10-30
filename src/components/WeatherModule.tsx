
import React from 'react';
import Module from '@/components/Module';
import { SunIcon, CloudIcon, ZapIcon, CloudRainIcon } from '@/components/icons';

const WeatherModule: React.FC = () => {
  // Weather data removed. Integrate with a real weather API or leave empty.
  return (
    <Module title="Weather" icon={<CloudIcon />}>
      <div className="flex items-center justify-center h-32">
        <span className="text-gray-400">Weather data unavailable.</span>
      </div>
    </Module>
  );
};

export default WeatherModule;