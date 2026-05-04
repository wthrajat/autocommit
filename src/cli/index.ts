#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';
import { 
  isGitRepository, 
  hasStagedChanges, 
  getStagedDiff, 
  getChangedFiles, 
  commitChanges,
  getBranchName
} from '../lib/git.js';
import { classifyDiff } from '../lib/classifier.js';
import { generateCommitMessage as generateOpenAI } from '../lib/openai.js';
import { generateCommitMessage as generateGemini } from '../lib/gemini.js';
import { showCommitOptions } from '../utils/ui.js';
import { logger, spinner, openEditor } from '../utils/index.js';
import { getConfig, saveOpenAIKey, saveGeminiKey, setDefaultModel, setMessageStyle, getMessageStyle, ModelType } from '../config/index.js';
import { ActionType } from '../types/index.js';
import chalk from 'chalk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'));
const VERSION = packageJson.version;

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.includes('--version') || args.includes('-v')) {
      console.log(`autocommit version ${VERSION}`);
      process.exit(0);
    }

    const openaiKeyIndex = args.indexOf('--openai-key');
    const geminiKeyIndex = args.indexOf('--gemini-key');
    const modelIndex = args.indexOf('--model');
    const shortIndex = args.indexOf('--short');
    const longIndex = args.indexOf('--long');

    if (openaiKeyIndex !== -1) {
      const apiKey = args[openaiKeyIndex + 1];
      if (!apiKey || apiKey.startsWith('--')) {
        logger.error('Please provide a valid API key after --openai-key');
        process.exit(1);
      }
      await saveOpenAIKey(apiKey);
      logger.success('OpenAI API key saved to ~/.autocommitrc!');
      process.exit(0);
    }

    if (geminiKeyIndex !== -1) {
      const apiKey = args[geminiKeyIndex + 1];
      if (!apiKey || apiKey.startsWith('--')) {
        logger.error('Please provide a valid API key after --gemini-key');
        process.exit(1);
      }
      await saveGeminiKey(apiKey);
      logger.success('Gemini API key saved to ~/.autocommitrc!');
      process.exit(0);
    }

    if (modelIndex !== -1) {
      const model = args[modelIndex + 1] as ModelType;
      if (!model || (model !== 'openai' && model !== 'gemini')) {
        logger.error('Please specify --model with "openai" or "gemini"');
        process.exit(1);
      }
      await setDefaultModel(model);
      logger.success(`Default model set to ${model}!`);
      process.exit(0);
    }

    if (shortIndex !== -1) {
      await setMessageStyle('short');
      logger.success('Message style set to short!');
      process.exit(0);
    }

    if (longIndex !== -1) {
      await setMessageStyle('long');
      logger.success('Message style set to long!');
      process.exit(0);
    }

    const config = await getConfig();
    const messageStyle = getMessageStyle(config || { openaiKey: '', geminiKey: '', model: 'openai', messageStyle: 'short' });
    
    if (!config || (!config.openaiKey && !config.geminiKey)) {
      logger.error('No API key found.');
      logger.info('Please set it by running: autocommit --openai-key "sk-..." or autocommit --gemini-key "..."');
      process.exit(1);
    }
    
    if (config.model === 'gemini' && config.geminiKey) {
      process.env.GEMINI_API_KEY = config.geminiKey;
    } else if (config.openaiKey) {
      process.env.OPENAI_API_KEY = config.openaiKey;
    } else if (config.geminiKey) {
      process.env.GEMINI_API_KEY = config.geminiKey;
      config.model = 'gemini';
    } else {
      logger.error('No API key found for the default model.');
      process.exit(1);
    }

    await isGitRepository();

    const hasChanges = await hasStagedChanges();
    if (!hasChanges) {
      logger.warn('No staged changes found. Did you forget to run `git add`?');
      process.exit(0);
    }

    let message: string = '';
    let shouldCommit: boolean = false;
    let action: ActionType = 'regenerate';

    const diff = await getStagedDiff();
    const files = await getChangedFiles();
    const branchName = await getBranchName();
    const type = classifyDiff(files, diff);

    while (action === 'regenerate') {
      const s = spinner('Analyzing diff and generating commit message...').start();
      try {
        if (config.model === 'gemini') {
          console.log(chalk.blue('Using Gemini model for generation'));
          message = await generateGemini(diff, type, files, branchName, messageStyle);
        }
        else {
          console.log(chalk.blue('Using OpenAI model for generation'));
          message = await generateOpenAI(diff, type, files, branchName, messageStyle);
        }
        s.succeed('Message generated successfully');
      } catch (error: any) {
        s.fail('Failed to generate message');
        logger.error(error.message);
        process.exit(1);
      }

      action = await showCommitOptions(message);

      if (action === 'accept') {
        shouldCommit = true;
      } else if (action === 'edit') {
        try {
          message = await openEditor(message);
          shouldCommit = true;
        } catch (error: any) {
          logger.error(`Failed to open editor: ${error.message}`);
          process.exit(1);
        }
      } else if (action === 'quit') {
        logger.info('Aborted.');
        process.exit(0);
      }
    }

    if (shouldCommit && message) {
      const s = spinner('Committing...').start();
      try {
        await commitChanges(message);
        s.succeed('Committed successfully!');
      } catch (error: any) {
        s.fail('Git commit failed');
        logger.error(error.message);
        process.exit(1);
      }
    }

  } catch (error: any) {
    logger.error(`An unexpected error occurred: ${error.message}`);
    process.exit(1);
  }
}

main();
