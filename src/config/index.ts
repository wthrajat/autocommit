import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

const CONFIG_FILE = path.join(os.homedir(), '.autocommitrc');

export type ModelType = 'openai' | 'gemini';
export type MessageStyle = 'short' | 'long';

export interface Config {
  openaiKey: string;
  geminiKey: string;
  model: ModelType;
  messageStyle: MessageStyle;
  signedCommit: boolean;
}

const DEFAULT_CONFIG: Config = {
  openaiKey: '',
  geminiKey: '',
  model: 'openai',
  messageStyle: 'short',
  signedCommit: false,
};

async function loadConfigFile(): Promise<Config> {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

async function saveConfigFile(config: Config): Promise<void> {
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), {
    encoding: 'utf-8',
    mode: 0o600,
  });
}

async function updateConfig(updater: (config: Config) => Config): Promise<void> {
  const config = await loadConfigFile();
  const updated = updater(config);
  await saveConfigFile(updated);
}

export async function configFileExists(): Promise<boolean> {
  try {
    await fs.access(CONFIG_FILE);
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(data) as Config;
    return !!(config.openaiKey || config.geminiKey);
  } catch {
    return false;
  }
}

export async function getConfig(): Promise<Config | null> {
  const config = await loadConfigFile();

  if (process.env.GEMINI_API_KEY) {
    config.geminiKey = process.env.GEMINI_API_KEY;
    config.model = 'gemini';
  } else if (process.env.OPENAI_API_KEY) {
    config.openaiKey = process.env.OPENAI_API_KEY;
    config.model = 'openai';
  }

  if (process.env.AUTOCOMMIT_MODEL === 'gemini' || process.env.AUTOCOMMIT_MODEL === 'openai') {
    config.model = process.env.AUTOCOMMIT_MODEL;
  }

  if (process.env.AUTOCOMMIT_MESSAGE_STYLE === 'short' || process.env.AUTOCOMMIT_MESSAGE_STYLE === 'long') {
    config.messageStyle = process.env.AUTOCOMMIT_MESSAGE_STYLE;
  }

  return config;
}

export async function saveApiKey(apiKey: string, model: ModelType): Promise<void> {
  await updateConfig((config) => {
    if (model === 'openai') {
      config.openaiKey = apiKey;
    } else {
      config.geminiKey = apiKey;
    }
    config.model = model;
    return config;
  });
}

export async function setModel(model: ModelType): Promise<void> {
  await updateConfig((config) => ({ ...config, model }));
}

export async function setMessageStyle(style: MessageStyle): Promise<void> {
  await updateConfig((config) => ({ ...config, messageStyle: style }));
}

export async function setSignedCommit(signed: boolean): Promise<void> {
  await updateConfig((config) => ({ ...config, signedCommit: signed }));
}

export function getMessageStyle(config: Config): MessageStyle {
  return process.env.AUTOCOMMIT_MESSAGE_STYLE === 'short' || process.env.AUTOCOMMIT_MESSAGE_STYLE === 'long'
    ? process.env.AUTOCOMMIT_MESSAGE_STYLE
    : config.messageStyle || 'short';
}

export function getSignedCommit(config: Config): boolean {
  return config.signedCommit ?? false;
}

export const saveOpenAIKey = (apiKey: string) => saveApiKey(apiKey, 'openai');
export const saveGeminiKey = (apiKey: string) => saveApiKey(apiKey, 'gemini');