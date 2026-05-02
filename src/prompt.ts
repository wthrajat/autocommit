import type { CommitType } from './types.js';

export function generatePrompt(diff: string, type: CommitType | null): string {
  const typeStr = type ? type : 'Determine the best type (e.g. feat, fix, chore, docs, refactor, test) based on the diff.';
  
  return `You are generating a git commit message.

Rules:
1. Follow conventional commits strictly
2. Be concise and specific
3. Do not explain, only output the message
4. Do not include backticks or markdown formatting
5. Avoid generic phrases like "update code" or "this commit"
6. Max length of the summary line is 72 characters
7. Use lowercase for the summary
8. No trailing period on the summary
9. Provide bullet points if the diff is non-trivial

Type: ${typeStr}

Git diff:
${diff}

Output only the final commit message.`;
}
