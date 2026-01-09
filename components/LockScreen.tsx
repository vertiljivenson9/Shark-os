import React, { useState, useEffect } from 'react';
import { Lock, ChevronUp } from 'lucide-react';
export const LockScreen: React.FC<{onUnlock:()=>void, wallpaper?:string}> = ({ onUnlock, wallpaper }) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return <div className="fixed inset-0 z-[8000] bg-black text-white flex flex-col items-center justify-between py-12" style={{backgroundImage: wallpaper? `url(${wallpaper})`:undefined, backgroundSize:'cover'}} onClick={onUnlock}><div className="mt-12 text-center"><Lock size={24} className="mb-4 mx-auto"/><h1 className="text-7xl font-thin">{time.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</h1><p>{time.toLocaleDateString()}</p></div><div className="animate-bounce flex flex-col items-center"><ChevronUp/><span>Click to unlock</span></div></div>;
};