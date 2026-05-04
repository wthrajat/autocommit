# `autocommit` [![npm](https://img.shields.io/npm/v/%40wthrajat%2Fautocommit?logo=npm)](https://www.npmjs.com/package/@wthrajat/autocommit)

Tool that generates and pushes [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/#specification) from staged changes in one go. For free :)

![Demo](./public/assets/autocommit-demo.gif)

## Prerequisites

- One of these API keys:
  - [Gemini](https://aistudio.google.com/app/apikey) (free tier available)
  - [OpenAI](https://platform.openai.com/api-keys)

## Installation

Install globally via `npm`:

```bash
npm i -g @wthrajat/autocommit
```

To verify the installation, check the version:

```bash
autocommit -v
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


### Updating

To update to the latest version, run:

```bash
npm update @wthrajat/autocommit
```

If update fails for whateva reason, try uninstalling and reinstalling:

```bash
npm uninstall -g @wthrajat/autocommit
npm i -g @wthrajat/autocommit@latest
```

## Local Dev

Run it using `pnpm i && pnpm run dev` in the project root. Can also use `pnpm link` to link the package globally and test it in any repo without needing to build every time.

<hr>

# Why I made this and cost analysis

Ignore this section, Gemini free tier is more than enough for this tool. The following analysis is only for OpenAI's pricing.

### Why

I made this because it's just way cheaper for me. I still use Claude and Codex for the heavy lifting, but I never let them commit, I commit myself. I've let claude push commits for me several times and have hit my daily limit much faster. I think this has something to do with the recent bug where Claude was eating tokens like crazy. Anthropic even acknowledged the issue, see their [april report](https://www.anthropic.com/engineering/april-23-postmortem). When Claude is already deep into working on a feature, the conversation context window grows. And since every API request re-sends the entire conversation history, each subsequent call gets more expensive as the context grows so it makes sense to separate out the commit generating part imo.

So I am using this for my day to day work for like ~4 months now and so far so good. It has been a massive micro-productivity boost for me daily; I just stage my changes, run `autocommit`, and move on without burning through my main AI credits and thinking of a nice commit message. One credit top-up lasts so long it's basically a "set it and forget it" situation. To give you an idea, as of now, OpenAI charges just `$0.075` / `1M` tokens for GPT-5-Mini.

And and no commitment issues like my ex :)

### Cost-analysis

I've made over 100+ commits with this so far, burning through about 97k input tokens and just 4k output tokens. Each commit averages 972 tokens in and 42 tokens out. At `GPT-5-Mini` [pricing](https://platform.openai.com/settings/organization/limits) a hundred commits cost me around nine cents total. **So a $5 balance lasts over 5,500 commits**.