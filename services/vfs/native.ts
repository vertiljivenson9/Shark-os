import { FileSystemBackend } from '../../types';
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
}