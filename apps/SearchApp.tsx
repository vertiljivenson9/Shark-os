import React, { useState } from 'react';
export const SearchApp = () => {
  const [url, setUrl] = useState('https://www.google.com/search?igu=1');
  return <div className="h-full flex flex-col"><input className="p-2 border-b" onKeyDown={e=>{if(e.key==='Enter') setUrl((e.target as any).value)}} defaultValue={url}/><iframe src={url} className="flex-1 border-none"/></div>;
};