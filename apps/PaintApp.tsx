import React, { useRef, useState } from 'react';
export const PaintApp = () => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [draw, setDraw] = useState(false);
  const move = (e: any) => { if(!draw) return; const ctx = canvas.current?.getContext('2d'); if(ctx) { ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY); ctx.stroke(); } };
  return <div className="h-full bg-white"><canvas ref={canvas} width={800} height={600} onMouseDown={()=>{setDraw(true); canvas.current?.getContext('2d')?.beginPath();}} onMouseUp={()=>setDraw(false)} onMouseMove={move} className="cursor-crosshair"/></div>;
};