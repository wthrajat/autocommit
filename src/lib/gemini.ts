import { GoogleGenAI } from '@google/genai';
import type { CommitType } from '../types/index.js';
import { generatePrompt, cleanDiff } from '../utils/index.js';
import chalk from 'chalk';

const FALLBACK_MESSAGE = 'chore(scope): update files';

export async function generateCommitMessage(
  diff: string,
  type: CommitType | null,
  files: string[] = [],
  branchName: string = ''
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log(chalk.red('✖'), 'GEMINI_API_KEY environment variable is not set');
    process.exit(1);
  }

  if (!diff || diff.trim().length === 0) {
    console.log(chalk.red('✖'), 'No diff found');
    return FALLBACK_MESSAGE;
  }

  const ai = new GoogleGenAI({ apiKey });

  const cleanedDiff = cleanDiff(diff).substring(0, 10000);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: generatePrompt(cleanedDiff, type, files, branchName),
      config: {
        systemInstruction:
          'You are a git commit generator. Follow Conventional Commits strictly.\n\nRules:\n1. Output EXACTLY ONE summary line first.\n2. ALWAYS include scope like feat(auth): or fix(core):.\n3. Summary max 72 chars, lowercase, no trailing period.\n4. For non-trivial changes, add ONE blank line after summary, then bullet points.\n5. DO NOT use markdown code blocks.\n6. NEVER output multiple separate commits, combine them into one.',
        temperature: 0,
        maxOutputTokens: 60,
      },
    });

    const content = response.text?.trim();

    if (!content) {
      return type ? `${type}(scope): update files (fallback)` : FALLBACK_MESSAGE;
    }

    return content;
  } catch (error: any) {
    console.error('Gemini API Error:', error.message || error);
    return type ? `${type}(scope): update files (fallback)` : FALLBACK_MESSAGE;
  }
}