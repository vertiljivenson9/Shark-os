import React, { useState, useEffect } from 'react';
import { kernel } from '../services/kernel';
import { Folder, File, X } from 'lucide-react';
export const FilePicker: React.FC<{onSelect:(p:string)=>void, onCancel:()=>void}> = ({ onSelect, onCancel }) => {
  const [path, setPath] = useState('/user/home');
  const [items, setItems] = useState<string[]>([]);
  useEffect(() => { kernel.fs.ls(path).then(setItems); }, [path]);
  return <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-[9999]"><div className="bg-gray-800 w-96 h-96 flex flex-col rounded shadow-2xl text-white"><div className="flex justify-between p-3 border-b border-gray-700"><span>Select File</span><button onClick={onCancel}><X/></button></div><div className="bg-black p-2 text-xs">{path}</div><div className="flex-1 overflow-y-auto p-2">{path!=='/'&&<div onClick={()=>{setPath(path.substring(0,path.lastIndexOf('/'))||'/')}} className="flex gap-2 p-2 hover:bg-white/10 cursor-pointer"><Folder className="text-yellow-500"/>..</div>}{items.map(i=><div key={i} onClick={()=>{ if(i.endsWith('/')) setPath((path==='/'?'':path)+'/'+i.slice(0,-1)); else onSelect((path==='/'?'':path)+'/'+i); }} className="flex gap-2 p-2 hover:bg-white/10 cursor-pointer">{i.endsWith('/')?<Folder className="text-yellow-500"/>:<File className="text-blue-400"/>}{i}</div>)}</div></div></div>;
};