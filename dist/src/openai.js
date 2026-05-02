import OpenAI from 'openai';
import { generatePrompt } from './prompt.js';
// Fallback message if OpenAI fails
const FALLBACK_MESSAGE = 'chore: update files';
export async function generateCommitMessage(diff, type) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    const client = new OpenAI({ apiKey });
    // Truncate diff if it's too large to save tokens and avoid limits
    // A rough approximation: 1 token ~= 4 chars. So 12000 chars is ~3000 tokens.
    const MAX_DIFF_LENGTH = 12000;
    let processedDiff = diff;
    if (diff.length > MAX_DIFF_LENGTH) {
        processedDiff = diff.substring(0, MAX_DIFF_LENGTH) + '\n...[diff truncated for length]';
    }
    const prompt = generatePrompt(processedDiff, type);
    try {
        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'user', content: prompt }
            ],
            temperature: 0.3, // low temp for more deterministic outputs
        });
        const content = response.choices[0]?.message?.content?.trim();
        if (!content) {
            return type ? `${type}: update files (fallback)` : FALLBACK_MESSAGE;
        }
        // Strip markdown formatting if the model accidentally included it
        let cleanContent = content;
        if (cleanContent.startsWith('```') && cleanContent.endsWith('```')) {
            cleanContent = cleanContent.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');
        }
        return cleanContent.trim();
    }
    catch (error) {
        // If OpenAI API fails, return a fallback message rather than crashing
        return type ? `${type}: update files (fallback)` : FALLBACK_MESSAGE;
    }
}
