import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

const CONFIG_FILE = path.join(os.homedir(), '.autocommitrc');

export type ModelType = 'openai' | 'gemini';

export interface Config {
  openaiKey: string;
  geminiKey: string;
  model: ModelType;
}

export async function getConfig(): Promise<Config | null> {
  if (process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY) {
    const config = await loadConfigFile();
    if (process.env.GEMINI_API_KEY) {
      config.geminiKey = process.env.GEMINI_API_KEY;
      config.model = 'gemini';
    } else if (process.env.OPENAI_API_KEY) {
      config.openaiKey = process.env.OPENAI_API_KEY;
      config.model = 'openai';
    }
    return config;
  }
  
  const envModel = process.env.AUTOCOMMIT_MODEL as ModelType;
  const config = await loadConfigFile();
  
  if (envModel && (envModel === 'gemini' || envModel === 'openai')) {
    config.model = envModel;
  }
  
  return config;
}

async function loadConfigFile(): Promise<Config> {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data) as Config;
  } catch {
    return { openaiKey: '', geminiKey: '', model: 'openai' };
  }
}

export async function saveOpenAIKey(apiKey: string): Promise<void> {
  const config = await loadConfigFile();
  config.openaiKey = apiKey;
  if (!config.model) config.model = 'openai';
  
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), {
    encoding: 'utf-8',
    mode: 0o600 
  });
}

export async function saveGeminiKey(apiKey: string): Promise<void> {
  const config = await loadConfigFile();
  config.geminiKey = apiKey;
  if (!config.model) config.model = 'gemini';
  
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), {
    encoding: 'utf-8',
    mode: 0o600 
  });
}

export async function setDefaultModel(model: ModelType): Promise<void> {
  const config = await loadConfigFile();
  config.model = model;
  
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), {
    encoding: 'utf-8',
    mode: 0o600 
  });
}