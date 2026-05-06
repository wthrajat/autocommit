import OpenAI from 'openai';
import type { CommitType } from '../types/index.js';
import { generatePrompt, cleanDiff } from './diff.js';
import type { MessageStyle } from '../config/index.js';
import chalk from 'chalk';
import { FALLBACK_MESSAGE, SYSTEM_PROMPT_SHORT, SYSTEM_PROMPT_LONG, MAX_DIFF_LENGTH, MAX_TOKENS_SHORT, MAX_TOKENS_LONG } from './prompts.js';

export async function generateCommitMessage(
  diff: string,
  type: CommitType | null,
  files: string[] = [],
  branchName: string = '',
  messageStyle: MessageStyle = 'short'
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log(chalk.red('✖'), 'OPENAI_API_KEY environment variable is not set');
    process.exit(1);
  }

  if (!diff || diff.trim().length === 0) {
    console.log(chalk.red('✖'), 'No diff found');
    return FALLBACK_MESSAGE;
  }

  const client = new OpenAI({ apiKey, logLevel: 'info' });

  const cleanedDiff = cleanDiff(diff).substring(0, MAX_DIFF_LENGTH);
  const systemPrompt = messageStyle === 'long' ? SYSTEM_PROMPT_LONG : SYSTEM_PROMPT_SHORT;
  const maxTokens = messageStyle === 'long' ? MAX_TOKENS_LONG : MAX_TOKENS_SHORT;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-5.4-nano',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: generatePrompt(cleanedDiff, type, files, branchName) }
      ],
      temperature: 0, 
      max_completion_tokens: maxTokens, 
    });

    const content = response.choices[0]?.message?.content?.trim();
    
    if (!content) {
      return type ? `${type}(scope): update files (fallback)` : FALLBACK_MESSAGE;
    }

    return content;
  } catch (error: unknown) {
    console.error('OpenAI API Error:', (error as Error).message);
    return type ? `${type}(scope): update files (fallback)` : FALLBACK_MESSAGE;
  }
}
