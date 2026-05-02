#!/usr/bin/env node

import 'dotenv/config';
import { 
  isGitRepository, 
  hasStagedChanges, 
  getStagedDiff, 
  getChangedFiles, 
  commitChanges 
} from '../src/git.js';
import { classifyDiff } from '../src/classifier.js';
import { generateCommitMessage } from '../src/openai.js';
import { showCommitOptions } from '../src/ui.js';
import { logger, spinner, openEditor } from '../src/utils.js';

async function main() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      logger.error('OPENAI_API_KEY environment variable is not set.');
      logger.info('Please set it using: export OPENAI_API_KEY="your-key-here"');
      process.exit(1);
    }

    const isGit = await isGitRepository();
    if (!isGit) {
      logger.error('Not a git repository (or any of the parent directories).');
      process.exit(1);
    }

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
        message = await generateCommitMessage(diff, type);
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
