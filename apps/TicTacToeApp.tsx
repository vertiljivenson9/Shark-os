import React, { useState } from 'react';
export const TicTacToeApp = () => {
  const [b, setB] = useState(Array(9).fill(null));
  const [x, setX] = useState(true);
  const c = (i: number) => { const n = [...b]; n[i] = x?'X':'O'; setB(n); setX(!x); };
  return <div className="h-full bg-gray-800 flex items-center justify-center"><div className="grid grid-cols-3 gap-2">{b.map((v,i)=><button key={i} onClick={()=>c(i)} className="w-16 h-16 bg-white text-2xl font-bold">{v}</button>)}</div></div>;
};