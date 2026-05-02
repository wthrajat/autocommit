export function generatePrompt(diff, type) {
    const typeConstraint = type ? `Use type: ${type}.` : 'Determine the best conventional commit type.';
    return `${typeConstraint}\n\nGit diff:\n${diff}`;
}
