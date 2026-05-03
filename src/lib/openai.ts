import OpenAI from 'openai';
import type { CommitType } from '../types/index.js';
import { generatePrompt } from './prompt.js';
import chalk from 'chalk';

const FALLBACK_MESSAGE = 'chore(scope): update files';

/**
 * Clean up the git diff by removing low-signal metadata lines
 * to save on input tokens.
 */
function cleanDiff(diff: string): string {
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

export async function generateCommitMessage(diff: string, type: CommitType | null, files: string[] = []): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log(chalk.red('✖'), 'OPENAI_API_KEY environment variable is not set');
    process.exit(1);
  }

  // Pre-check if diff is empty before calling API
  if (!diff || diff.trim().length === 0) {
    console.log(chalk.red('✖'), 'No diff found');
    return FALLBACK_MESSAGE;
  }

  const client = new OpenAI({ apiKey, logLevel: 'info' });

  // 10k chars is plenty for a commit message while keeping costs very low
  const cleanedDiff = cleanDiff(diff).substring(0, 10000);

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-5.4-nano',
      messages: [
    { 
      role: 'system', 
      content: 'You are a git commit generator. Follow Conventional Commits strictly.\n\nRules:\n1. Output EXACTLY ONE summary line first.\n2. ALWAYS include scope like feat(auth): or fix(core):.\n3. Summary max 72 chars, lowercase, no trailing period.\n4. For non-trivial changes, add ONE blank line after summary, then bullet points.\n5. DO NOT use markdown code blocks.\n6. NEVER output multiple separate commits, combine them into one.' 
    },
    { 
      role: 'user', 
      content: generatePrompt(cleanedDiff, type, files) 
    }
  ],
      temperature: 0, 
      max_completion_tokens: 60, 
    });

    const content = response.choices[0]?.message?.content?.trim();
    
    if (!content) {
return type ? `${type}(scope): update files (fallback)` : FALLBACK_MESSAGE;
    }

    return content;
  } catch (error: any) {
    console.error('OpenAI API Error:', error.message || error);
    return type ? `${type}(scope): update files (fallback)` : FALLBACK_MESSAGE;
  }
}
