import React, { useEffect, useState } from 'react';
export const BiosScreen: React.FC<{onComplete:()=>void}> = ({ onComplete }) => {
  const [lines, setLines] = useState<string[]>([]);
  useEffect(() => {
    const add = (t: string, d: number) => setTimeout(() => setLines(p => [...p, t]), d);
    add("AMIBIOS(C) 2025 American Megatrends, Inc.", 200);
    add("Shark OS Mobile Workstation BIOS v4.0", 400);
    add("CPU : WebAssembly Virtual Core @ 4.00GHz", 600);
    add("Memory Test : 4194304K OK", 1000);
    add("", 1200);
    add("Detecting Primary Master ... SharkFS System Drive", 1400);
    add("System Initialized.", 1800);
    setTimeout(onComplete, 2500);
  }, []);
  return <div className="fixed inset-0 bg-black text-[#a8a8a8] font-mono p-8 z-[10000]">{lines.map((l,i)=><div key={i}>{l}</div>)}</div>;
};