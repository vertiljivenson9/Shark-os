import React, { useRef, useEffect } from 'react';
export const CameraApp = () => {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => { navigator.mediaDevices.getUserMedia({ video: true }).then(s => { if(v.current) v.current.srcObject = s; }); }, []);
  return <div className="h-full bg-black"><video ref={v} autoPlay className="w-full h-full object-cover"/></div>;
};