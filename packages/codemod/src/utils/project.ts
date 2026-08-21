import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { IndentationText, Project, QuoteKind } from 'ts-morph'

/** Load a ts-morph Project rooted at `path`, using its tsconfig.json if present. */
export function loadProject(path: string): Project {
  const manipulationSettings = {
    indentationText: IndentationText.TwoSpaces,
    quoteKind: QuoteKind.Single,
    useTrailingCommas: true,
  }
  const tsconfigPath = resolve(path, 'tsconfig.json')
  if (existsSync(tsconfigPath)) {
    return new Project({ manipulationSettings, tsConfigFilePath: tsconfigPath })
  }
  const project = new Project({ manipulationSettings })
  project.addSourceFilesAtPaths([
    `${path}/**/*.{ts,tsx,js,jsx}`,
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/.next/**',
    '!**/build/**',
  ])
  return project
}
