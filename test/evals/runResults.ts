import type { Dirent } from 'node:fs'

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { EvalResult } from './types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const defaultResultsDir = path.join(__dirname, 'eval-results')

export type StoredRunResult = {
  createdAt: string
  paramsHash: string
  result: { runId: string } & EvalResult
  reusedFromRunId?: string
  version: 1
}

function runDirectoryName(runId: string): string {
  return runId.replaceAll(':', '-')
}

function runDirectoryPath({ resultsDir, runId }: { resultsDir: string; runId: string }): string {
  return path.join(resultsDir, 'runs', runDirectoryName(runId))
}

/** Writes one immutable result for the current eval invocation. */
export function recordRunResult({
  paramsHash,
  result,
  resultsDir = defaultResultsDir,
  reusedFromRunId,
  runId = process.env.EVAL_RUN_ID,
}: {
  paramsHash: string
  result: EvalResult
  resultsDir?: string
  reusedFromRunId?: string
  runId?: string
}): EvalResult {
  if (!runId) {
    return result
  }

  const resultForRun = { ...result, runId }
  const runDir = runDirectoryPath({ resultsDir, runId })
  const entry: StoredRunResult = {
    createdAt: new Date().toISOString(),
    paramsHash,
    result: resultForRun,
    reusedFromRunId,
    version: 1,
  }

  mkdirSync(runDir, { recursive: true })
  writeFileSync(path.join(runDir, `${paramsHash}.json`), JSON.stringify(entry, null, 2), 'utf8')

  return resultForRun
}

/** Marks an eval invocation as finished so it appears in the dashboard. */
export function markRunCompleted({
  resultsDir = defaultResultsDir,
  runId,
}: {
  resultsDir?: string
  runId: string
}): void {
  const runDir = runDirectoryPath({ resultsDir, runId })
  mkdirSync(runDir, { recursive: true })
  writeFileSync(path.join(runDir, 'completed'), '', 'utf8')
}

/** Reads every result from completed eval invocations. */
export function readRunResults({
  resultsDir = defaultResultsDir,
}: { resultsDir?: string } = {}): StoredRunResult[] {
  const root = path.join(resultsDir, 'runs')
  let runDirectories: Dirent[]

  try {
    runDirectories = readdirSync(root, { withFileTypes: true }).filter((entry) =>
      entry.isDirectory(),
    )
  } catch {
    return []
  }

  const results: StoredRunResult[] = []
  for (const directory of runDirectories) {
    const runDir = path.join(root, directory.name)
    if (!existsSync(path.join(runDir, 'completed'))) {
      continue
    }

    let files: string[]
    try {
      files = readdirSync(runDir).filter((file) => file.endsWith('.json'))
    } catch {
      continue
    }

    for (const file of files) {
      try {
        const entry = JSON.parse(readFileSync(path.join(runDir, file), 'utf8')) as StoredRunResult
        if (entry.version === 1 && typeof entry.paramsHash === 'string' && entry.result.runId) {
          results.push(entry)
        }
      } catch {
        // Skip unreadable or corrupt result files.
      }
    }
  }

  return results
}

/** Returns the newest completed result produced from identical parameters. */
export function findReusableResult({
  paramsHash,
  resultsDir = defaultResultsDir,
}: {
  paramsHash: string
  resultsDir?: string
}): StoredRunResult | undefined {
  return readRunResults({ resultsDir })
    .filter((entry) => entry.paramsHash === paramsHash)
    .sort((a, b) => b.result.runId.localeCompare(a.result.runId))[0]
}

export function shouldRerun(): boolean {
  return process.env.EVAL_RERUN === 'true'
}
