import { PROJECT_ROOT } from '@tools/constants'
import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'

/**
 * Writes `text` to `filePath`, applies oxlint's auto-fixes and returns the fixed content.
 * oxlint can't lint text in memory, so the file has to exist on disk.
 */
export function applyOxlintFixes(text: string, filePath: string): string {
  fs.writeFileSync(filePath, text, 'utf8')

  try {
    execFileSync(path.join(PROJECT_ROOT, 'node_modules/.bin/oxlint'), ['--fix', filePath], {
      cwd: PROJECT_ROOT,
      stdio: 'ignore',
    })
  } catch {
    // oxlint exits non-zero if errors remain after fixing. The fixes are still written.
  }

  return fs.readFileSync(filePath, 'utf8')
}
