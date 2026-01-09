import React, { useEffect, useState } from 'react';
import { kernel } from '../services/kernel';
export const NewsApp = () => {
  const [news, setNews] = useState<any[]>([]);
  useEffect(() => { kernel.net.request('https://hacker-news.firebaseio.com/v0/topstories.json').then(async (ids) => { const top5 = JSON.parse(ids).slice(0, 10); const stories = await Promise.all(top5.map((id:any) => kernel.net.request(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(JSON.parse))); setNews(stories); }); }, []);
  return <div className="h-full bg-[#f6f6ef] overflow-auto p-4">{news.map(n => <div key={n.id} className="mb-2 p-2 bg-white border border-gray-300 rounded"><a href={n.url} target="_blank" className="font-bold text-black">{n.title}</a><div className="text-xs text-gray-500">{n.score} points by {n.by}</div></div>)}</div>;
};