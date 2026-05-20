import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

import type { RunnerKind, SkillInstallMode } from './runner/types.js'
import type { Variant } from './variant.js'

import { getVariant } from './variant.js'

type CacheEntry = {
  result: {
    assertionErrors?: string[]
    category: string
    changeDescription?: string
    modelId?: string
    pass: boolean
    question: string
    runnerKind?: RunnerKind
    score?: number
    skillInstall?: SkillInstallMode
    systemPromptKey?: string
    tscErrors?: string[]
  }
  version: number
}

type SnapshotResult = {
  category: string
  pass: boolean
  question: string
  score?: number
  type: 'codegen'
}

const ENV_VARIANT_TO_INTERNAL: Record<string, Variant> = {
  'agent-claude-code': 'agent-skill',
  'agent-claude-code-baseline': 'agent-baseline',
  baseline: 'baseline',
  skill: 'skill',
}

export function setup() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY must be set to run eval tests')
  }
}

export function teardown() {
  const envVariant = process.env.EVAL_VARIANT ?? 'skill'
  const variant = ENV_VARIANT_TO_INTERNAL[envVariant] ?? 'skill'

  const cacheDir = path.resolve(__dirname, 'eval-results/cache')
  const runsDir = path.resolve(__dirname, 'eval-results/runs', envVariant)

  let cacheFiles: string[]
  try {
    cacheFiles = readdirSync(cacheDir).filter((f) => f.endsWith('.json'))
  } catch {
    return
  }

  const results: SnapshotResult[] = []

  for (const file of cacheFiles) {
    try {
      const raw = JSON.parse(readFileSync(path.join(cacheDir, file), 'utf-8')) as CacheEntry
      if (raw.version !== 1) {
        continue
      }
      const entryVariant = getVariant(raw.result)
      if (entryVariant !== variant) {
        continue
      }
      results.push({
        category: raw.result.category,
        pass: raw.result.pass,
        question: raw.result.question,
        score: raw.result.score,
        type: 'codegen',
      })
    } catch {
      // skip corrupt entries
    }
  }

  if (results.length === 0) {
    return
  }

  results.sort(
    (a, b) => a.category.localeCompare(b.category) || a.question.localeCompare(b.question),
  )

  mkdirSync(runsDir, { recursive: true })

  const existing = readdirSync(runsDir).filter((f) => f.endsWith('.json'))
  const runNumber = existing.length + 1

  const now = new Date()
  // Format: YYYY-MM-DDTHH-MM
  const dateStr = now.toISOString().slice(0, 16).replace(':', '-')
  const filename = `${String(runNumber).padStart(3, '0')}-${dateStr}.json`

  const passed = results.filter((r) => r.pass).length
  const scored = results.filter((r) => r.score !== undefined)
  const avgScore =
    scored.length > 0 ? scored.reduce((s, r) => s + (r.score ?? 0), 0) / scored.length : 0

  const snapshot = {
    avgScore,
    generatedAt: now.toISOString(),
    passRate: results.length > 0 ? passed / results.length : 0,
    passed,
    results,
    run: runNumber,
    summary: {
      avgScore,
      passRate: results.length > 0 ? passed / results.length : 0,
      passed,
      total: results.length,
    },
    total: results.length,
    variant,
  }

  writeFileSync(path.join(runsDir, filename), JSON.stringify(snapshot, null, 2))

  console.log(
    `[evals] Snapshot → eval-results/runs/${variant}/${filename} (${results.length} results, ${passed}/${results.length} passed)`,
  )
}
