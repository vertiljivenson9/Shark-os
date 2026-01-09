import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, Command } from 'lucide-react';
import { AppDefinition } from '../types';
export const CommandPalette: React.FC<{apps: AppDefinition[], onLaunch: (app: AppDefinition)=>void}> = ({ apps, onLaunch }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if ((e.ctrlKey && e.code === 'Space') || (e.metaKey && e.key === 'k')) { e.preventDefault(); setIsOpen(p => !p); } if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', down); return () => window.removeEventListener('keydown', down);
  }, []);
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 50); }, [isOpen]);
  const filtered = apps.filter(a => a.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  return isOpen ? <div className="fixed inset-0 z-[10000] bg-black/20 backdrop-blur flex items-start justify-center pt-[20vh]" onClick={() => setIsOpen(false)}><div className="w-[500px] bg-[#1e1e1e]/90 border border-white/10 rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}><div className="flex items-center px-4 py-4 border-b border-white/10"><Search className="text-gray-400 mr-3"/><input ref={inputRef} className="flex-1 bg-transparent text-xl text-white outline-none" placeholder="Search..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if(e.key==='Enter' && filtered[idx]) { onLaunch(filtered[idx]); setIsOpen(false); } }}/></div>{filtered.map((a,i) => <button key={a.id} className={`w-full px-4 py-3 flex justify-between ${i===idx?'bg-blue-600 text-white':'text-gray-300'}`} onClick={()=>{onLaunch(a);setIsOpen(false);}} onMouseEnter={()=>setIdx(i)}><span>{a.name}</span>{i===idx && <ArrowRight size={16}/>}</button>)}</div></div> : null;
};