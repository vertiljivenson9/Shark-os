import React, { useState } from 'react';
import { Play, Pause } from 'lucide-react';
export const MusicApp = () => {
  const [play, setPlay] = useState(false);
  return <div className="h-full bg-purple-900 text-white flex items-center justify-center"><button onClick={()=>setPlay(!play)} className="w-20 h-20 bg-white text-purple-900 rounded-full flex items-center justify-center">{play?<Pause/>:<Play/>}</button></div>;
};