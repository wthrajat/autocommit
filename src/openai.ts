import OpenAI from 'openai';
import type { CommitType } from './types.js';
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
    return FALLBACK_MESSAGE;
  }

  const client = new OpenAI({ apiKey });

  // Optimization: Clean and Truncate
  // 10k chars is plenty for a commit message while keeping costs very low
  const cleanedDiff = cleanDiff(diff).substring(0, 10000);
  
  // Use your existing prompt logic, or pass the cleaned diff directly
  const prompt = generatePrompt(cleanedDiff, type);

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-5.4-nano',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert git assistant. Generate a concise, single-line commit message in Conventional Commits format. Do not return markdown, prose, or explanations.' 
        },
        { 
          role: 'user', 
          content: prompt 
        }
      ],
      // 0.0 makes it predictable/deterministic for CLI tools
      temperature: 0, 
      // Prevents spending credits on long, chatty responses
      max_completion_tokens: 60, 
    });

    const content = response.choices[0]?.message?.content?.trim();
    
    if (!content) {
      return type ? `${type}: update files (fallback)` : FALLBACK_MESSAGE;
    }

    // Clean up any accidental markdown backticks
    return content.replace(/^(?:```[a-z]*\n?)|(?:```)$/g, '').trim();

  } catch (error: any) {
    console.error('OpenAI API Error:', error.message || error);
    return type ? `${type}: update files (fallback)` : FALLBACK_MESSAGE;
  }
}
