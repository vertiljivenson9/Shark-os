import React, { useState, useEffect } from 'react';
export const ClockApp = () => {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  return <div className="h-full bg-black text-white flex items-center justify-center text-6xl font-thin">{t.toLocaleTimeString()}</div>;
};