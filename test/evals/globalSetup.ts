import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

type CacheEntry = {
  result: {
    category: string
    changeDescription?: string
    modelId?: string
    pass: boolean
    question: string
    score?: number
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
  type: 'codegen' | 'qa'
}

type Variant = 'baseline' | 'low-power' | 'skill'

function isHighPowerModel(modelId: string | undefined): boolean {
  if (!modelId) {
    return true
  }
  return modelId.includes('gpt-5') || modelId.includes('o3') || modelId.includes('claude-3-5')
}

function getEntryVariant(result: CacheEntry['result']): null | Variant {
  const key = result.systemPromptKey
  if (key === 'qaNoSkill' || key === 'codegenNoSkill') {
    return 'baseline'
  }
  if (!isHighPowerModel(result.modelId)) {
    return 'low-power'
  }
  if (!result.modelId) {
    return null
  }
  return 'skill'
}

function isCodegenResult(result: CacheEntry['result']): boolean {
  return result.changeDescription !== undefined || (result.tscErrors?.length ?? 0) > 0
}

export async function teardown() {
  const variant = (process.env.EVAL_VARIANT ?? 'skill') as Variant

  const cacheDir = path.resolve(__dirname, 'eval-results/cache')
  const runsDir = path.resolve(__dirname, 'eval-results/runs', variant)

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
      const entryVariant = getEntryVariant(raw.result)
      if (entryVariant !== variant) {
        continue
      }
      results.push({
        category: raw.result.category,
        pass: raw.result.pass,
        question: raw.result.question,
        score: raw.result.score,
        type: isCodegenResult(raw.result) ? 'codegen' : 'qa',
      })
    } catch {
      // skip corrupt entries
    }
  }

  if (results.length === 0) {
    return
  }

  results.sort(
    (a, b) =>
      a.category.localeCompare(b.category) ||
      a.type.localeCompare(b.type) ||
      a.question.localeCompare(b.question),
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
