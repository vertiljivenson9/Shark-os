import { FileSystemBackend, FileNode, FileType } from '../../types';
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
}