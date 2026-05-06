import type { ModelType, MessageStyle } from '../config/index.js';
import type { CommitType } from '../types/index.js';
import { generateCommitMessage as generateOpenAI } from './openai.js';
import { generateCommitMessage as generateGemini } from './gemini.js';

export interface GenerateOptions {
  diff: string;
  type: CommitType | null;
  files: string[];
  branchName: string;
  messageStyle: MessageStyle;
}

export async function generateCommitMessage(
  model: ModelType,
  options: GenerateOptions
): Promise<string> {
  if (model === 'gemini') {
    return generateGemini(options.diff, options.type, options.files, options.branchName, options.messageStyle);
  }
  return generateOpenAI(options.diff, options.type, options.files, options.branchName, options.messageStyle);
}