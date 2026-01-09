import React, { useState } from 'react';
import { Wifi, Bluetooth, Moon, Volume2, Sun, X } from 'lucide-react';
import { kernel } from '../services/kernel';
export const ControlCenter: React.FC<{isOpen:boolean, onClose:()=>void, notifications:any[]}> = ({ isOpen, onClose, notifications }) => {
  const [vol, setVol] = useState(80);
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-[9999]"><div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}/><div className="absolute top-2 right-2 w-80 bg-black/80 backdrop-blur-xl rounded-3xl p-4 text-white"><div className="flex justify-between mb-4"><h2>Control Center</h2><button onClick={onClose}><X/></button></div><div className="grid grid-cols-2 gap-3 mb-4"><div className="bg-white/10 rounded p-3 flex gap-2"><Wifi/><Bluetooth/></div></div><div className="space-y-4"><div className="flex gap-3"><Sun/><input type="range" className="flex-1"/></div><div className="flex gap-3"><Volume2/><input type="range" value={vol} onChange={(e)=>{setVol(Number(e.target.value)); kernel.audio.setMasterVolume(Number(e.target.value)/100);}} className="flex-1"/></div></div><div className="mt-4"><h3>Notifications</h3>{notifications.map(n=><div key={n.id} className="bg-white/5 p-2 rounded mt-2 text-xs"><b>{n.title}</b><p>{n.message}</p></div>)}</div></div></div>;
};