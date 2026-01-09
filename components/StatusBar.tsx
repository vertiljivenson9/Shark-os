import React, { useState, useEffect } from 'react';
import { Battery, Wifi } from 'lucide-react';
export const StatusBar: React.FC<{onToggleControlCenter:()=>void}> = ({ onToggleControlCenter }) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return <div onClick={onToggleControlCenter} className="h-6 bg-black/40 backdrop-blur text-white flex justify-between px-4 text-xs items-center cursor-pointer z-[9000] fixed top-0 w-full"><span>{time.toLocaleTimeString()}</span><div className="flex gap-2"><Wifi size={14}/><Battery size={14}/></div></div>;
};