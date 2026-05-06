import type { CommitType } from '../types/index.js';

export function cleanDiff(diff: string): string {
  return diff
    .split('\n')
    .filter((line) => {
      return (
        !line.startsWith('diff --git') &&
        !line.startsWith('index ') &&
        !line.startsWith('--- ') &&
        !line.startsWith('+++ ')
      );
    })
    .join('\n')
    .trim();
}

export function generatePrompt(diff: string, type: CommitType | null, files: string[] = [], branchName: string = ''): string {
  const typeConstraint = type ? `Use type: ${type}.` : 'Determine the best conventional commit type.';
  const filesInfo = files.length > 0 ? `\n\nChanged files: ${files.join(', ')}` : '';

  let ticketInstruction = '';
  if (branchName) {
    const ticketMatch = branchName.match(/[A-Z]+-\d+/);
    if (ticketMatch) {
      ticketInstruction = `\n\nIMPORTANT: The branch name contains ticket ID ${ticketMatch[0]}. You MUST append [${ticketMatch[0]}] to the end of the commit summary line.`;
    }
  }

  return `${typeConstraint}${filesInfo}${ticketInstruction}\n\nGit diff:\n${diff}`;
}