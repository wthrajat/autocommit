import type { ModelType, MessageStyle } from '../config/index.js';
import { saveOpenAIKey, saveGeminiKey, setModel, setMessageStyle, setSignedCommit } from '../config/index.js';
import { logger } from '../utils/index.js';

export interface ParsedArgs {
  openaiKey?: string;
  geminiKey?: string;
  model?: ModelType;
  messageStyle?: MessageStyle;
  signedCommit?: boolean;
}

function findFlagIndex(args: string[], flag: string): number {
  return args.indexOf(flag);
}

function getFlagValue(args: string[], flag: string): string | undefined {
  const index = findFlagIndex(args, flag);
  if (index === -1) return undefined;
  return args[index + 1];
}

function hasFlag(args: string[], flag: string): boolean {
  return findFlagIndex(args, flag) !== -1;
}

function validateApiKey(key: string | undefined, flagName: string): string | null {
  if (!key || key.startsWith('--')) {
    logger.error(`Please provide a valid API key after ${flagName}`);
    return null;
  }
  return key;
}

export async function handleFlags(args: string[], VERSION: string): Promise<boolean> {
  if (hasFlag(args, '--version') || hasFlag(args, '-v')) {
    console.log(`autocommit version ${VERSION}`);
    return true;
  }

  if (hasFlag(args, '--help') || hasFlag(args, '-h')) {
    console.log(`
Usage: autocommit [options]

Options:
  -v, --version          Show version
  -h, --help            Show this help message
  --openai-key <key>   Set OpenAI API key
  --gemini-key <key>   Set Gemini API key
  --model <model>      Set default model (openai or gemini)
  --short              Use short message style
  --long               Use long message style
  --sign               Enable GPG signed commits
  --no-sign            Disable GPG signed commits

Without options: Run interactive setup if no config exists, otherwise generate commit message.
    `.trim());
    return true;
  }

  const openaiKey = getFlagValue(args, '--openai-key');
  if (openaiKey) {
    const key = validateApiKey(openaiKey, '--openai-key');
    if (!key) process.exit(1);
    await saveOpenAIKey(key);
    logger.success('OpenAI API key saved to ~/.autocommitrc!');
    return true;
  }

  const geminiKey = getFlagValue(args, '--gemini-key');
  if (geminiKey) {
    const key = validateApiKey(geminiKey, '--gemini-key');
    if (!key) process.exit(1);
    await saveGeminiKey(key);
    logger.success('Gemini API key saved to ~/.autocommitrc!');
    return true;
  }

  const modelValue = getFlagValue(args, '--model');
  if (modelValue) {
    if (modelValue !== 'openai' && modelValue !== 'gemini') {
      logger.error('Please specify --model with "openai" or "gemini"');
      process.exit(1);
    }
    await setModel(modelValue);
    logger.success(`Default model set to ${modelValue}!`);
    return true;
  }

  if (hasFlag(args, '--short')) {
    await setMessageStyle('short');
    logger.success('Message style set to short!');
    return true;
  }

  if (hasFlag(args, '--long')) {
    await setMessageStyle('long');
    logger.success('Message style set to long!');
    return true;
  }

  if (hasFlag(args, '--sign')) {
    await setSignedCommit(true);
    logger.success('Signed commits enabled!');
    return true;
  }

  if (hasFlag(args, '--no-sign')) {
    await setSignedCommit(false);
    logger.success('Signed commits disabled!');
    return true;
  }

  return false;
}