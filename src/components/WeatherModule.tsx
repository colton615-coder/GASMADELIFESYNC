
import React from 'react';
import Module from '@/components/Module';
import { SunIcon, CloudIcon, ZapIcon, CloudRainIcon } from '@/components/icons';

const WeatherModule: React.FC = () => {
  // Mock data
  const weather = {
    location: 'Aetherium City',
    temperature: '28°C',
    condition: 'Partly Cloudy',
    humidity: '65%',
    wind: '12 km/h',
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'partly cloudy':
        return <CloudIcon className="w-16 h-16" />;
      case 'sunny':
        return <SunIcon className="w-16 h-16" />;
       case 'rainy':
        return <CloudRainIcon className="w-16 h-16" />;
      case 'thunderstorm':
        return <ZapIcon className="w-16 h-16" />;
      default:
        return <CloudIcon className="w-16 h-16" />;
    }
  };

  return (
    <Module title="Weather" icon={<CloudIcon />}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-300 text-lg">{weather.location}</p>
          <p className="text-5xl font-bold">{weather.temperature}</p>
          <p className="text-gray-300">{weather.condition}</p>
        </div>
        <div className="text-indigo-300">
          {getWeatherIcon(weather.condition)}
        </div>
      </div>
      <div className="mt-4 flex justify-between text-sm text-gray-400">
        <span>Humidity: {weather.humidity}</span>
        <span>Wind: {weather.wind}</span>
      </div>
    </Module>
  );
};

export default WeatherModule;