import React, { useEffect, useState } from 'react';
export const SplashScreen: React.FC<{onComplete:()=>void}> = ({ onComplete }) => {
  const [opacity, setOpacity] = useState(1);
  useEffect(() => { setTimeout(() => { setOpacity(0); setTimeout(onComplete, 1000); }, 3000); }, []);
  return <div className="fixed inset-0 z-[10000] bg-black flex items-center justify-center transition-opacity duration-1000" style={{opacity, pointerEvents:opacity===0?'none':'auto'}}><div className="text-center"><h1 className="text-5xl font-black text-white tracking-[0.5em]">SHARK OS</h1><div className="mt-8 w-64 h-1 bg-gray-900 rounded-full overflow-hidden"><div className="h-full bg-blue-600 animate-[loading_3s_ease-in-out_forwards]"/></div></div><style>{`@keyframes loading { 0% { width: 0%; } 100% { width: 100%; } }`}</style></div>;
};