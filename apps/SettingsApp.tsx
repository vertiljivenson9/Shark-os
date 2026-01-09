import React from 'react';
import { kernel } from '../services/kernel';
export const SettingsApp = () => {
  const bg = (u: string) => kernel.registry.set('user.desktop.wallpaper', u).then(() => window.dispatchEvent(new CustomEvent('sys-config-update')));
  return <div className="h-full bg-gray-900 text-white p-6"><h2>Settings</h2><div className="grid grid-cols-2 gap-4 mt-4"><button onClick={()=>bg('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564')} className="h-20 bg-gray-800">Abstract</button><button onClick={()=>bg('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000')} className="h-20 bg-gray-800">Space</button></div></div>;
};