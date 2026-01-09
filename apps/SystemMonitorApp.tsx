import React, { useState, useEffect } from 'react';
import { kernel } from '../services/kernel';
export const SystemMonitorApp = () => {
  const [procs, setProcs] = useState(kernel.getProcesses());
  useEffect(() => { const i = setInterval(() => setProcs(kernel.getProcesses()), 1000); return () => clearInterval(i); }, []);
  return <div className="h-full bg-white p-4 text-black"><h2 className="font-bold mb-4">Task Manager</h2><table className="w-full"><thead><tr><th>PID</th><th>Name</th><th>Status</th><th>Action</th></tr></thead><tbody>{procs.map(p=><tr key={p.pid}><td>{p.pid}</td><td>{p.name}</td><td>{p.status}</td><td><button className="text-red-500" onClick={()=>kernel.killProcess(p.pid)}>Kill</button></td></tr>)}</tbody></table></div>;
};