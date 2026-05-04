# `autocommit` [![npm](https://img.shields.io/npm/v/%40wthrajat%2Fautocommit?logo=npm)](https://www.npmjs.com/package/@wthrajat/autocommit) ![GPT-5-Mini](https://img.shields.io/badge/GPT--5--Mini-412991?logo=openai&logoColor=white) ![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-federation.svg?logo=git&logoColor=white)

Tool that generates and pushes [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/#specification) from staged changes in one go.

![Demo](autocommit-demo.gif)

## Prerequisites

- [Node.js](https://nodejs.org/en/download)
- An [OpenAI API Key](https://platform.openai.com/api-keys)

## Installation

Install globally via `npm`:

```bash
npm i -g @wthrajat/autocommit
```

To verify the installation, check the version:

```bash
autocommit -v
```

### Updating

To update to the latest version, run:

```bash
npm i @wthrajat/autocommit@latest
```

Or to latest within semver range:

```bash
npm update @wthrajat/autocommit
```

### Configuration

Run the following command to securely save your API key in your home directory (`~/.autocommitrc`):

```bash
autocommit --set-apikey "sk-your-api-key"
```

## Usage

1. Do code changes in any repo you're working on and stage them:
   ```bash
   git add <files>
   ```

2. Run `autocommit` in the terminal:
   ```bash
   autocommit
   ```

3. Choose an option:
   - **Accept and commit**: Commits right away.
   - **Edit message**: Opens a text editor to adjust the message before committing.
   - **Regenerate**: Asks OpenAI for a new attempt.
   - **Quit**: Cancels the operation.

## Example


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
4. See [usage](#usage) section

## How

- Analyzes `git diff --cached` using GPT-5-Mini (one of the most cost-effective models) to generate a commit message.
- Uses heuristics to classify the type of changes (feat, fix, docs, etc.).
- Automatically extracts Jira/Linear ticket IDs (e.g., `ENG-123`) from your branch name and appends them to the commit message.
- Review, edit, or regenerate messages instantly.
- Commits the changes on its own.

## Why

It's just way cheaper for me. I still use Claude and Codex for the heavy lifting, but I never let them commit, I commit myself. I've let claude push commits for me several times and have hit my daily limit much faster. I think this has something to do with the recent bug where Claude was eating tokens like crazy. Anthropic even acknowledged the issue, see their [april report](https://www.anthropic.com/engineering/april-23-postmortem). When Claude is already deep into working on a feature, the conversation context window grows. And since every API request re-sends the entire conversation history, each subsequent call gets more expensive as the context grows so it makes sense to separate out the commit generating part imo.

So I am using this for my day to day work for like ~4 months now and so far so good. It has been a massive micro-productivity boost for me daily; I just stage my changes, run `autocommit`, and move on without burning through my main AI credits and thinking of a nice commit message. One credit top-up lasts so long it's basically a "set it and forget it" situation. To give you an idea, as of now, OpenAI charges just `$0.075` / `1M` tokens for GPT-5-Mini.

And and no commitment issues like my ex :)
