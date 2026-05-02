import { execa } from 'execa';

export async function isGitRepository(): Promise<boolean> {
  try {
    await execa('git', ['rev-parse', '--is-inside-work-tree']);
    return true;
  } catch {
    return false;
  }
}

export async function hasStagedChanges(): Promise<boolean> {
  const { stdout } = await execa('git', ['status', '--porcelain']);
  // Lines starting with any non-space char or starting with space and then non-space.
  // Actually, staged changes are indicated by the first column being something other than ' ' or '?'.
  // We can also just use git diff --cached --quiet to check for staged changes.
  try {
    await execa('git', ['diff', '--cached', '--quiet']);
    return false; // Exit code 0 means no differences
  } catch (error: any) {
    if (error.exitCode === 1) {
      return true; // Exit code 1 means there are differences
    }
    throw error;
  }
}

export async function getStagedDiff(): Promise<string> {
  const { stdout } = await execa('git', [
    'diff',
    '--cached',
    '--no-color',
    '--ignore-all-space'
  ]);
  
  return stdout;
}

export async function getChangedFiles(): Promise<string[]> {
  const { stdout } = await execa('git', [
    'diff',
    '--cached',
    '--name-only'
  ]);
  return stdout.split('\n').filter(Boolean);
}

export async function commitChanges(message: string): Promise<void> {
  await execa('git', ['commit', '-m', message]);
}
