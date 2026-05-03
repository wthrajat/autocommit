# autocommit

A lightweight CLI tool that generates [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#specification) from staged changes and executes the commit in one go.

## Why

It's just way cheaper for me. I still use Claude and Codex for the heavy lifting, but I never let them touch my commits, I commit myself. I tried using claude for generating commits once and hit my daily limit much faster that day. I think this has something to do with the recent bug where Claude was eating tokens like crazy. Anthropic even acknowledged the issue, see this [April postmortem](https://www.anthropic.com/engineering/april-23-postmortem) they published.

This tool uses tiny models and prompt caching to make every commit cost basically nothing. It’s been a massive micro-productivity boost for me daily; I just stage my changes, run `autocommit`, and move on without burning through my main AI credits. One credit top-up lasts so long it's basically a "set it and forget it" situation. To give you an idea, as of now, OpenAI charges just $0.075 / 1M tokens for GPT-5-Mini.

And and no commitment issues like my ex ;)

## How

- Analyzes `git diff --cached` using GPT-5-Mini.
- Uses heuristics to classify the type of changes (feat, fix, docs, etc.).
- Review, edit, or regenerate messages instantly.
- Commits the changes on its own.

## Prerequisites

- [Node.js](https://nodejs.org/en/download)
- [An OpenAI API Key](https://platform.openai.com/api-keys)

## Installation

Install globally via `npm`:

```bash
npm i -g @wthrajat/autocommit
```

### Configuration

You need an OpenAI API key to use this tool. 

Run the following command to securely save your API key in your home directory (`~/.autocommitrc`):

```bash
autocommit --set-apikey "sk-your-api-key"
```

## Local Development

If you want to run this locally (you can use `npm` as well ofc)

1. Install dependencies:
   ```bash
   pnpm i
   ```

2. Build the tool:
   ```bash
   pnpm run build
   ```

3. Make the tool accessible globally:
   ```bash
   pnpm link
   ```

## Usage

1. Do code changes in any repo you're working on and stage them:
   ```bash
   git add <files>
   ```

2. Run the tool (make sure it's installed globally or you have linked it using `pnpm link`):
   ```bash
   autocommit
   ```

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
