import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { IndentationText, Project, QuoteKind } from 'ts-morph'

const manipulationSettings = {
  indentationText: IndentationText.TwoSpaces,
  quoteKind: QuoteKind.Single,
  useTrailingCommas: true,
}

/**
 * Load a ts-morph Project rooted at `path`, using its tsconfig.json if present.
 *
 * Falls back to globbing when the tsconfig resolves no source files (e.g. a
 * solution-style config with only `references`), so transforms never silently
 * run against an empty project.
 */
export function loadProject(path: string): Project {
  const tsconfigPath = resolve(path, 'tsconfig.json')

  if (existsSync(tsconfigPath)) {
    const project = new Project({ manipulationSettings, tsConfigFilePath: tsconfigPath })

    if (project.getSourceFiles().length > 0) {
      return project
    }

    console.warn(
      `Warning: ${tsconfigPath} resolved no source files. Falling back to globbing ${path}.`,
    )
  }

  return loadProjectFromGlob(path)
}

function loadProjectFromGlob(path: string): Project {
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
