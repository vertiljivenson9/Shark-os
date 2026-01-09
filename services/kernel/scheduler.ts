import { Process } from '../../types';
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
}