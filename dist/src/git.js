import { execa } from 'execa';
export async function isGitRepository() {
    try {
        await execa('git', ['rev-parse', '--is-inside-work-tree']);
        return true;
    }
    catch {
        return false;
    }
}
export async function hasStagedChanges() {
    const { stdout } = await execa('git', ['status', '--porcelain']);
    // Lines starting with any non-space char or starting with space and then non-space.
    // Actually, staged changes are indicated by the first column being something other than ' ' or '?'.
    // We can also just use git diff --cached --quiet to check for staged changes.
    try {
        await execa('git', ['diff', '--cached', '--quiet']);
        return false; // Exit code 0 means no differences
    }
    catch (error) {
        if (error.exitCode === 1) {
            return true; // Exit code 1 means there are differences
        }
        throw error;
    }
}
export async function getStagedDiff() {
    const { stdout } = await execa('git', [
        'diff',
        '--cached',
        '--no-color',
        '--ignore-all-space'
    ]);
    return stdout;
}
export async function getChangedFiles() {
    const { stdout } = await execa('git', [
        'diff',
        '--cached',
        '--name-only'
    ]);
    return stdout.split('\n').filter(Boolean);
}
export async function commitChanges(message) {
    await execa('git', ['commit', '-m', message]);
}
