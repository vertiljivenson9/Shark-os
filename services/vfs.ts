import { IVFS, FileSystemBackend } from '../types';
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
      const matchPrefix = m.path === '/' ? '/' : `${m.path}/`;
      if (cleanPath === m.path || cleanPath.startsWith(matchPrefix)) {
        return { backend: m.backend, relativePath: cleanPath };
      }
    }
    return null;
  }
  async ls(path: string): Promise<string[]> {
    const resolved = this.resolve(path);
    if (!resolved) throw new Error(`VFS Error: No file system mounted at ${path}`);
    return resolved.backend.ls(resolved.relativePath);
  }
  async cat(path: string): Promise<string> {
    const resolved = this.resolve(path);
    if (!resolved) throw new Error(`VFS Error: Path unmounted ${path}`);
    return resolved.backend.cat(resolved.relativePath);
  }
  async write(path: string, data: string): Promise<void> {
    const resolved = this.resolve(path);
    if (!resolved) throw new Error(`VFS Error: Path unmounted ${path}`);
    const parent = path.substring(0, path.lastIndexOf('/'));
    if (parent && parent !== '' && parent !== '/') { if (!(await this.exists(parent))) throw new Error(`VFS Error: Directory '${parent}' does not exist.`); }
    await resolved.backend.write(resolved.relativePath, data);
  }
  async mkdir(path: string): Promise<void> {
    const resolved = this.resolve(path);
    if (!resolved) throw new Error(`VFS Error: Path unmounted ${path}`);
    await resolved.backend.mkdir(resolved.relativePath);
  }
  async rm(path: string): Promise<void> {
    const resolved = this.resolve(path);
    if (!resolved) throw new Error(`VFS Error: Path unmounted ${path}`);
    await resolved.backend.rm(resolved.relativePath);
  }
  async exists(path: string): Promise<boolean> {
    const resolved = this.resolve(path);
    if (!resolved) return false;
    return resolved.backend.exists(resolved.relativePath);
  }
}