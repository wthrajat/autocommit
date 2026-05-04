import OpenAI from 'openai';
import type { CommitType } from '../types/index.js';
import { generatePrompt, cleanDiff } from '../utils/index.js';
import type { MessageStyle } from '../config/index.js';
import chalk from 'chalk';

const FALLBACK_MESSAGE = 'chore(scope): update files';

const SYSTEM_PROMPT_SHORT = `You are a git commit generator. Follow Conventional Commits strictly.

Rules:
1. Output EXACTLY ONE summary line only.
2. ALWAYS include scope like feat(auth): or fix(core):.
3. Summary max 72 chars, lowercase, no trailing period.
4. NEVER output multiple separate commits, combine them into one.`;

const SYSTEM_PROMPT_LONG = `You are a git commit generator. Follow Conventional Commits strictly.

Rules:
1. Output EXACTLY ONE summary line first.
2. ALWAYS include scope like feat(auth): or fix(core):.
3. Summary max 72 chars, lowercase, no trailing period.
4. Add ONE blank line after summary, then bullet points with "-" for each change.
5. DO NOT use markdown code blocks.
6. NEVER output multiple separate commits, combine them into one.`;

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

  const cleanedDiff = cleanDiff(diff).substring(0, 10000);
  const systemPrompt = messageStyle === 'long' ? SYSTEM_PROMPT_LONG : SYSTEM_PROMPT_SHORT;
  const maxTokens = messageStyle === 'long' ? 150 : 60;

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
  } catch (error: any) {
    console.error('OpenAI API Error:', error.message || error);
    return type ? `${type}(scope): update files (fallback)` : FALLBACK_MESSAGE;
  }
}
