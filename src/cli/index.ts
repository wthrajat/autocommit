#!/usr/bin/env node

import 'dotenv/config';
import { 
  isGitRepository, 
  hasStagedChanges, 
  getStagedDiff, 
  getChangedFiles, 
  commitChanges 
} from '../lib/git.js';
import { classifyDiff } from '../lib/classifier.js';
import { generateCommitMessage } from '../lib/openai.js';
import { showCommitOptions } from '../utils/ui.js';
import { logger, spinner, openEditor } from '../utils/index.js';
import { getApiKey, saveApiKey } from '../config/index.js';

async function main() {
  try {
    const args = process.argv.slice(2);
    const setApiKeyIndex = args.indexOf('--set-apikey');

    if (setApiKeyIndex !== -1) {
      const newApiKey = args[setApiKeyIndex + 1];
      if (!newApiKey || newApiKey.startsWith('--')) {
        logger.error('Please provide a valid API key after --set-apikey');
        process.exit(1);
      }
      await saveApiKey(newApiKey);
      logger.success('API key saved successfully to ~/.autocommitrc!');
      process.exit(0);
    }

    const apiKey = await getApiKey();
    
    if (!apiKey) {
      logger.error('OpenAI API key not found.');
      logger.info('Please set it by running: autocommit --set-apikey "sk-your-api-key"');
      process.exit(1);
    }
    
    process.env.OPENAI_API_KEY = apiKey;

    await isGitRepository();

    const hasChanges = await hasStagedChanges();
    if (!hasChanges) {
      logger.warn('No staged changes found. Did you forget to run `git add`?');
      process.exit(0);
    }

    let message = '';
    let shouldCommit = false;
    let action: 'accept' | 'edit' | 'regenerate' | 'quit' = 'regenerate';

    const diff = await getStagedDiff();
    const files = await getChangedFiles();
    const type = classifyDiff(files, diff);

    while (action === 'regenerate') {
      const s = spinner('Analyzing diff and generating commit message...').start();
      try {
        message = await generateCommitMessage(diff, type, files);
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
