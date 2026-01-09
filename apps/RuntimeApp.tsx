import React, { useEffect, useState } from 'react';
import { kernel } from '../services/kernel';
export const RuntimeLoader: React.FC<{appId:string}> = ({ appId }) => {
  const [src, setSrc] = useState('');
  useEffect(() => { kernel.fs.cat(`/system/apps/${appId}.src`).then(s => setSrc(URL.createObjectURL(new Blob([s], {type:'text/html'})))); }, [appId]);
  return src ? <iframe src={src} className="w-full h-full border-none"/> : <div>Loading...</div>;
};
export const RuntimeApp = () => <div>Host</div>;