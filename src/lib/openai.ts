import OpenAI from 'openai';
import type { CommitType } from '../types/index.js';
import { generatePrompt } from './prompt.js';
import chalk from 'chalk';

const FALLBACK_MESSAGE = 'chore: update files';

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

export async function generateCommitMessage(diff: string, type: CommitType | null): Promise<string> {
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
      content: 'You are a git commit generator. Rules: 1. Conventional Commits strictly. 2. Concise/Specific. 3. No explanation/markdown. 4. Max 72 chars. 5. Lowercase summary. 6. No trailing period. 7. Use bullet points for non-trivial changes. IMPORTANT: DO NOT USE CODE BLOCKS FOR CODE COMMITS - use bullet points or simple sentences instead.' 
    },
    { 
      role: 'user', 
      content: generatePrompt(cleanedDiff, type) 
    }
  ],
      temperature: 0, 
      max_completion_tokens: 60, 
    });

    const content = response.choices[0]?.message?.content?.trim();
    
    if (!content) {
      return type ? `${type}: update files (fallback)` : FALLBACK_MESSAGE;
    }

    return content.replace(/^(?:```[a-z]*\n?)|(?:```)$/g, '').trim();

  } catch (error: any) {
    console.error('OpenAI API Error:', error.message || error);
    return type ? `${type}: update files (fallback)` : FALLBACK_MESSAGE;
  }
}
