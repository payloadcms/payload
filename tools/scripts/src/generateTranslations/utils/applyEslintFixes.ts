import { ESLint } from 'eslint'

export async function applyEslintFixes(text: string, filePath: string): Promise<string> {
  const eslint = new ESLint({ fix: true })
  const results = await eslint.lintText(text, { filePath })
  const result = results[0] || { output: text }
  return result.output || text // Return the fixed content or the original if no fixes were made.
}
