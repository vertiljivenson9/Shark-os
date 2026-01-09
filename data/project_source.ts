export const PROJECT_SOURCE: Record<string, string> = {
  "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
    <title>WebOS Mobile</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              os: {
                bg: '#0f172a',
                panel: '#1e293b',
                border: '#334155',
                text: '#f8fafc',
                accent: '#3b82f6',
              }
            }
          }
        }
      }
    </script>
    <style>
      body { background-color: #000; overflow: hidden; touch-action: none; }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: #1e293b; }
      ::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: #64748b; }
    </style>
  <script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@^19.2.3",
    "react/": "https://esm.sh/react@^19.2.3/",
    "lucide-react": "https://esm.sh/lucide-react@^0.562.0",
    "react-dom/": "https://esm.sh/react-dom@^19.2.3/",
    "jszip": "https://esm.sh/jszip@3.10.1"
  }
}
</script>
</head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
  "index.tsx": `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
  "metadata.json": `{
  "name": "Shark OS",
  "description": "The apex predator of web operating systems.",
  "requestFramePermissions": [
    "camera",
    "geolocation"
  ]
}`,
  "types.ts": `export enum FileType { FILE = 'FILE', DIR = 'DIR' }
export interface FileNode { path: string; name: string; type: FileType; content: string | null; parentId: string | null; metadata: { created: number; modified: number; size: number; }; }
export interface Process { pid: number; name: string; status: 'running' | 'ready' | 'blocked' | 'suspended' | 'killed'; startTime: number; priority: number; }
export interface WindowState { id: string; appId: string; title: string; x: number; y: number; width: number; height: number; isMinimized: boolean; isMaximized: boolean; zIndex: number; processId: number; args?: any; }
export interface AppDefinition { id: string; name: string; icon: string; component: string; version: string; wasmUrl?: string; defaultWidth?: number; defaultHeight?: number; price?: number; paymentUrl?: string; author?: string; }
export interface Notification { id: string; title: string; message: string; icon?: string; timestamp: number; urgent?: boolean; }
export interface FileSystemBackend { mount(): Promise<void>; ls(path: string): Promise<string[]>; cat(path: string): Promise<string>; write(path: string, data: string): Promise<void>; mkdir(path: string): Promise<void>; rm(path: string): Promise<void>; exists(path: string): Promise<boolean>; }
export interface IVFS { mount(path: string, backend: FileSystemBackend): void; ls(path: string): Promise<string[]>; cat(path: string): Promise<string>; write(path: string, data: string): Promise<void>; mkdir(path: string): Promise<void>; rm(path: string): Promise<void>; exists(path: string): Promise<boolean>; }
export interface IRegistry { get(key: string): Promise<any>; set(key: string, value: any): Promise<void>; delete(key: string): Promise<void>; list(prefix: string): Promise<string[]>; flush?: () => Promise<void>; }
export interface ShellCommand { argv: string[]; redirect: string | null; env: Record<string, string>; }
export interface NetworkRequestOptions { method?: string; headers?: Record<string, string>; body?: string; }
export interface BatteryManager extends EventTarget { charging: boolean; chargingTime: number; dischargingTime: number; level: number; onchargingchange: ((this: BatteryManager, ev: Event) => any) | null; onchargingtimechange: ((this: BatteryManager, ev: Event) => any) | null; ondischargingtimechange: ((this: BatteryManager, ev: Event) => any) | null; onlevelchange: ((this: BatteryManager, ev: Event) => any) | null; }`,
  "services/kernel.ts": `import { VFS } from './vfs';
import { PersistentRegistry } from './registry/prefs';
import { IDBBackend, MemoryBackend } from './vfs/backends';
import { Scheduler } from './kernel/scheduler';
import { MachineIdentity } from './system/machine';
import { PowerManager } from './system/power';
import { NetworkStack } from './net/stack';
import { PackageManager } from './pkg/manager';
import { Compositor } from './wm/compositor';
import { AudioMixer } from './media/audio';
import { ClipboardManager } from './system/clipboard';
import { NotificationManager } from './system/notifications';
import { VoiceControl } from './input/voice';
import { IVFS, IRegistry, Process, AppDefinition } from '../types';
import { Shell } from './terminal/sh';

export class Kernel {
  public fs: IVFS;
  public registry: IRegistry;
  public scheduler: Scheduler;
  public power: PowerManager;
  public net: NetworkStack;
  public pkg: PackageManager;
  public compositor: Compositor;
  public audio: AudioMixer;
  public clipboard: ClipboardManager;
  public notifications: NotificationManager;
  public voice: VoiceControl;
  public bootTime: number = 0;
  private _onProcessChange: (() => void) | null = null;
  private pidCounter = 1;
  private _booted = false;

  constructor() {
    this.fs = new VFS();
    this.registry = new PersistentRegistry();
    this.scheduler = new Scheduler();
    this.power = new PowerManager();
    this.net = new NetworkStack();
    this.pkg = new PackageManager();
    this.compositor = new Compositor();
    this.audio = new AudioMixer(); 
    this.clipboard = new ClipboardManager();
    this.notifications = new NotificationManager();
    this.voice = new VoiceControl();
  }

  setProcessListener(cb: () => void) { this._onProcessChange = cb; }
  private notify() { if (this._onProcessChange) this._onProcessChange(); }

