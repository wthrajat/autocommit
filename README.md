# autocommit

A CLI tool that uses OpenAI to automatically generate high-quality, Conventional Commits-compliant commit messages from your staged git changes.

## Features

- **Automated commit generation**: Analyzes `git diff --cached` using OpenAI.
- **Conventional Commits**: Strict adherence to the standard (feat, fix, docs, etc.).
- **Heuristics classifier**: Smart categorization based on the files you've changed.
- **Fast and interactive**: Review, edit, or regenerate messages instantly.

## Prerequisites

- Node.js >= 18
- An OpenAI API Key

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Build the tool:
   ```bash
   pnpm run build
   ```

3. Set up your OpenAI API Key. In your terminal or `.bashrc`/`.zshrc`, add:
   ```bash
   export OPENAI_API_KEY="sk-your-api-key"
   ```

4. Make the tool accessible globally (optional):
   ```bash
   npm link
   ```
   Or use it directly via your package manager.

## Usage

1. Stage your changes:
   ```bash
   git add <files>
   ```

2. Run the tool:
   ```bash
   autocommit
   ```
   *(If not linked, run `pnpm run start` or `./dist/index.js` in the project root)*

3. Choose an option:
   - **Accept and commit**: Commits right away.
   - **Edit message**: Opens `$EDITOR` to adjust the message before committing.
   - **Regenerate**: Asks OpenAI for a new attempt.
   - **Quit**: Cancels the operation.

## Example

```
$ git add src/git.ts
$ autocommit

ℹ Analyzing diff and generating commit message...
✔ Message generated successfully

Generated commit message:
--------------------------------------------------
feat(git): add function to check staged changes

- Implement hasStagedChanges using execa
- Return boolean based on git exit code
--------------------------------------------------

? What would you like to do? › - Use arrow-keys. Return to submit.
❯   Accept and commit
    Edit message
    Regenerate
    Quit
```

## License

ISC
