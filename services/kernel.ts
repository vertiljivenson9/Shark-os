import { VFS } from './vfs';
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
          const path = `/system/bin/${bin}`;
          if (!(await this.fs.exists(path))) await this.fs.write(path, '#!/bin/bash\n# Binary stub'); 
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
      for (const app of apps) { await this.fs.write(`/system/apps/${app.id}.json`, JSON.stringify(app)); }
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
export const kernel = new Kernel();