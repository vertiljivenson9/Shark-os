import React, { useState, useEffect } from 'react';
import { kernel } from '../services/kernel';
export const GalleryApp = () => {
  const [imgs, setImgs] = useState<string[]>([]);
  useEffect(() => { kernel.fs.ls('/user/home/photos').then(async files => { const urls = await Promise.all(files.filter(f => f.endsWith('.png')).map(f => kernel.fs.cat('/user/home/photos/'+f))); setImgs(urls); }); }, []);
  return <div className="h-full bg-black p-4 grid grid-cols-4 gap-2 overflow-auto">{imgs.map((src, i) => <img key={i} src={src} className="w-full h-auto border border-gray-700"/>)}</div>;
};