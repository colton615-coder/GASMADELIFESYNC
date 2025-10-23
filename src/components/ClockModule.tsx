
import React, { useState, useEffect } from 'react';
import Module from './Module';
import { ClockIcon } from './icons';

const ClockModule: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Module title="Current Time" icon={<ClockIcon />}>
      <div className="text-center">
        <div className="text-6xl font-mono font-bold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-gray-200 to-gray-400">
          {time.toLocaleTimeString()}
        </div>
        <div className="text-gray-300 mt-2">{formatDate(time)}</div>
      </div>
    </Module>
  );
};

export default ClockModule;
