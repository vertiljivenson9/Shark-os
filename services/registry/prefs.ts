import { IRegistry } from '../../types';
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
}