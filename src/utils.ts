import chalk from 'chalk';
import ora from 'ora';
import { spawn } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

export const logger = {
  info: (msg: string) => console.log(chalk.blue('ℹ'), msg),
  success: (msg: string) => console.log(chalk.green('✔'), msg),
  warn: (msg: string) => console.log(chalk.yellow('⚠'), msg),
  error: (msg: string) => console.error(chalk.red('✖'), msg),
};

export const spinner = (text: string) => ora(text);

export async function openEditor(content: string): Promise<string> {
  const editor = process.env.EDITOR || process.env.VISUAL || 'vi';
  const tmpFile = path.join(os.tmpdir(), `smart-commit-EDITMSG-${Date.now()}`);
  
  await fs.writeFile(tmpFile, content, 'utf-8');
  
  return new Promise((resolve, reject) => {
    const child = spawn(editor, [tmpFile], {
      stdio: 'inherit',
    });

    child.on('exit', async (code) => {
      if (code !== 0) {
        reject(new Error(`Editor exited with code ${code}`));
        return;
      }
      
      try {
        const editedContent = await fs.readFile(tmpFile, 'utf-8');
        await fs.unlink(tmpFile).catch(() => {}); // cleanup
        resolve(editedContent.trim());
      } catch (err) {
        reject(err);
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to start editor ${editor}: ${err.message}`));
    });
  });
}