  async boot(): Promise<void> {
    if (this._booted) return;
    this.bootTime = Date.now();
    try {
      await this.power.init();
      const sysBackend = new IDBBackend('WebOS_System', 'sys_files');
      const usrBackend = new IDBBackend('WebOS_User', 'usr_files');
      const memBackend = new MemoryBackend();
      await sysBackend.mount();
      await usrBackend.mount();
      await memBackend.mount();
      this.fs.mount('/tmp', memBackend);
      this.fs.mount('/user', usrBackend);
      this.fs.mount('/', sysBackend); 
      if (!(await this.fs.exists('/'))) await this.fs.mkdir('/');
      if (!(await this.fs.exists('/tmp'))) await this.fs.mkdir('/tmp');
      if (!(await this.fs.exists('/user'))) await this.fs.mkdir('/user');
      const dirs = ['/system', '/system/apps', '/system/store', '/system/media', '/system/bin', '/user/home', '/user/home/photos', '/user/home/dist', '/tmp/net'];
      for (const d of dirs) { if (!(await this.fs.exists(d))) await this.fs.mkdir(d); }
      const shell = new Shell();
      const bins = shell.getCommandsList();
      for (const bin of bins) {
          const path = \`/system/bin/\${bin}\`;
          if (!(await this.fs.exists(path))) await this.fs.write(path, '#!/bin/bash\\n# Binary stub'); 
      }
      await this.net.init();
      await this.pkg.init();
      await this.audio.init();
      const machineId = MachineIdentity.getMachineId();
      await this.registry.set('system.machine.id', machineId);
      await this.registry.set('system.kernel.version', '4.1.0-apex');
      const apps: AppDefinition[] = [
        { id: 'terminal', name: 'Terminal', icon: 'Terminal', component: 'TerminalApp', version: '2.0.0', defaultWidth: 600, defaultHeight: 400 },
        { id: 'editor', name: 'Code Editor', icon: 'FileCode', component: 'EditorApp', version: '1.0.0', defaultWidth: 700, defaultHeight: 500 },
        { id: 'settings', name: 'Settings', icon: 'Settings', component: 'SettingsApp', version: '2.0.0', defaultWidth: 800, defaultHeight: 550 },
        { id: 'monitor', name: 'System Monitor', icon: 'Activity', component: 'SystemMonitorApp', version: '1.0.0', defaultWidth: 600, defaultHeight: 450 },
        { id: 'search', name: 'Viscrosoft Jedge', icon: 'Search', component: 'SearchApp', version: '99.0.1', defaultWidth: 900, defaultHeight: 600 },
        { id: 'files', name: 'Files', icon: 'Folder', component: 'FilesApp', version: '1.5.0', defaultWidth: 750, defaultHeight: 500 },
        { id: 'camera', name: 'Camera', icon: 'Camera', component: 'CameraApp', version: '1.0.0', defaultWidth: 400, defaultHeight: 600 },
        { id: 'gallery', name: 'Gallery', icon: 'Image', component: 'GalleryApp', version: '1.0.0', defaultWidth: 700, defaultHeight: 500 },
        { id: 'calculator', name: 'Calculator', icon: 'Calculator', component: 'CalculatorApp', version: '1.0.0', defaultWidth: 320, defaultHeight: 480 },
        { id: 'store', name: 'App Store', icon: 'Package', component: 'StoreApp', version: '1.0.0', defaultWidth: 850, defaultHeight: 600 },
        { id: 'music', name: 'Groove Music', icon: 'Music', component: 'MusicApp', version: '1.0.0', defaultWidth: 360, defaultHeight: 550 },
        { id: 'video', name: 'Cinema', icon: 'Video', component: 'VideoPlayerApp', version: '1.0.0', defaultWidth: 720, defaultHeight: 480 },
        { id: 'clock', name: 'Clock', icon: 'Clock', component: 'ClockApp', version: '1.0.0', defaultWidth: 350, defaultHeight: 500 },
        { id: 'weather', name: 'Weather', icon: 'CloudSun', component: 'WeatherApp', version: '1.0.0', defaultWidth: 350, defaultHeight: 600 },
        { id: 'paint', name: 'Paint', icon: 'Palette', component: 'PaintApp', version: '1.0.0', defaultWidth: 800, defaultHeight: 600 },
        { id: 'ide', name: 'Viscro Studio', icon: 'Code', component: 'IDEApp', version: '1.0.0', defaultWidth: 900, defaultHeight: 600 },
        { id: 'news', name: 'News Stream', icon: 'Newspaper', component: 'NewsApp', version: '1.0.0', defaultWidth: 500, defaultHeight: 700 },
        { id: 'zip_export', name: 'Zip Export', icon: 'Archive', component: 'ZipExportApp', version: '1.0.0', defaultWidth: 800, defaultHeight: 500 },
      ];
      for (const app of apps) { await this.fs.write(\`/system/apps/\${app.id}.json\`, JSON.stringify(app)); }
      await this.registry.set('apps.installed', apps.map(a => a.id));
      const currentWp = await this.registry.get('user.desktop.wallpaper');
      if (!currentWp) await this.registry.set('user.desktop.wallpaper', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop');
      const brightness = await this.registry.get('user.display.brightness');
      if (brightness === undefined) await this.registry.set('user.display.brightness', 100);
      const volume = await this.registry.get('system.audio.volume');
      if (volume === undefined) { await this.registry.set('system.audio.volume', 0.8); this.audio.setMasterVolume(0.8); } else { this.audio.setMasterVolume(volume); }
      this.scheduler.start();
      this._booted = true;
      setTimeout(() => { this.notifications.push('Welcome to WebOS', 'System initialized.', true); }, 3000);
    } catch (e) { console.error('[KERNEL] Boot Failure', e); throw e; }
  }
  spawnProcess(name: string): number {
    const pid = this.pidCounter++;
    const process: Process = { pid, name, status: 'running', startTime: Date.now(), priority: 1 };
    this.scheduler.add(process);
    this.notify();
    return pid;
  }
  killProcess(pid: number): void { this.scheduler.remove(pid); this.notify(); }
  getProcesses(): Process[] { return this.scheduler.getAll(); }
  launchApp(appId: string, args?: any) { window.dispatchEvent(new CustomEvent('sys-launch-app', { detail: { appId, args } })); }
}
export const kernel = new Kernel();`,
  "services/vfs.ts": `import { IVFS, FileSystemBackend } from '../types';
interface MountPoint { path: string; backend: FileSystemBackend; }
export class VFS implements IVFS {
  private mounts: MountPoint[] = [];
  mount(path: string, backend: FileSystemBackend): void {
    this.mounts = this.mounts.filter(m => m.path !== path);
    this.mounts.push({ path, backend });
    this.mounts.sort((a, b) => b.path.length - a.path.length);
  }
  private resolve(path: string): { backend: FileSystemBackend, relativePath: string } | null {
    const cleanPath = path === '/' ? '/' : path.replace(//$/, '');
    for (const m of this.mounts) {
      const matchPrefix = m.path === '/' ? '/' : \`\${m.path}/\`;
      if (cleanPath === m.path || cleanPath.startsWith(matchPrefix)) {
        return { backend: m.backend, relativePath: cleanPath };
      }
    }
    return null;
  }
  async ls(path: string): Promise<string[]> {
    const resolved = this.resolve(path);
    if (!resolved) throw new Error(\`VFS Error: No file system mounted at \${path}\`);
    return resolved.backend.ls(resolved.relativePath);
  }
  async cat(path: string): Promise<string> {
    const resolved = this.resolve(path);
    if (!resolved) throw new Error(\`VFS Error: Path unmounted \${path}\`);
    return resolved.backend.cat(resolved.relativePath);
  }
  async write(path: string, data: string): Promise<void> {
    const resolved = this.resolve(path);
    if (!resolved) throw new Error(\`VFS Error: Path unmounted \${path}\`);
    const parent = path.substring(0, path.lastIndexOf('/'));
    if (parent && parent !== '' && parent !== '/') { if (!(await this.exists(parent))) throw new Error(\`VFS Error: Directory '\${parent}' does not exist.\`); }
    await resolved.backend.write(resolved.relativePath, data);
  }
  async mkdir(path: string): Promise<void> {
    const resolved = this.resolve(path);
    if (!resolved) throw new Error(\`VFS Error: Path unmounted \${path}\`);
    await resolved.backend.mkdir(resolved.relativePath);
  }
  async rm(path: string): Promise<void> {
    const resolved = this.resolve(path);
    if (!resolved) throw new Error(\`VFS Error: Path unmounted \${path}\`);
    await resolved.backend.rm(resolved.relativePath);
  }
  async exists(path: string): Promise<boolean> {
    const resolved = this.resolve(path);
    if (!resolved) return false;
    return resolved.backend.exists(resolved.relativePath);
  }
}`,
  "services/registry/prefs.ts": `import { IRegistry } from '../../types';
export class PersistentRegistry implements IRegistry {
  private cache: Map<string, any> = new Map();
  private dirty: boolean = false;
  private storageKey = 'webos_registry_dump';
  constructor() { this.load(); setInterval(() => this.flush(), 30000); }
  private load() { try { const raw = localStorage.getItem(this.storageKey); if (raw) { const data = JSON.parse(raw); for (const k in data) this.cache.set(k, data[k]); } } catch (e) {} }
  async flush(): Promise<void> { if (!this.dirty) return; const obj: Record<string, any> = {}; for (const [k, v] of this.cache.entries()) obj[k] = v; localStorage.setItem(this.storageKey, JSON.stringify(obj)); this.dirty = false; }
  async get(key: string): Promise<any> { return this.cache.get(key); }
  async set(key: string, value: any): Promise<void> { this.cache.set(key, value); this.dirty = true; }
  async delete(key: string): Promise<void> { this.cache.delete(key); this.dirty = true; }
  async list(prefix: string): Promise<string[]> { const keys: string[] = []; for (const k of this.cache.keys()) { if (k.startsWith(prefix)) keys.push(k); } return keys; }
}`,
  "services/vfs/backends.ts": `import { FileSystemBackend, FileNode, FileType } from '../../types';
export class IDBBackend implements FileSystemBackend {
  private db: IDBDatabase | null = null;
  constructor(private dbName: string = 'WebOS_VFS', private storeName: string = 'files') {}
  private openDB(): Promise<IDBDatabase> { return new Promise((resolve, reject) => { if (this.db) return resolve(this.db); const request = indexedDB.open(this.dbName, 1); request.onsuccess = (e) => { this.db = (e.target as any).result; resolve(this.db!); }; request.onupgradeneeded = (e) => { const db = (e.target as any).result; if (!db.objectStoreNames.contains(this.storeName)) db.createObjectStore(this.storeName, { keyPath: 'path' }); }; }); }
  async mount(): Promise<void> { await this.openDB(); }
  async exists(path: string): Promise<boolean> { const db = await this.openDB(); return new Promise(resolve => { const tx = db.transaction(this.storeName, 'readonly'); const req = tx.objectStore(this.storeName).get(path); req.onsuccess = () => resolve(!!req.result); req.onerror = () => resolve(false); }); }
  async ls(path: string): Promise<string[]> { const db = await this.openDB(); const searchPath = path === '/' ? '' : path.replace(//$/, ''); return new Promise((resolve) => { const tx = db.transaction(this.storeName, 'readonly'); const req = tx.objectStore(this.storeName).getAll(); req.onsuccess = () => { const all: FileNode[] = req.result; resolve(all.filter(f => { const parent = f.path.substring(0, f.path.lastIndexOf('/')); return (path === '/' || path === '') ? parent === '' : parent === searchPath; }).map(f => f.name + (f.type === FileType.DIR ? '/' : ''))); }; }); }
  async cat(path: string): Promise<string> { const db = await this.openDB(); return new Promise((resolve, reject) => { const tx = db.transaction(this.storeName, 'readonly'); const req = tx.objectStore(this.storeName).get(path); req.onsuccess = () => { if (!req.result) reject('File not found'); else resolve(req.result.content || ''); }; }); }
  async write(path: string, data: string): Promise<void> { const db = await this.openDB(); return new Promise((resolve) => { const tx = db.transaction(this.storeName, 'readwrite'); tx.objectStore(this.storeName).put({ path, name: path.split('/').pop() || '', type: FileType.FILE, content: data, parentId: path.substring(0, path.lastIndexOf('/')) || null, metadata: { created: Date.now(), modified: Date.now(), size: data.length } }); resolve(); }); }
  async mkdir(path: string): Promise<void> { const db = await this.openDB(); return new Promise((resolve) => { const tx = db.transaction(this.storeName, 'readwrite'); tx.objectStore(this.storeName).put({ path, name: path.split('/').pop() || '', type: FileType.DIR, content: null, parentId: path.substring(0, path.lastIndexOf('/')) || null, metadata: { created: Date.now(), modified: Date.now(), size: 0 } }); resolve(); }); }
  async rm(path: string): Promise<void> { const db = await this.openDB(); return new Promise((resolve) => { const tx = db.transaction(this.storeName, 'readwrite'); tx.objectStore(this.storeName).delete(path); resolve(); }); }
}
export class MemoryBackend implements FileSystemBackend {
  private files: Map<string, any> = new Map();
  async mount(): Promise<void> { this.files.clear(); }
  async exists(path: string): Promise<boolean> { return this.files.has(path); }
  async ls(path: string): Promise<string[]> { const searchPath = path === '/' ? '' : path.replace(//$/, ''); const res: string[] = []; for (const [p, node] of this.files.entries()) { const parent = p.substring(0, p.lastIndexOf('/')); if ((path === '/' && parent === '') || parent === searchPath) res.push(node.name + (node.type === FileType.DIR ? '/' : '')); } return res; }
  async cat(path: string): Promise<string> { return this.files.get(path)?.content || ''; }
  async write(path: string, data: string): Promise<void> { this.files.set(path, { path, name: path.split('/').pop(), type: FileType.FILE, content: data }); }
  async mkdir(path: string): Promise<void> { this.files.set(path, { path, name: path.split('/').pop(), type: FileType.DIR, content: null }); }
  async rm(path: string): Promise<void> { this.files.delete(path); }
}`,
  "services/vfs/opfs.ts": `import { FileSystemBackend } from '../../types';
const WORKER_SCRIPT = \`self.onmessage = async (e) => { const { id, path, data } = e.data; try { const root = await navigator.storage.getDirectory(); const parts = path.split('/').filter(p => p.length > 0); const fileName = parts.pop(); let current = root; for (const part of parts) { current = await current.getDirectoryHandle(part, { create: true }); } const fileHandle = await current.getFileHandle(fileName, { create: true }); const accessHandle = await fileHandle.createSyncAccessHandle(); const encoder = new TextEncoder(); const buffer = encoder.encode(data); accessHandle.truncate(0); accessHandle.write(buffer, { at: 0 }); accessHandle.flush(); accessHandle.close(); self.postMessage({ id, success: true }); } catch (err) { self.postMessage({ id, success: false, error: err.toString() }); } };\`;
export class OPFSBackend implements FileSystemBackend {
  private root: FileSystemDirectoryHandle | null = null;
  private vaultName = 'SECURE_VAULT.sys';
  private worker: Worker | null = null;
  private workerRequests = new Map<number, (res: any) => void>();
  private reqId = 0;
  async mount(): Promise<void> { if (!('storage' in navigator)) throw new Error('OPFS not supported'); this.root = await navigator.storage.getDirectory(); }
  async requestPersistence(): Promise<boolean> { return navigator.storage && navigator.storage.persist ? await navigator.storage.persist() : false; }
  private getWorker(): Worker { if (!this.worker) { const blob = new Blob([WORKER_SCRIPT], { type: 'application/javascript' }); this.worker = new Worker(URL.createObjectURL(blob)); this.worker.onmessage = (e) => { const resolver = this.workerRequests.get(e.data.id); if (resolver) { resolver(e.data); this.workerRequests.delete(e.data.id); } }; } return this.worker; }
  private async writeWithWorker(path: string, data: string): Promise<void> { return new Promise((resolve, reject) => { const id = this.reqId++; this.workerRequests.set(id, (res) => res.success ? resolve() : reject(res.error)); this.getWorker().postMessage({ id, path, data }); }); }
  async isLocked(): Promise<boolean> { if (!this.root) await this.mount(); try { const v = await this.root!.getDirectoryHandle(this.vaultName); await v.getFileHandle('.vault_lock'); return true; } catch { return false; } }
  async createLock(password: string): Promise<boolean> { if (!this.root) await this.mount(); const encoder = new TextEncoder(); const hash = await crypto.subtle.digest('SHA-256', encoder.encode(password)); const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join(''); const data = JSON.stringify({ hash: hashHex }); await this.writeWithWorker(\`\${this.vaultName}/.vault_lock\`, data); return true; }
  async unlock(password: string): Promise<boolean> { if (!this.root) await this.mount(); try { const v = await this.root!.getDirectoryHandle(this.vaultName); const f = await v.getFileHandle('.vault_lock'); const t = await (await f.getFile()).text(); const h = JSON.parse(t).hash; const encoder = new TextEncoder(); const hash = await crypto.subtle.digest('SHA-256', encoder.encode(password)); return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('') === h; } catch { return false; } }
  private async getHandle(path: string, create = false, type = 'file'): Promise<FileSystemHandle | null> { if (!this.root) await this.mount(); const parts = path.split('/').filter(p => p.length > 0); let current = await this.root!.getDirectoryHandle(this.vaultName, { create: false }); for (let i = 0; i < parts.length; i++) { const part = parts[i]; if (i === parts.length - 1) return type === 'file' ? await current.getFileHandle(part, { create }) : await current.getDirectoryHandle(part, { create }); else current = await current.getDirectoryHandle(part, { create }); } return current; }
  async exists(path: string): Promise<boolean> { try { return !!(await this.getHandle(path)); } catch { return false; } }
  async ls(path: string): Promise<string[]> { if (!this.root) await this.mount(); const h = path === '/' ? await this.root!.getDirectoryHandle(this.vaultName) : await this.getHandle(path, false, 'dir') as FileSystemDirectoryHandle; const r: string[] = []; for await (const [n, e] of (h as any).entries()) { if (n !== '.vault_lock') r.push(n + (e.kind === 'directory' ? '/' : '')); } return r; }
  async cat(path: string): Promise<string> { const h = await this.getHandle(path) as FileSystemFileHandle; return await (await h.getFile()).text(); }
  async write(path: string, data: string): Promise<void> { await this.writeWithWorker(\`\${this.vaultName}/\${path.startsWith('/')?path.slice(1):path}\`, data); }
  async mkdir(path: string): Promise<void> { await this.getHandle(path, true, 'dir'); }
  async rm(path: string): Promise<void> { const p = path.split('/'); const n = p.pop(); let d = await this.root!.getDirectoryHandle(this.vaultName); for (const part of p) if (part) d = await d.getDirectoryHandle(part); await d.removeEntry(n!, { recursive: true }); }
}`,
  "services/vfs/native.ts": `import { FileSystemBackend } from '../../types';
export class NativeFSBackend implements FileSystemBackend {
  constructor(private rootHandle: FileSystemDirectoryHandle) {}
  async mount() {}
  private async getHandle(path: string, create=false, type='file'): Promise<FileSystemHandle|null> { const parts=path.split('/').filter(p=>p); let c=this.rootHandle; for(let i=0;i<parts.length;i++) { const p=parts[i]; if(i===parts.length-1) return type==='file'?await c.getFileHandle(p,{create}):await c.getDirectoryHandle(p,{create}); else c=await c.getDirectoryHandle(p,{create}); } return c; }
  async exists(path: string): Promise<boolean> { try { return !!(await this.getHandle(path)); } catch { return false; } }
  async ls(path: string): Promise<string[]> { const h = path==='/'||path===''?this.rootHandle:await this.getHandle(path,false,'dir') as FileSystemDirectoryHandle; const r=[]; for await(const [n,e] of (h as any).entries()) r.push(n+(e.kind==='directory'?'/':'')); return r; }
  async cat(path: string): Promise<string> { const h=await this.getHandle(path) as FileSystemFileHandle; const f=await h.getFile(); if(f.type.startsWith('image/')||f.type.startsWith('video/')) return URL.createObjectURL(f); return await f.text(); }
  async write(path: string, data: string): Promise<void> { const h=await this.getHandle(path,true) as FileSystemFileHandle; const w=await (h as any).createWritable(); await w.write(data); await w.close(); }
  async mkdir(path: string): Promise<void> { await this.getHandle(path,true,'dir'); }
  async rm(path: string): Promise<void> { const p=path.split('/'); const n=p.pop(); let d=this.rootHandle; for(const x of p) if(x) d=await d.getDirectoryHandle(x); await d.removeEntry(n!,{recursive:true}); }
}`,
  "services/kernel/scheduler.ts": `import { Process } from '../../types';
interface ProcessEntry { process: Process; onSlice?: () => void; }
export class Scheduler {
  private processTable: Map<number, ProcessEntry> = new Map();
  private queue: number[] = [];
  private currentPid: number | null = null;
  private intervalId: number | null = null;
  add(process: Process) { this.processTable.set(process.pid, { process }); if (process.status === 'running') this.queue.push(process.pid); }
  remove(pid: number) { this.processTable.delete(pid); this.queue = this.queue.filter(p => p !== pid); if (this.currentPid === pid) this.currentPid = null; }
  getAll(): Process[] { return Array.from(this.processTable.values()).map(e => e.process); }
  start() { if (this.intervalId) return; this.intervalId = window.setInterval(() => this.tick(), 100); }
  stop() { if (this.intervalId) clearInterval(this.intervalId); }
  private tick() { if (this.queue.length === 0) return; if (this.currentPid !== null) { const prev = this.processTable.get(this.currentPid); if (prev) { prev.process.status = 'ready'; this.queue.push(this.currentPid); } } const next = this.queue.shift(); if (next !== undefined) { this.currentPid = next; const e = this.processTable.get(next); if (e) e.process.status = 'running'; } }
}`,
  "App.tsx": `import React, { useEffect, useState, useRef } from 'react';
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
            const content = await kernel.fs.cat(\`/system/apps/\${id}.json\`);
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
            await kernel.fs.write(\`/user/home/\${file.name}\`, content);
            kernel.notifications.push('File Saved', \`\${file.name} saved.\`);
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
    <div ref={rootRef} className="h-screen w-screen bg-os-bg overflow-hidden relative font-sans text-os-text select-none" style={{ backgroundImage: wallpaper ? \`url(\${wallpaper})\` : undefined, backgroundSize: 'cover', fontSize: getFontSizePx() }} onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, show: true }); }} onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }} onDragLeave={() => setIsDraggingFile(false)} onDrop={handleDrop}>
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
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-os-panel/80 backdrop-blur-md rounded-2xl px-4 py-3 flex items-center space-x-4 shadow-2xl z-50">{windows.map(win => <div key={win.id} onClick={() => { if (win.isMinimized) updateWindow(win.id, { isMinimized: false }); setActiveWindowId(win.id); kernel.compositor.bringToFront(win.id); setWindows(kernel.compositor.getAllWindows()); }} className={\`relative group cursor-pointer transition-all active:scale-95 \${win.isMinimized ? 'opacity-50 grayscale' : 'opacity-100'} \${activeWindowId === win.id ? '-translate-y-2' : ''}\`}><div className="w-10 h-10 bg-os-border rounded-xl flex items-center justify-center">{ICONS[installedApps.find(a => a.id === win.appId)?.icon || 'Default'] || ICONS['Default']}</div>{activeWindowId === win.id && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full" />}</div>)}</div>
    </div>
  );
};
export default App;`,
  "components/BiosScreen.tsx": `import React, { useEffect, useState } from 'react';
export const BiosScreen: React.FC<{onComplete:()=>void}> = ({ onComplete }) => {
  const [lines, setLines] = useState<string[]>([]);
  useEffect(() => {
    const add = (t: string, d: number) => setTimeout(() => setLines(p => [...p, t]), d);
    add("AMIBIOS(C) 2025 American Megatrends, Inc.", 200);
    add("Shark OS Mobile Workstation BIOS v4.0", 400);
    add("CPU : WebAssembly Virtual Core @ 4.00GHz", 600);
    add("Memory Test : 4194304K OK", 1000);
    add("", 1200);
    add("Detecting Primary Master ... SharkFS System Drive", 1400);
    add("System Initialized.", 1800);
    setTimeout(onComplete, 2500);
  }, []);
  return <div className="fixed inset-0 bg-black text-[#a8a8a8] font-mono p-8 z-[10000]">{lines.map((l,i)=><div key={i}>{l}</div>)}</div>;
};`,
  "components/CommandPalette.tsx": `import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, Command } from 'lucide-react';
import { AppDefinition } from '../types';
export const CommandPalette: React.FC<{apps: AppDefinition[], onLaunch: (app: AppDefinition)=>void}> = ({ apps, onLaunch }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if ((e.ctrlKey && e.code === 'Space') || (e.metaKey && e.key === 'k')) { e.preventDefault(); setIsOpen(p => !p); } if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', down); return () => window.removeEventListener('keydown', down);
  }, []);
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 50); }, [isOpen]);
  const filtered = apps.filter(a => a.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  return isOpen ? <div className="fixed inset-0 z-[10000] bg-black/20 backdrop-blur flex items-start justify-center pt-[20vh]" onClick={() => setIsOpen(false)}><div className="w-[500px] bg-[#1e1e1e]/90 border border-white/10 rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}><div className="flex items-center px-4 py-4 border-b border-white/10"><Search className="text-gray-400 mr-3"/><input ref={inputRef} className="flex-1 bg-transparent text-xl text-white outline-none" placeholder="Search..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if(e.key==='Enter' && filtered[idx]) { onLaunch(filtered[idx]); setIsOpen(false); } }}/></div>{filtered.map((a,i) => <button key={a.id} className={\`w-full px-4 py-3 flex justify-between \${i===idx?'bg-blue-600 text-white':'text-gray-300'}\`} onClick={()=>{onLaunch(a);setIsOpen(false);}} onMouseEnter={()=>setIdx(i)}><span>{a.name}</span>{i===idx && <ArrowRight size={16}/>}</button>)}</div></div> : null;
};`,
  "components/ControlCenter.tsx": `import React, { useState } from 'react';
import { Wifi, Bluetooth, Moon, Volume2, Sun, X } from 'lucide-react';
import { kernel } from '../services/kernel';
export const ControlCenter: React.FC<{isOpen:boolean, onClose:()=>void, notifications:any[]}> = ({ isOpen, onClose, notifications }) => {
  const [vol, setVol] = useState(80);
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-[9999]"><div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}/><div className="absolute top-2 right-2 w-80 bg-black/80 backdrop-blur-xl rounded-3xl p-4 text-white"><div className="flex justify-between mb-4"><h2>Control Center</h2><button onClick={onClose}><X/></button></div><div className="grid grid-cols-2 gap-3 mb-4"><div className="bg-white/10 rounded p-3 flex gap-2"><Wifi/><Bluetooth/></div></div><div className="space-y-4"><div className="flex gap-3"><Sun/><input type="range" className="flex-1"/></div><div className="flex gap-3"><Volume2/><input type="range" value={vol} onChange={(e)=>{setVol(Number(e.target.value)); kernel.audio.setMasterVolume(Number(e.target.value)/100);}} className="flex-1"/></div></div><div className="mt-4"><h3>Notifications</h3>{notifications.map(n=><div key={n.id} className="bg-white/5 p-2 rounded mt-2 text-xs"><b>{n.title}</b><p>{n.message}</p></div>)}</div></div></div>;
};`,
  "components/FilePicker.tsx": `import React, { useState, useEffect } from 'react';
import { kernel } from '../services/kernel';
import { Folder, File, X } from 'lucide-react';
export const FilePicker: React.FC<{onSelect:(p:string)=>void, onCancel:()=>void}> = ({ onSelect, onCancel }) => {
  const [path, setPath] = useState('/user/home');
  const [items, setItems] = useState<string[]>([]);
  useEffect(() => { kernel.fs.ls(path).then(setItems); }, [path]);
  return <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-[9999]"><div className="bg-gray-800 w-96 h-96 flex flex-col rounded shadow-2xl text-white"><div className="flex justify-between p-3 border-b border-gray-700"><span>Select File</span><button onClick={onCancel}><X/></button></div><div className="bg-black p-2 text-xs">{path}</div><div className="flex-1 overflow-y-auto p-2">{path!=='/'&&<div onClick={()=>{setPath(path.substring(0,path.lastIndexOf('/'))||'/')}} className="flex gap-2 p-2 hover:bg-white/10 cursor-pointer"><Folder className="text-yellow-500"/>..</div>}{items.map(i=><div key={i} onClick={()=>{ if(i.endsWith('/')) setPath((path==='/'?'':path)+'/'+i.slice(0,-1)); else onSelect((path==='/'?'':path)+'/'+i); }} className="flex gap-2 p-2 hover:bg-white/10 cursor-pointer">{i.endsWith('/')?<Folder className="text-yellow-500"/>:<File className="text-blue-400"/>}{i}</div>)}</div></div></div>;
};`,
  "components/LockScreen.tsx": `import React, { useState, useEffect } from 'react';
import { Lock, ChevronUp } from 'lucide-react';
export const LockScreen: React.FC<{onUnlock:()=>void, wallpaper?:string}> = ({ onUnlock, wallpaper }) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return <div className="fixed inset-0 z-[8000] bg-black text-white flex flex-col items-center justify-between py-12" style={{backgroundImage: wallpaper? \`url(\${wallpaper})\`:undefined, backgroundSize:'cover'}} onClick={onUnlock}><div className="mt-12 text-center"><Lock size={24} className="mb-4 mx-auto"/><h1 className="text-7xl font-thin">{time.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</h1><p>{time.toLocaleDateString()}</p></div><div className="animate-bounce flex flex-col items-center"><ChevronUp/><span>Click to unlock</span></div></div>;
};`,
  "components/SplashScreen.tsx": `import React, { useEffect, useState } from 'react';
export const SplashScreen: React.FC<{onComplete:()=>void}> = ({ onComplete }) => {
  const [opacity, setOpacity] = useState(1);
  useEffect(() => { setTimeout(() => { setOpacity(0); setTimeout(onComplete, 1000); }, 3000); }, []);
  return <div className="fixed inset-0 z-[10000] bg-black flex items-center justify-center transition-opacity duration-1000" style={{opacity, pointerEvents:opacity===0?'none':'auto'}}><div className="text-center"><h1 className="text-5xl font-black text-white tracking-[0.5em]">SHARK OS</h1><div className="mt-8 w-64 h-1 bg-gray-900 rounded-full overflow-hidden"><div className="h-full bg-blue-600 animate-[loading_3s_ease-in-out_forwards]"/></div></div><style>{\`@keyframes loading { 0% { width: 0%; } 100% { width: 100%; } }\`}</style></div>;
};`,
  "components/StatusBar.tsx": `import React, { useState, useEffect } from 'react';
import { Battery, Wifi } from 'lucide-react';
export const StatusBar: React.FC<{onToggleControlCenter:()=>void}> = ({ onToggleControlCenter }) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return <div onClick={onToggleControlCenter} className="h-6 bg-black/40 backdrop-blur text-white flex justify-between px-4 text-xs items-center cursor-pointer z-[9000] fixed top-0 w-full"><span>{time.toLocaleTimeString()}</span><div className="flex gap-2"><Wifi size={14}/><Battery size={14}/></div></div>;
};`,
  "components/Window.tsx": `import React, { useState } from 'react';
import { X, Minus, Square, Maximize2 } from 'lucide-react';
export const Window: React.FC<any> = ({ state, onClose, onMinimize, onMaximize, onFocus, onUpdate, children }) => {
  const [drag, setDrag] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  if (state.isMinimized) return null;
  return <div style={{ left: state.isMaximized?0:state.x, top: state.isMaximized?0:state.y, width: state.isMaximized?'100%':state.width, height: state.isMaximized?'100%':state.height, zIndex: state.zIndex, position: 'absolute' }} className="bg-[#1e293b] border border-[#334155] shadow-2xl rounded-lg overflow-hidden flex flex-col" onMouseDown={() => onFocus(state.id)}><div className="h-10 bg-[#334155]/50 flex items-center px-3 select-none" onMouseDown={(e) => { if (!state.isMaximized) { setDrag(true); setOffset({ x: e.clientX - state.x, y: e.clientY - state.y }); } }} onDoubleClick={() => onMaximize(state.id)} onMouseUp={() => setDrag(false)} onMouseMove={(e) => { if (drag) onUpdate(state.id, { x: e.clientX - offset.x, y: e.clientY - offset.y }); }}><span className="text-gray-200 text-sm flex-1">{state.title}</span><div className="flex gap-2"><button onClick={() => onMinimize(state.id)}><Minus size={14} color="white"/></button><button onClick={() => onMaximize(state.id)}>{state.isMaximized ? <Square size={12} color="white"/> : <Maximize2 size={12} color="white"/>}</button><button onClick={() => onClose(state.id)}><X size={14} color="red"/></button></div></div><div className="flex-1 overflow-hidden bg-[#0f172a] relative">{children}</div></div>;
};`,
  "apps/CalculatorApp.tsx": `import React, { useState } from 'react';
export const CalculatorApp = () => {
  const [disp, setDisp] = useState('0');
  const btn = (l: string, c: string) => <button onClick={() => setDisp(disp === '0' ? l : disp + l)} className={\`h-14 w-14 rounded-full font-bold \${c}\`}>{l}</button>;
  return <div className="h-full bg-black text-white flex flex-col p-4"><div className="flex-1 flex items-end justify-end text-6xl mb-4">{disp}</div><div className="grid grid-cols-4 gap-3"><button onClick={() => setDisp('0')} className="bg-gray-400 text-black h-14 w-14 rounded-full">AC</button>{['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(b => btn(b, 'bg-gray-800'))}</div></div>;
};`,
  "apps/CameraApp.tsx": `import React, { useRef, useEffect } from 'react';
export const CameraApp = () => {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => { navigator.mediaDevices.getUserMedia({ video: true }).then(s => { if(v.current) v.current.srcObject = s; }); }, []);
  return <div className="h-full bg-black"><video ref={v} autoPlay className="w-full h-full object-cover"/></div>;
};`,
  "apps/ClockApp.tsx": `import React, { useState, useEffect } from 'react';
export const ClockApp = () => {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  return <div className="h-full bg-black text-white flex items-center justify-center text-6xl font-thin">{t.toLocaleTimeString()}</div>;
};`,
  "apps/EditorApp.tsx": `import React, { useState, useEffect } from 'react';
import { kernel } from '../services/kernel';
import { Save, FolderOpen } from 'lucide-react';
import { FilePicker } from '../components/FilePicker';
export const EditorApp: React.FC<{file?:string}> = ({ file }) => {
  const [path, setPath] = useState(file || '/user/home/notes.txt');
  const [content, setContent] = useState('');
  const [picker, setPicker] = useState(false);
  useEffect(() => { if (file) kernel.fs.cat(file).then(setContent).catch(()=>setContent('')); }, [file]);
  return <div className="flex flex-col h-full bg-gray-900 text-white">{picker && <FilePicker onSelect={(p)=>{setPath(p);setPicker(false);kernel.fs.cat(p).then(setContent);}} onCancel={()=>setPicker(false)}/>}<div className="flex p-2 bg-gray-800 gap-2"><button onClick={()=>setPicker(true)}><FolderOpen/></button><input value={path} onChange={e=>setPath(e.target.value)} className="bg-transparent border border-gray-600 flex-1 px-2"/><button onClick={()=>kernel.fs.write(path,content)}><Save/></button></div><textarea className="flex-1 bg-[#1e1e1e] p-4 font-mono resize-none outline-none" value={content} onChange={e=>setContent(e.target.value)}/></div>;
};`,
  "apps/FilesApp.tsx": `import React, { useState, useEffect } from 'react';
import { kernel } from '../services/kernel';
import { Folder, File, HardDrive, Shield } from 'lucide-react';
export const FilesApp = () => {
  const [path, setPath] = useState('/user/home');
  const [items, setItems] = useState<string[]>([]);
  useEffect(() => { kernel.fs.ls(path).then(setItems).catch(() => setItems([])); }, [path]);
  return <div className="flex h-full bg-gray-100 text-black"><div className="w-48 bg-gray-200 p-2"><button onClick={() => setPath('/')} className="block w-full text-left p-2 hover:bg-white">Root</button><button onClick={() => setPath('/user/home')} className="block w-full text-left p-2 hover:bg-white">Home</button><button onClick={() => setPath('/user/secure')} className="block w-full text-left p-2 hover:bg-white flex gap-2"><Shield size={16}/> Vault</button></div><div className="flex-1 p-4"><div className="mb-4 font-bold">{path}</div><div className="grid grid-cols-6 gap-4">{path!=='/'&&<div onClick={() => setPath(path.substring(0, path.lastIndexOf('/')) || '/')} className="cursor-pointer flex flex-col items-center"><Folder className="text-yellow-500" size={40}/>..</div>}{items.map(i => <div key={i} onClick={() => i.endsWith('/') ? setPath((path==='/'?'':path)+'/'+i.slice(0,-1)) : kernel.launchApp('editor', {file: (path==='/'?'':path)+'/'+i})} className="cursor-pointer flex flex-col items-center p-2 hover:bg-blue-100 rounded">{i.endsWith('/')?<Folder className="text-yellow-500" size={40}/>:<File className="text-gray-500" size={40}/>}<span className="text-xs mt-1 truncate w-full text-center">{i.replace('/','')}</span></div>)}</div></div></div>;
};`,
  "apps/GalleryApp.tsx": `import React, { useState, useEffect } from 'react';
import { kernel } from '../services/kernel';
export const GalleryApp = () => {
  const [imgs, setImgs] = useState<string[]>([]);
  useEffect(() => { kernel.fs.ls('/user/home/photos').then(async files => { const urls = await Promise.all(files.filter(f => f.endsWith('.png')).map(f => kernel.fs.cat('/user/home/photos/'+f))); setImgs(urls); }); }, []);
  return <div className="h-full bg-black p-4 grid grid-cols-4 gap-2 overflow-auto">{imgs.map((src, i) => <img key={i} src={src} className="w-full h-auto border border-gray-700"/>)}</div>;
};`,
  "apps/IDEApp.tsx": `import React, { useState } from 'react';
import { kernel } from '../services/kernel';
import { Play } from 'lucide-react';
export const IDEApp = () => {
  const [code, setCode] = useState('<h1>Hello</h1>');
  const run = async () => { await kernel.fs.write('/system/apps/test.src', code); kernel.launchApp('test_app'); };
  return <div className="h-full flex flex-col bg-[#1e1e1e] text-white"><div className="h-10 bg-[#333] flex items-center px-4"><button onClick={run} className="flex gap-2 bg-green-600 px-3 py-1 rounded text-xs"><Play size={14}/> Run</button></div><textarea value={code} onChange={e=>setCode(e.target.value)} className="flex-1 bg-transparent p-4 font-mono outline-none"/></div>;
};`,
  "apps/MusicApp.tsx": `import React, { useState } from 'react';
import { Play, Pause } from 'lucide-react';
export const MusicApp = () => {
  const [play, setPlay] = useState(false);
  return <div className="h-full bg-purple-900 text-white flex items-center justify-center"><button onClick={()=>setPlay(!play)} className="w-20 h-20 bg-white text-purple-900 rounded-full flex items-center justify-center">{play?<Pause/>:<Play/>}</button></div>;
};`,
  "apps/NewsApp.tsx": `import React, { useEffect, useState } from 'react';
import { kernel } from '../services/kernel';
export const NewsApp = () => {
  const [news, setNews] = useState<any[]>([]);
  useEffect(() => { kernel.net.request('https://hacker-news.firebaseio.com/v0/topstories.json').then(async (ids) => { const top5 = JSON.parse(ids).slice(0, 10); const stories = await Promise.all(top5.map((id:any) => kernel.net.request(\`https://hacker-news.firebaseio.com/v0/item/\${id}.json\`).then(JSON.parse))); setNews(stories); }); }, []);
  return <div className="h-full bg-[#f6f6ef] overflow-auto p-4">{news.map(n => <div key={n.id} className="mb-2 p-2 bg-white border border-gray-300 rounded"><a href={n.url} target="_blank" className="font-bold text-black">{n.title}</a><div className="text-xs text-gray-500">{n.score} points by {n.by}</div></div>)}</div>;
};`,
  "apps/PaintApp.tsx": `import React, { useRef, useState } from 'react';
export const PaintApp = () => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [draw, setDraw] = useState(false);
  const move = (e: any) => { if(!draw) return; const ctx = canvas.current?.getContext('2d'); if(ctx) { ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY); ctx.stroke(); } };
  return <div className="h-full bg-white"><canvas ref={canvas} width={800} height={600} onMouseDown={()=>{setDraw(true); canvas.current?.getContext('2d')?.beginPath();}} onMouseUp={()=>setDraw(false)} onMouseMove={move} className="cursor-crosshair"/></div>;
};`,
  "apps/RuntimeApp.tsx": `import React, { useEffect, useState } from 'react';
import { kernel } from '../services/kernel';
export const RuntimeLoader: React.FC<{appId:string}> = ({ appId }) => {
  const [src, setSrc] = useState('');
  useEffect(() => { kernel.fs.cat(\`/system/apps/\${appId}.src\`).then(s => setSrc(URL.createObjectURL(new Blob([s], {type:'text/html'})))); }, [appId]);
  return src ? <iframe src={src} className="w-full h-full border-none"/> : <div>Loading...</div>;
};
export const RuntimeApp = () => <div>Host</div>;`,
  "apps/SearchApp.tsx": `import React, { useState } from 'react';
export const SearchApp = () => {
  const [url, setUrl] = useState('https://www.google.com/search?igu=1');
  return <div className="h-full flex flex-col"><input className="p-2 border-b" onKeyDown={e=>{if(e.key==='Enter') setUrl((e.target as any).value)}} defaultValue={url}/><iframe src={url} className="flex-1 border-none"/></div>;
};`,
  "apps/SettingsApp.tsx": `import React from 'react';
import { kernel } from '../services/kernel';
export const SettingsApp = () => {
  const bg = (u: string) => kernel.registry.set('user.desktop.wallpaper', u).then(() => window.dispatchEvent(new CustomEvent('sys-config-update')));
  return <div className="h-full bg-gray-900 text-white p-6"><h2>Settings</h2><div className="grid grid-cols-2 gap-4 mt-4"><button onClick={()=>bg('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564')} className="h-20 bg-gray-800">Abstract</button><button onClick={()=>bg('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000')} className="h-20 bg-gray-800">Space</button></div></div>;
};`,
  "apps/StoreApp.tsx": `import React from 'react';
import { kernel } from '../services/kernel';
export const StoreApp = () => {
  const install = (id: string) => kernel.pkg.install(id).then(()=>alert('Installed'));
  return <div className="h-full bg-white p-6 text-black"><h1>App Store</h1><div className="border p-4 mt-4 rounded flex justify-between"><span>Tic Tac Toe</span><button onClick={()=>install('tictactoe')} className="bg-blue-500 text-white px-4 rounded">Get</button></div></div>;
};`,
  "apps/SystemMonitorApp.tsx": `import React, { useState, useEffect } from 'react';
import { kernel } from '../services/kernel';
export const SystemMonitorApp = () => {
  const [procs, setProcs] = useState(kernel.getProcesses());
  useEffect(() => { const i = setInterval(() => setProcs(kernel.getProcesses()), 1000); return () => clearInterval(i); }, []);
  return <div className="h-full bg-white p-4 text-black"><h2 className="font-bold mb-4">Task Manager</h2><table className="w-full"><thead><tr><th>PID</th><th>Name</th><th>Status</th><th>Action</th></tr></thead><tbody>{procs.map(p=><tr key={p.pid}><td>{p.pid}</td><td>{p.name}</td><td>{p.status}</td><td><button className="text-red-500" onClick={()=>kernel.killProcess(p.pid)}>Kill</button></td></tr>)}</tbody></table></div>;
};`,
  "apps/TerminalApp.tsx": `import React, { useState } from 'react';
import { Shell } from '../services/terminal/sh';
export const TerminalApp = () => {
  const [lines, setLines] = useState(['WebOS Kernel v4.0']);
  const [sh] = useState(new Shell());
  return <div className="h-full bg-black text-green-500 font-mono p-4 overflow-auto">{lines.map((l,i)=><div key={i}>{l}</div>)}<div className="flex"><span>$ </span><input className="bg-transparent outline-none flex-1 text-green-500" onKeyDown={e=>{if(e.key==='Enter'){ const v = (e.target as any).value; setLines(p=>[...p, '$ '+v]); sh.exec(v, (t)=>setLines(x=>[...x,t]), ()=>{}, ()=>'/').then(()=>(e.target as any).value=''); }}} autoFocus/></div></div>;
};`,
  "apps/TicTacToeApp.tsx": `import React, { useState } from 'react';
export const TicTacToeApp = () => {
  const [b, setB] = useState(Array(9).fill(null));
  const [x, setX] = useState(true);
  const c = (i: number) => { const n = [...b]; n[i] = x?'X':'O'; setB(n); setX(!x); };
  return <div className="h-full bg-gray-800 flex items-center justify-center"><div className="grid grid-cols-3 gap-2">{b.map((v,i)=><button key={i} onClick={()=>c(i)} className="w-16 h-16 bg-white text-2xl font-bold">{v}</button>)}</div></div>;
};`,
  "apps/VideoPlayerApp.tsx": `import React from 'react';
export const VideoPlayerApp: React.FC<{file?:string}> = ({file}) => <div className="h-full bg-black flex items-center justify-center"><video src={file || "https://media.w3.org/2010/05/sintel/trailer.mp4"} controls className="max-w-full max-h-full"/></div>;`,
  "apps/WeatherApp.tsx": `import React, { useEffect, useState } from 'react';
import { kernel } from '../services/kernel';
export const WeatherApp = () => {
  const [temp, setTemp] = useState('Loading...');
  useEffect(() => { kernel.net.request('https://api.open-meteo.com/v1/forecast?latitude=51.5&longitude=-0.12&current_weather=true').then(d => setTemp(JSON.parse(d).current_weather.temperature + '°C')); }, []);
  return <div className="h-full bg-blue-400 text-white flex items-center justify-center text-6xl font-thin">{temp}</div>;
};`,
  "services/terminal/sh.ts": `import { kernel } from '../kernel';
export class Shell {
  async exec(cmd: string, print: (s:string)=>void, setCwd: (p:string)=>void, getCwd: ()=>string) {
    const args = cmd.split(' ');
    const c = args[0];
    if (c === 'ls') { const files = await kernel.fs.ls(getCwd()); print(files.join('  ')); }
    else if (c === 'echo') print(args.slice(1).join(' '));
    else if (c === 'clear') print('__CLEAR__'); // Handled by UI usually
    else print(\`\${c}: command not found\`);
  }
  getCommandsList() { return ['ls','cd','cat','echo','mkdir','rm','touch','clear','help']; }
}`,
  "services/system/machine.ts": `export class MachineIdentity { static getMachineId() { return 'mach-' + crypto.randomUUID(); } }`,
  "services/system/power.ts": `export class PowerManager { async init() {} }`,
  "services/net/stack.ts": `export class NetworkStack { async init() {} async request(url: string) { const r = await fetch(url); return await r.text(); } }`,
  "services/pkg/manager.ts": `export class PackageManager { async init() {} isSystemApp(id:string){return false;} async install(id:string) {} async installVPX(p:string){} async uninstall(id:string){} }`,
  "services/wm/compositor.ts": `import { WindowState } from '../../types'; export class Compositor { private wins = new Map<string, WindowState>(); registerWindow(w: WindowState) { this.wins.set(w.id, w); } unregisterWindow(id: string) { this.wins.delete(id); } updateWindow(id: string, u: Partial<WindowState>) { const w = this.wins.get(id); if (w) this.wins.set(id, { ...w, ...u }); } bringToFront(id: string) { const w = this.wins.get(id); if (w) { w.zIndex = Date.now(); this.wins.set(id, { ...w }); } } getAllWindows() { return Array.from(this.wins.values()).sort((a,b)=>a.zIndex-b.zIndex); } }`,
  "services/media/audio.ts": `export class AudioMixer { private ctx = new AudioContext(); private gain = this.ctx.createGain(); constructor() { this.gain.connect(this.ctx.destination); } async init() {} setMasterVolume(v:number) { this.gain.gain.value = v; } resume() { this.ctx.resume(); } setMute(m:boolean){} getMute(){return false;} }`,
  "services/system/clipboard.ts": `export class ClipboardManager { async copy(t:string){ await navigator.clipboard.writeText(t); } async paste(){ return await navigator.clipboard.readText(); } }`,
  "services/system/notifications.ts": `import { Notification } from '../../types'; export class NotificationManager { private subs: any[] = []; private hist: Notification[] = []; push(t: string, m: string, u = false) { const n = { id: crypto.randomUUID(), title: t, message: m, timestamp: Date.now(), urgent: u }; this.hist.unshift(n); this.subs.forEach(cb => cb(n)); } subscribe(cb: any) { this.subs.push(cb); return () => this.subs = this.subs.filter(s => s !== cb); } getHistory() { return this.hist; } }`,
  "services/input/voice.ts": `export class VoiceControl { subscribe(cb:any){return ()=>{}} toggle(){} }`,
  "services/input/gestures.ts": `export class GestureRecognizer { attach(el: HTMLElement){} addListener(cb:any){} }`,
};
