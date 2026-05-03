import type { CommitType } from '../types/index.js';

export function generatePrompt(diff: string, type: CommitType | null): string {
  const typeConstraint = type ? `Use type: ${type}.` : 'Determine the best conventional commit type.';
  
  return `${typeConstraint}\n\nGit diff:\n${diff}`;
}