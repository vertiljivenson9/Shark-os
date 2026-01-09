import React, { useState, useEffect } from 'react';
import { kernel } from '../services/kernel';
import { Save, FolderOpen } from 'lucide-react';
import { FilePicker } from '../components/FilePicker';
export const EditorApp: React.FC<{file?:string}> = ({ file }) => {
  const [path, setPath] = useState(file || '/user/home/notes.txt');
  const [content, setContent] = useState('');
  const [picker, setPicker] = useState(false);
  useEffect(() => { if (file) kernel.fs.cat(file).then(setContent).catch(()=>setContent('')); }, [file]);
  return <div className="flex flex-col h-full bg-gray-900 text-white">{picker && <FilePicker onSelect={(p)=>{setPath(p);setPicker(false);kernel.fs.cat(p).then(setContent);}} onCancel={()=>setPicker(false)}/>}<div className="flex p-2 bg-gray-800 gap-2"><button onClick={()=>setPicker(true)}><FolderOpen/></button><input value={path} onChange={e=>setPath(e.target.value)} className="bg-transparent border border-gray-600 flex-1 px-2"/><button onClick={()=>kernel.fs.write(path,content)}><Save/></button></div><textarea className="flex-1 bg-[#1e1e1e] p-4 font-mono resize-none outline-none" value={content} onChange={e=>setContent(e.target.value)}/></div>;
};