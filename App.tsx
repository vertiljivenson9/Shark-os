import React, { useEffect, useState, useRef } from 'react';
import { kernel } from './services/kernel';
import { WindowState, AppDefinition, Notification } from './types';
import { Window } from './components/Window';
import { StatusBar } from './components/StatusBar';
import { LockScreen } from './components/LockScreen';
import { BiosScreen } from './components/BiosScreen';
import { ControlCenter } from './components/ControlCenter';
import { CommandPalette } from './components/CommandPalette';
import { TerminalApp } from './apps/TerminalApp';
import { EditorApp } from './apps/EditorApp';
import { SettingsApp } from './apps/SettingsApp';
import { SearchApp } from './apps/SearchApp';
import { FilesApp } from './apps/FilesApp';
import { CameraApp } from './apps/CameraApp';
import { GalleryApp } from './apps/GalleryApp';
import { CalculatorApp } from './apps/CalculatorApp';
import { MusicApp } from './apps/MusicApp';
import { StoreApp } from './apps/StoreApp';
import { TicTacToeApp } from './apps/TicTacToeApp';
import { ClockApp } from './apps/ClockApp';
import { VideoPlayerApp } from './apps/VideoPlayerApp';
import { WeatherApp } from './apps/WeatherApp';
import { PaintApp } from './apps/PaintApp';
import { IDEApp } from './apps/IDEApp';
import { NewsApp } from './apps/NewsApp';
import { SystemMonitorApp } from './apps/SystemMonitorApp'; 
import { ZipExportApp } from './apps/ZipExportApp';
import { RuntimeLoader } from './apps/RuntimeApp';
import { SplashScreen } from './components/SplashScreen';
import { GestureRecognizer } from './services/input/gestures';
import { Terminal, FileCode, Settings, Cpu, Grid, AlertTriangle, Moon, Globe, Folder, Camera, Image as ImageIcon, Calculator, Music, Package, CheckSquare, Clock, CloudSun, Film, Palette, Code, Zap, Activity, Box, Coffee, Database, Layers, Layout, RefreshCw, LogOut, UploadCloud, Newspaper, Archive } from 'lucide-react';

const ICONS: Record<string, React.ReactNode> = {
  Terminal: <Terminal size={32} className="text-gray-300" />,
  FileCode: <FileCode size={32} className="text-blue-400" />,
  Settings: <Settings size={32} className="text-gray-400" />,
  Search: <Globe size={32} className="text-blue-500" />,
  Folder: <Folder size={32} className="text-yellow-400" />,
  Camera: <Camera size={32} className="text-red-500" />,
  Image: <ImageIcon size={32} className="text-purple-400" />,
  Calculator: <Calculator size={32} className="text-orange-400" />,
  Music: <Music size={32} className="text-pink-500" />,
  Package: <Package size={32} className="text-blue-600" />,
  Clock: <Clock size={32} className="text-white" />,
  Video: <Film size={32} className="text-red-600" />,
  CloudSun: <CloudSun size={32} className="text-sky-400" />,
  Grid: <Grid size={32} className="text-green-500" />,
  CheckSquare: <CheckSquare size={32} className="text-indigo-400" />,
  Cpu: <Cpu size={32} className="text-red-600" />,
  Palette: <Palette size={32} className="text-pink-400" />,
  Code: <Code size={32} className="text-blue-500" />,
  Zap: <Zap size={32} className="text-yellow-400" />,
  Activity: <Activity size={32} className="text-green-400" />,
  Box: <Box size={32} className="text-orange-400" />,
  Coffee: <Coffee size={32} className="text-brown-400" />,
  Database: <Database size={32} className="text-blue-300" />,
  Layers: <Layers size={32} className="text-indigo-400" />,
  Layout: <Layout size={32} className="text-teal-400" />,
  Newspaper: <Newspaper size={32} className="text-orange-500" />,
  Archive: <Archive size={32} className="text-yellow-600" />,
  Default: <Grid size={32} className="text-gray-500" />
};

