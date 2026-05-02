import prompts from 'prompts';
import chalk from 'chalk';

type Action = 'accept' | 'edit' | 'regenerate' | 'quit';

export async function showCommitOptions(message: string): Promise<Action> {
  console.log('\n' + chalk.bold('Generated commit message:'));
  console.log(chalk.cyan('--------------------------------------------------'));
  console.log(message);
  console.log(chalk.cyan('--------------------------------------------------') + '\n');

  const response = await prompts({
    type: 'select',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      { title: 'Accept and commit', value: 'accept' },
      { title: 'Edit message', value: 'edit' },
      { title: 'Regenerate', value: 'regenerate' },
      { title: 'Quit', value: 'quit' },
    ],
    initial: 0,
  });

  // If user presses Ctrl+C, response.action will be undefined
  return response.action || 'quit';
}
