import type { CommitType } from '../types/index.js';

export function generatePrompt(diff: string, type: CommitType | null, files: string[] = []): string {
  const typeConstraint = type ? `Use type: ${type}.` : 'Determine the best conventional commit type.';
  const filesInfo = files.length > 0 ? `\n\nChanged files: ${files.join(', ')}` : '';
  
  return `${typeConstraint}${filesInfo}\n\nGit diff:\n${diff}`;
}