import React, { useState } from 'react';
import { Shell } from '../services/terminal/sh';
export const TerminalApp = () => {
  const [lines, setLines] = useState(['WebOS Kernel v4.0']);
  const [sh] = useState(new Shell());
  return <div className="h-full bg-black text-green-500 font-mono p-4 overflow-auto">{lines.map((l,i)=><div key={i}>{l}</div>)}<div className="flex"><span>$ </span><input className="bg-transparent outline-none flex-1 text-green-500" onKeyDown={e=>{if(e.key==='Enter'){ const v = (e.target as any).value; setLines(p=>[...p, '$ '+v]); sh.exec(v, (t)=>setLines(x=>[...x,t]), ()=>{}, ()=>'/').then(()=>(e.target as any).value=''); }}} autoFocus/></div></div>;
};