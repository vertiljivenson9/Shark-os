import React from 'react';
import { kernel } from '../services/kernel';
export const StoreApp = () => {
  const install = (id: string) => kernel.pkg.install(id).then(()=>alert('Installed'));
  return <div className="h-full bg-white p-6 text-black"><h1>App Store</h1><div className="border p-4 mt-4 rounded flex justify-between"><span>Tic Tac Toe</span><button onClick={()=>install('tictactoe')} className="bg-blue-500 text-white px-4 rounded">Get</button></div></div>;
};