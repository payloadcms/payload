/* eslint-disable no-console */
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { Project } from 'ts-morph'

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

  const { failed, results } = await runTransforms({
    options: { dry: flags.dry },
    project,
    transforms: selected,
  })

  if (flags.print) {
    for (const file of project.getSourceFiles()) {
      console.log(`// ${file.getFilePath()}`)
      console.log(file.getFullText())
    }
  } else if (!flags.dry) {
    await project.save()
  }

  printSummary(results)

  if (failed) {
    process.exitCode = 1
  }
}

function selectTransforms(registry: Transform[], name: string | undefined): Transform[] {
  if (!name) {
    return registry
  }
  return registry.filter((t) => t.name === name)
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
  const tsconfigPath = resolve(path, 'tsconfig.json')
  if (existsSync(tsconfigPath)) {
    return new Project({ tsConfigFilePath: tsconfigPath })
  }
  const project = new Project()
  project.addSourceFilesAtPaths([
    `${path}/**/*.{ts,tsx,js,jsx}`,
    `!${path}/**/node_modules/**`,
    `!${path}/**/dist/**`,
    `!${path}/**/.next/**`,
    `!${path}/**/build/**`,
  ])
  return project
}

function printSummary(
  results: Array<{ error?: Error; filesChanged: string[]; name: string; notes?: string[] }>,
): void {
  console.log('')
  console.log('Codemod summary:')
  for (const r of results) {
    if (r.error) {
      console.log(`  ✗ ${r.name} — ${r.error.message}`)
      continue
    }
    console.log(`  ✓ ${r.name} — ${r.filesChanged.length} file(s) changed`)
    for (const note of r.notes ?? []) {
      console.log(`      note: ${note}`)
    }
  }
}
