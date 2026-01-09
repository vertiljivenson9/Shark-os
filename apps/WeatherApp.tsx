import React, { useEffect, useState } from 'react';
import { kernel } from '../services/kernel';
export const WeatherApp = () => {
  const [temp, setTemp] = useState('Loading...');
  useEffect(() => { kernel.net.request('https://api.open-meteo.com/v1/forecast?latitude=51.5&longitude=-0.12&current_weather=true').then(d => setTemp(JSON.parse(d).current_weather.temperature + '°C')); }, []);
  return <div className="h-full bg-blue-400 text-white flex items-center justify-center text-6xl font-thin">{temp}</div>;
};