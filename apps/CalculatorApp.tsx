import React, { useState } from 'react';
export const CalculatorApp = () => {
  const [disp, setDisp] = useState('0');
  const btn = (l: string, c: string) => <button onClick={() => setDisp(disp === '0' ? l : disp + l)} className={`h-14 w-14 rounded-full font-bold ${c}`}>{l}</button>;
  return <div className="h-full bg-black text-white flex flex-col p-4"><div className="flex-1 flex items-end justify-end text-6xl mb-4">{disp}</div><div className="grid grid-cols-4 gap-3"><button onClick={() => setDisp('0')} className="bg-gray-400 text-black h-14 w-14 rounded-full">AC</button>{['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(b => btn(b, 'bg-gray-800'))}</div></div>;
};