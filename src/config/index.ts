import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

const CONFIG_FILE = path.join(os.homedir(), '.autocommitrc');

export async function getApiKey(): Promise<string | null> {
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }
  
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(data);
    return config.apiKey || null;
  } catch (error) {
    console.log(error)
    return null;
  }
}

export async function saveApiKey(apiKey: string): Promise<void> {
  const config = { apiKey };
  
  // mode: 0o600 ensures that only the file owner can read and write the file
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), {
    encoding: 'utf-8',
    mode: 0o600 
  });
}
