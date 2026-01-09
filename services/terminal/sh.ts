import { kernel } from '../kernel';
export class Shell {
  async exec(cmd: string, print: (s:string)=>void, setCwd: (p:string)=>void, getCwd: ()=>string) {
    const args = cmd.split(' ');
    const c = args[0];
    if (c === 'ls') { const files = await kernel.fs.ls(getCwd()); print(files.join('  ')); }
    else if (c === 'echo') print(args.slice(1).join(' '));
    else if (c === 'clear') print('__CLEAR__'); // Handled by UI usually
    else print(`${c}: command not found`);
  }
  getCommandsList() { return ['ls','cd','cat','echo','mkdir','rm','touch','clear','help']; }
}