const SharkWatermark = () => (
    <svg viewBox="0 0 200 200" className="w-[50vh] h-[50vh] text-white opacity-[0.03] blur-sm pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
        <path d="M140 100 Q 170 80 180 110 Q 190 140 160 130 Q 150 120 140 130" fill="currentColor"/>
        <path d="M60 100 Q 30 80 20 110 Q 10 140 40 130 Q 50 120 60 130" fill="currentColor"/>
        <path d="M70 180 L 130 180 L 120 100 L 80 100 Z" fill="currentColor"/>
        <path d="M100 20 C 130 30 150 60 140 100 L 60 100 C 50 60 70 30 100 20 Z" fill="currentColor"/>
    </svg>
);

const App: React.FC = () => {
  const [showBios, setShowBios] = useState(true);
  const [booted, setBooted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [installedApps, setInstalledApps] = useState<AppDefinition[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showControlCenter, setShowControlCenter] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [wallpaper, setWallpaper] = useState<string>('');
  const [brightness, setBrightness] = useState<number>(100);
  const [fontSize, setFontSize] = useState<string>('normal');
  const [sleepTimeout, setSleepTimeout] = useState<number>(0);
  const [isSleeping, setIsSleeping] = useState(false);
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, show: boolean} | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const sleepTimerRef = useRef<number | null>(null);

  const loadConfig = async () => {
    try {
      const wp = await kernel.registry.get('user.desktop.wallpaper');
      if (wp) setWallpaper(wp);
      const br = await kernel.registry.get('user.display.brightness');
      if (br !== undefined) setBrightness(Number(br));
      const fs = await kernel.registry.get('user.display.font_size');
      if (fs) setFontSize(fs);
      const st = await kernel.registry.get('system.power.sleep_timeout');
      if (st !== undefined) { setSleepTimeout(Number(st)); resetSleepTimer(Number(st)); }
    } catch (e) {}
  };

  const loadApps = async () => {
    const installedIds = await kernel.registry.get('apps.installed') || [];
    const loaded: AppDefinition[] = [];
    for (const id of installedIds) {
        try {
            const content = await kernel.fs.cat(`/system/apps/${id}.json`);
            loaded.push(JSON.parse(content));
        } catch (e) {}
    }
    setInstalledApps(loaded);
  };

  const resetSleepTimer = (timeoutVal?: number) => {
    const time = timeoutVal !== undefined ? timeoutVal : sleepTimeout;
    if (sleepTimerRef.current) { clearTimeout(sleepTimerRef.current); sleepTimerRef.current = null; }
    if (time > 0 && !isSleeping) { sleepTimerRef.current = window.setTimeout(() => { setIsSleeping(true); }, time); }
  };

  const handleUserActivity = () => { if (isSleeping) { setIsSleeping(false); setIsLocked(true); } resetSleepTimer(); };
  const getFontSizePx = () => { switch (fontSize) { case 'small': return '12px'; case 'large': return '16px'; case 'huge': return '20px'; default: return '14px'; } };

  const startKernelBoot = async () => {
      setShowBios(false); setShowSplash(true);
      try {
        await kernel.boot(); await loadApps(); await loadConfig();
        kernel.notifications.subscribe((n) => { setNotifications(prev => [n, ...prev]); setTimeout(() => { setNotifications(prev => prev.filter(x => x.id !== n.id)); }, 4000); });
        setBooted(true); document.addEventListener('click', () => kernel.audio.resume(), { once: true });
      } catch (e: any) { setError(e.message); setBooted(false); }
  };

  useEffect(() => {
    const gr = new GestureRecognizer();
    if (rootRef.current) gr.attach(rootRef.current); else gr.attach(document.body);
    gr.addListener((type) => {
      handleUserActivity();
      if (type === 'three-tap') launchApp({ id: 'terminal', name: 'Terminal', icon: 'Terminal', component: 'TerminalApp', version: '1.0' });
      if (type === 'swipe-up') { if (isLocked) setIsLocked(false); else setActiveWindowId(null); }
    });
    const handleConfigUpdate = () => loadConfig();
    window.addEventListener('sys-config-update', handleConfigUpdate);
    window.addEventListener('sys-app-install', loadApps);
    window.addEventListener('sys-app-uninstall', (e: Event) => {
        const appId = (e as CustomEvent).detail;
        setInstalledApps(prev => prev.filter(app => app.id !== appId));
        setWindows(prev => prev.filter(w => w.appId !== appId));
    });
    window.addEventListener('sys-launch-app', (e: Event) => {
        const detail = (e as CustomEvent).detail;
        const app = installedApps.find(a => a.id === detail.appId);
        if (app) launchApp(app, detail.args);
    });
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    return () => { if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current); };
  }, [sleepTimeout, isSleeping, installedApps, isLocked]); 

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDraggingFile(false);
    if (e.dataTransfer.files) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const content = ev.target?.result as string;
            await kernel.fs.write(`/user/home/${file.name}`, content);
            kernel.notifications.push('File Saved', `${file.name} saved.`);
        };
        if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/')) reader.readAsDataURL(file); else reader.readAsText(file);
      }
    }
  };

  const launchApp = (app: AppDefinition, args?: any) => {
    const pid = kernel.spawnProcess(app.name);
    const id = crypto.randomUUID();
    const newWindow: WindowState = { id, appId: app.id, title: app.name, x: 50 + windows.length * 20, y: 50 + windows.length * 20, width: app.defaultWidth || 600, height: app.defaultHeight || 400, isMinimized: false, isMaximized: false, zIndex: 100, processId: pid, args };
    kernel.compositor.registerWindow(newWindow);
    setWindows(kernel.compositor.getAllWindows());
    setActiveWindowId(id);
  };

  const closeWindow = (id: string) => {
    const win = windows.find(w => w.id === id);
    if (win) { kernel.killProcess(win.processId); kernel.compositor.unregisterWindow(id); setWindows(kernel.compositor.getAllWindows()); }
  };

  const updateWindow = (id: string, newState: Partial<WindowState>) => { kernel.compositor.updateWindow(id, newState); setWindows(kernel.compositor.getAllWindows()); };

  const renderAppContent = (win: WindowState) => {
    const app = installedApps.find(a => a.id === win.appId);
    if (!app) return <div>App not found</div>;
    if (app.component === 'RuntimeApp') return <RuntimeLoader appId={app.id} />;
    switch (app.component) {
      case 'TerminalApp': return <TerminalApp />;
      case 'EditorApp': return <EditorApp file={win.args?.file} />;
      case 'SettingsApp': return <SettingsApp />;
      case 'SystemMonitorApp': return <SystemMonitorApp />;
      case 'SearchApp': return <SearchApp />;
      case 'FilesApp': return <FilesApp />;
      case 'CameraApp': return <CameraApp />;
      case 'GalleryApp': return <GalleryApp />;
      case 'CalculatorApp': return <CalculatorApp />;
      case 'MusicApp': return <MusicApp file={win.args?.file} />;
      case 'StoreApp': return <StoreApp />;
      case 'TicTacToeApp': return <TicTacToeApp />;
      case 'ClockApp': return <ClockApp />;
      case 'VideoPlayerApp': return <VideoPlayerApp file={win.args?.file} />;
      case 'WeatherApp': return <WeatherApp />;
      case 'PaintApp': return <PaintApp />;
      case 'IDEApp': return <IDEApp />;
      case 'NewsApp': return <NewsApp />;
      case 'ZipExportApp': return <ZipExportApp />;
      default: return <div>Unknown Component</div>;
    }
  };

  if (error) return <div className="h-screen bg-black text-red-500 flex flex-col items-center justify-center"><h1>KERNEL PANIC</h1><p>{error}</p><button onClick={() => window.location.reload()} className="mt-4 border border-red-500 px-4 py-2">REBOOT</button></div>;
  if (showBios) return <BiosScreen onComplete={startKernelBoot} />;
  if (!booted) return <><SplashScreen onComplete={() => setShowSplash(false)} /><div className="bg-black h-screen text-green-500 font-mono p-4">Booting Kernel...</div></>;

  return (
    <div ref={rootRef} className="h-screen w-screen bg-os-bg overflow-hidden relative font-sans text-os-text select-none" style={{ backgroundImage: wallpaper ? `url(${wallpaper})` : undefined, backgroundSize: 'cover', fontSize: getFontSizePx() }} onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, show: true }); }} onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }} onDragLeave={() => setIsDraggingFile(false)} onDrop={handleDrop}>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <SharkWatermark />
      {isDraggingFile && <div className="absolute inset-0 z-[9999] bg-blue-500/20 backdrop-blur-sm flex items-center justify-center"><UploadCloud size={64} className="text-white animate-bounce" /></div>}
      <CommandPalette apps={installedApps} onLaunch={(app) => launchApp(app)} />
      <StatusBar onToggleControlCenter={() => setShowControlCenter(!showControlCenter)} />
      <ControlCenter isOpen={showControlCenter} onClose={() => setShowControlCenter(false)} notifications={kernel.notifications.getHistory()} />
      {isLocked && <LockScreen wallpaper={wallpaper} onUnlock={() => setIsLocked(false)} />}
      {contextMenu?.show && <div className="absolute z-[9999] bg-white text-gray-800 rounded shadow-xl py-1 min-w-[160px]" style={{ top: contextMenu.y, left: contextMenu.x }}><button onClick={() => { loadApps(); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"><RefreshCw size={14} /> Refresh</button><button onClick={() => { setIsLocked(true); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500 flex items-center gap-2"><LogOut size={14} /> Lock</button></div>}
      <div className="absolute top-8 right-0 left-0 flex flex-col items-center gap-2 pointer-events-none z-[9500]">{notifications.map(n => <div key={n.id} className="bg-white/90 backdrop-blur text-black px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3"><AlertTriangle size={18} /><div><h4 className="font-bold">{n.title}</h4><p className="text-xs">{n.message}</p></div></div>)}</div>
      <div className="absolute inset-0 z-[9990] pointer-events-none transition-opacity duration-300 bg-black" style={{ opacity: 1 - (brightness / 100) }} />
      {isSleeping && <div className="absolute inset-0 z-[9999] bg-black flex items-center justify-center" onClick={() => setIsSleeping(false)}><Moon size={48} className="text-blue-500 animate-pulse" /></div>}
      <div className="absolute inset-0 p-6 pt-16 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6 content-start z-10" onClick={(e) => { if(e.target===e.currentTarget) { setActiveWindowId(null); setContextMenu(null); } }}>
        {installedApps.map(app => <div key={app.id} className="flex flex-col items-center group cursor-pointer active:scale-90 transition-transform" onClick={(e) => { e.stopPropagation(); launchApp(app); }}><div className="w-16 h-16 bg-os-panel/50 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm group-hover:bg-os-panel">{ICONS[app.icon] || ICONS['Default']}</div><span className="mt-2 text-xs font-medium text-gray-300 group-hover:text-white shadow-black drop-shadow-md">{app.name}</span></div>)}
      </div>
      <div className="absolute inset-0 pt-6 pointer-events-none z-20"><div className="w-full h-full relative">{windows.map(win => <Window key={win.id} state={win} onClose={closeWindow} onMinimize={(id) => updateWindow(id, { isMinimized: true })} onMaximize={(id) => updateWindow(id, { isMaximized: !win.isMaximized })} onFocus={() => { setActiveWindowId(win.id); kernel.compositor.bringToFront(win.id); setWindows(kernel.compositor.getAllWindows()); }} onUpdate={updateWindow}>{renderAppContent(win)}</Window>)}</div></div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-os-panel/80 backdrop-blur-md rounded-2xl px-4 py-3 flex items-center space-x-4 shadow-2xl z-50">{windows.map(win => <div key={win.id} onClick={() => { if (win.isMinimized) updateWindow(win.id, { isMinimized: false }); setActiveWindowId(win.id); kernel.compositor.bringToFront(win.id); setWindows(kernel.compositor.getAllWindows()); }} className={`relative group cursor-pointer transition-all active:scale-95 ${win.isMinimized ? 'opacity-50 grayscale' : 'opacity-100'} ${activeWindowId === win.id ? '-translate-y-2' : ''}`}><div className="w-10 h-10 bg-os-border rounded-xl flex items-center justify-center">{ICONS[installedApps.find(a => a.id === win.appId)?.icon || 'Default'] || ICONS['Default']}</div>{activeWindowId === win.id && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full" />}</div>)}</div>
    </div>
  );
};
export default App;