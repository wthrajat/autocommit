#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';
import chalk from 'chalk';

import { isGitRepository, hasStagedChanges, getStagedDiff, getChangedFiles, commitChanges, getBranchName } from '../lib/git.js';
import { classifyDiff } from '../lib/classifier.js';
import { generateCommitMessage } from '../lib/generator.js';
import { showCommitOptions } from '../utils/ui.js';
import { logger, spinner, openEditor } from '../utils/index.js';
import { getConfig, getSignedCommit, configFileExists } from '../config/index.js';
import { handleFlags } from './flags.js';
import { runInteractiveSetup, setupApiKeyFromEnv } from './setup.js';
import type { ActionType } from '../types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VERSION = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8')).version;

async function validateGitState(): Promise<void> {
  await isGitRepository();
  const hasChanges = await hasStagedChanges();
  if (!hasChanges) {
    logger.warn('No staged changes found. Did you forget to run `git add`?');
    process.exit(0);
  }
}

async function generateMessage(config: { model: string }): Promise<string> {
  const [diff, files, branchName] = await Promise.all([
    getStagedDiff(),
    getChangedFiles(),
    getBranchName(),
  ]);

  const type = classifyDiff(files, diff);

  const s = spinner('Analyzing diff and generating commit message...').start();
  try {
    const { model, messageStyle } = config as unknown as { model: 'openai' | 'gemini'; messageStyle: 'short' | 'long' };
    console.log(chalk.blue(`Using ${model === 'gemini' ? 'Gemini' : 'OpenAI'} for generation`));

    const message = await generateCommitMessage(model, { diff, type, files, branchName, messageStyle });
    s.succeed('Commit message generated!');
    return message;
  } catch (error: unknown) {
    s.fail('Failed to generate message');
    logger.error((error as Error).message);
    process.exit(1);
  }
}

async function getUserAction(message: string): Promise<{ action: ActionType; shouldCommit: boolean; finalMessage: string }> {
  let action: ActionType = 'regenerate';
  let finalMessage = message;
  let shouldCommit = false;

  while (action === 'regenerate') {
    action = await showCommitOptions(finalMessage);

    if (action === 'accept') {
      shouldCommit = true;
    } else if (action === 'edit') {
      try {
        finalMessage = await openEditor(finalMessage);
        shouldCommit = true;
      } catch (error: unknown) {
        logger.error(`Failed to open editor: ${(error as Error).message}`);
        process.exit(1);
      }
    } else if (action === 'quit') {
      logger.info('Aborted.');
      process.exit(0);
    }
  }

  return { action, shouldCommit, finalMessage };
}

async function commit(message: string, signed: boolean): Promise<void> {
  const s = spinner('Committing...').start();
  try {
    await commitChanges(message, signed);
    s.succeed('Committed successfully!');
  } catch (error: unknown) {
    s.fail('Git commit failed');
    logger.error((error as Error).message);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  try {
    const args = process.argv.slice(2);
    const shouldExit = await handleFlags(args, VERSION);
    if (shouldExit) {
      process.exit(0);
    }

    const hasConfig = await configFileExists();
    if (!hasConfig) {
      await runInteractiveSetup();
    }

    const config = await getConfig();
    if (!config) {
      logger.error('Failed to load configuration.');
      process.exit(1);
    }

    setupApiKeyFromEnv(config);

    await validateGitState();

    const message = await generateMessage(config);

    const { shouldCommit, finalMessage } = await getUserAction(message);

    if (shouldCommit && finalMessage) {
      await commit(finalMessage, getSignedCommit(config));
    }
  } catch (error: unknown) {
    logger.error(`An unexpected error occurred: ${(error as Error).message}`);
    process.exit(1);
  }
}

main();