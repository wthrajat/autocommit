import prompts from 'prompts';
import chalk from 'chalk';
import type { Config, MessageStyle } from '../config/index.js';
import { saveOpenAIKey, saveGeminiKey, setMessageStyle, setSignedCommit } from '../config/index.js';
import { logger } from '../utils/index.js';

export async function runInteractiveSetup(): Promise<void> {
  console.log(chalk.yellow('Welcome to autocommit! Lets set up your configuration.\n'));

  const answers = await prompts([
    {
      type: 'select',
      name: 'model',
      message: 'Which AI model would you like to use?',
      choices: [
        { title: 'OpenAI', value: 'openai' },
        { title: 'Google Gemini', value: 'gemini' },
      ],
      initial: 0,
    },
    {
      type: 'password',
      name: 'apiKey',
      message: (prev: string) => `Enter your ${prev === 'openai' ? 'OpenAI' : 'Gemini'} API key:`,
      validate: (value: string) => (value.length > 0 ? true : 'API key is required'),
    },
    {
      type: 'select',
      name: 'messageStyle',
      message: 'What commit message style do you prefer?',
      choices: [
        { title: 'Short (one-line summary)', value: 'short' },
        { title: 'Long (with description)', value: 'long' },
      ],
      initial: 0,
    },
    {
      type: 'toggle',
      name: 'signedCommit',
      message: 'Sign commits with GPG?',
      initial: false,
      active: 'yes',
      inactive: 'no',
    },
  ]);

  const model = answers.model as 'openai' | 'gemini';
  const apiKey = answers.apiKey as string;
  const messageStyle = answers.messageStyle as MessageStyle;
  const signedCommit = answers.signedCommit as boolean;

  if (model === 'openai') {
    await saveOpenAIKey(apiKey);
  } else {
    await saveGeminiKey(apiKey);
  }

  await setMessageStyle(messageStyle);
  await setSignedCommit(signedCommit);

  printSetupSuccess();
}

function printSetupSuccess(): void {
  logger.success('\nConfiguration saved to ~/.autocommitrc!');
  console.log(chalk.gray('You can change these settings anytime with:'));
  console.log(chalk.gray('  autocommit --openai-key "key"'));
  console.log(chalk.gray('  autocommit --gemini-key "key"'));
  console.log(chalk.gray('  autocommit --model openai|gemini'));
  console.log(chalk.gray('  autocommit --short|--long\n'));
}

export function setupApiKeyFromEnv(config: Config): void {
  if (config.model === 'gemini' && config.geminiKey) {
    process.env.GEMINI_API_KEY = config.geminiKey;
  } else if (config.openaiKey) {
    process.env.OPENAI_API_KEY = config.openaiKey;
  } else if (config.geminiKey) {
    process.env.GEMINI_API_KEY = config.geminiKey;
  }
}