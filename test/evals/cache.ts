import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { RunnerKind, SkillInstallMode } from './runner/types.js'
import type { EvalResult, SystemPromptKey } from './types.js'

import { SKILL_SYSTEM_PROMPT } from './runner/claudeCode.js'
import { getSkillTreeHash } from './runner/workdir.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cacheDir = path.join(__dirname, 'eval-results', 'cache')

type CacheEntry = {
  createdAt: string
  result: EvalResult
  version: 1
}

function hashKey(parts: Record<string, string | undefined>): string {
  const stable = JSON.stringify(parts, Object.keys(parts).sort())
  return createHash('sha256').update(stable).digest('hex')
}

function cacheFilePath(key: string): string {
  return path.join(cacheDir, `${key}.json`)
}

/** Returns true when EVAL_NO_CACHE=true is set, meaning cache reads are bypassed. */
export function isCacheBypassed(): boolean {
  return process.env.EVAL_NO_CACHE === 'true'
}

/** Reads a cached EvalResult. Returns null on miss, bypass, or read errors. */
export function getCachedResult(key: string): EvalResult | null {
  if (isCacheBypassed()) {
    return null
  }
  const filePath = cacheFilePath(key)
  if (!existsSync(filePath)) {
    return null
  }
  try {
    const entry = JSON.parse(readFileSync(filePath, 'utf-8')) as CacheEntry
    if (entry.version !== 1) {
      return null
    }
    return entry.result
  } catch {
    return null
  }
}

/** Persists an EvalResult to the cache. Always writes regardless of bypass flag. */
export function setCachedResult(key: string, result: EvalResult): void {
  mkdirSync(cacheDir, { recursive: true })
  const entry: CacheEntry = {
    version: 1,
    createdAt: new Date().toISOString(),
    result,
  }
  writeFileSync(cacheFilePath(key), JSON.stringify(entry, null, 2), 'utf-8')
}

/**
 * Removes cache files whose result matches `match` but whose key differs from
 * `currentKey`. Used after writing a fresh result so prior entries for the same
 * logical case (e.g. earlier fixture or skill content) are dropped, keeping
 * the dashboard from showing duplicate or stale rows.
 */
export function pruneStaleEntries(
  currentKey: string,
  match: (result: EvalResult) => boolean,
): void {
  let files: string[]
  try {
    files = readdirSync(cacheDir).filter((f) => f.endsWith('.json'))
  } catch {
    return
  }
  for (const file of files) {
    const fileKey = file.replace(/\.json$/, '')
    if (fileKey === currentKey) {
      continue
    }
    const filePath = path.join(cacheDir, file)
    try {
      const entry = JSON.parse(readFileSync(filePath, 'utf-8')) as CacheEntry
      if (entry.version === 1 && match(entry.result)) {
        rmSync(filePath, { force: true })
      }
    } catch {
      // skip unreadable / corrupt entries
    }
  }
}

/**
 * Generates a cache key for a codegen eval case.
 *
 * Keyed on instruction input, expected outcome, fixture content, runner kind,
 * `modelId` (which for agent runs already encodes `agentModel` + `agentVersion`),
 * and runner-specific options. Includes the skill-tree fingerprint when the run
 * depends on the skill content (LLM `codegenWithSkill` or claude-code `embedded`
 * install), so any change to the skill files invalidates the relevant entries.
 */
export function codegenKey(params: {
  expected: string
  fixtureContent: string
  input: string
  modelId?: string
  runnerKind: RunnerKind
  skillInstall?: SkillInstallMode
  systemPromptKey?: SystemPromptKey
}): string {
  const skillIncluded =
    (params.runnerKind === 'llm' && params.systemPromptKey === 'codegenWithSkill') ||
    (params.runnerKind === 'claude-code' && params.skillInstall === 'embedded')

  // For claude-code embedded runs the runner appends a system-prompt directive
  // nudging the agent to invoke the skill. Any tweak to that text changes
  // observable behavior, so factor it into the cache key.
  const agentSystemPrompt =
    params.runnerKind === 'claude-code' && params.skillInstall === 'embedded'
      ? SKILL_SYSTEM_PROMPT
      : undefined

  // agentModel and agentVersion are deliberately omitted: for claude-code runs,
  // modelId is `claude-code/<agentModel>/<version>`, so they're already in the hash.
  return hashKey({
    type: 'codegen',
    runnerKind: params.runnerKind,
    input: params.input,
    expected: params.expected,
    fixtureContent: params.fixtureContent,
    modelId: params.modelId,
    systemPromptKey: params.systemPromptKey,
    skillInstall: params.skillInstall,
    skillHash: skillIncluded ? getSkillTreeHash() : undefined,
    agentSystemPrompt,
  })
}
