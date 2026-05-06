/* eslint-disable no-console */
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { IndentationText, Project } from 'ts-morph'

import type { TransformRunResult } from './runner.js'
import type { Transform } from './types.js'

import { parseFlags } from './cli.parseFlags.js'
import { transforms as registry } from './registry.js'
import { runTransforms } from './runner.js'

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  const flags = parseFlags(argv)

  if (flags.list) {
    printList()
    return
  }

  const selected = selectTransforms(registry, flags.transform)
  if (selected.length === 0) {
    console.error(`No transforms matched${flags.transform ? ` "${flags.transform}"` : ''}.`)
    process.exitCode = 1
    return
  }

  const project = loadProject(resolve(flags.path))
  const snapshot = snapshotProject(project)

  const { failed, results } = await runTransforms({
    project,
    transforms: selected,
  })

  const changed = project
    .getSourceFiles()
    .filter((file) => snapshot.get(file.getFilePath()) !== file.getFullText())

  if (flags.print) {
    if (changed.length === 0) {
      console.log('(no files changed)')
    } else {
      for (const file of changed) {
        console.log(`// ${file.getFilePath()}`)
        console.log(file.getFullText())
      }
    }
  } else if (!flags.dry) {
    await Promise.all(changed.map((file) => file.save()))
  }

  printSummary(results)

  if (failed) {
    process.exitCode = 1
  }
}

function selectTransforms(available: Transform[], name: string | undefined): Transform[] {
  if (!name) {
    return available
  }
  return available.filter((t) => t.name === name)
}

function printList(): void {
  if (registry.length === 0) {
    console.log('No transforms registered.')
    return
  }
  for (const t of registry) {
    console.log(`${t.name}  ${t.description}`)
  }
}

function loadProject(path: string): Project {
  const manipulationSettings = { indentationText: IndentationText.TwoSpaces }
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

function snapshotProject(project: Project): Map<string, string> {
  return new Map(project.getSourceFiles().map((file) => [file.getFilePath(), file.getFullText()]))
}

function printSummary(results: TransformRunResult[]): void {
  console.log('')
  console.log('Codemod summary:')
  for (const r of results) {
    if (r.error) {
      console.log(`  [FAIL] ${r.name} — ${r.error.message}`)
      continue
    }
    console.log(`  [ok] ${r.name} — ${r.filesChanged.length} file(s) changed`)
    for (const note of r.notes ?? []) {
      console.log(`      note: ${note}`)
    }
  }
}
