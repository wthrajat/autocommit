export function classifyDiff(files, diff) {
    const isOnlyTests = files.every(f => f.includes('test') || f.includes('spec'));
    if (isOnlyTests)
        return 'test';
    const isOnlyDocs = files.every(f => f.endsWith('.md') || f.includes('docs/'));
    if (isOnlyDocs)
        return 'docs';
    const isOnlyConfig = files.every(f => f.includes('package.json') ||
        f.includes('.env') ||
        f.includes('tsconfig') ||
        f.includes('.eslintrc') ||
        f.includes('.prettierrc'));
    if (isOnlyConfig)
        return 'chore';
    // Check commit diff contents for explicit hints
    const lowerDiff = diff.toLowerCase();
    if (lowerDiff.includes('fix') || lowerDiff.includes('bug') || lowerDiff.includes('error')) {
        return 'fix';
    }
    // If many files are deleted/moved or renamed
    const deletedLines = (diff.match(/^-/gm) || []).length;
    const addedLines = (diff.match(/^\+/gm) || []).length;
    if (deletedLines > 50 && addedLines > 50) {
        return 'refactor';
    }
    // If new files are created, it might be a feat
    const isNewFiles = diff.includes('new file mode');
    if (isNewFiles) {
        return 'feat';
    }
    return null;
}
