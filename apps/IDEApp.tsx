import React, { useState } from 'react';
import { kernel } from '../services/kernel';
import { Play } from 'lucide-react';
export const IDEApp = () => {
  const [code, setCode] = useState('<h1>Hello</h1>');
  const run = async () => { await kernel.fs.write('/system/apps/test.src', code); kernel.launchApp('test_app'); };
  return <div className="h-full flex flex-col bg-[#1e1e1e] text-white"><div className="h-10 bg-[#333] flex items-center px-4"><button onClick={run} className="flex gap-2 bg-green-600 px-3 py-1 rounded text-xs"><Play size={14}/> Run</button></div><textarea value={code} onChange={e=>setCode(e.target.value)} className="flex-1 bg-transparent p-4 font-mono outline-none"/></div>;
};