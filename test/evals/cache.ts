import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { EvalResult } from './types.js'

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

/**
 * Prompt keys that inject SKILL.md content into the system prompt.
 * Cache entries for these keys must be invalidated when the skill file changes.
 */
const SKILL_PROMPT_KEYS = new Set(['codegenWithSkill', 'qaWithSkill'])

/** Lazy-loaded 8-char prefix of the skill file's SHA-256 hash. Computed once per process. */
let _skillHash: null | string = null

function getSkillHash(): string {
  if (_skillHash !== null) {
    return _skillHash
  }
  try {
    const skillPath = path.resolve(process.cwd(), 'tools/claude-plugin/skills/payload/SKILL.md')
    const content = readFileSync(skillPath, 'utf-8')
    _skillHash = createHash('sha256').update(content).digest('hex').slice(0, 8)
  } catch {
    _skillHash = 'unknown'
  }
  return _skillHash
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
 * Generates a cache key for a QA eval case.
 * Keyed on: question input, expected answer, system prompt, fixture path (if any), and model ID.
 * For skill-variant prompts, also includes an 8-char hash of SKILL.md so the cache is
 * automatically invalidated whenever the skill file changes.
 */
export function qaKey(params: {
  expected: string
  fixturePath?: string
  input: string
  modelId: string
  systemPromptKey: string
}): string {
  return hashKey({
    type: 'qa',
    input: params.input,
    expected: params.expected,
    fixturePath: params.fixturePath ?? '',
    systemPromptKey: params.systemPromptKey,
    modelId: params.modelId,
    skillHash: SKILL_PROMPT_KEYS.has(params.systemPromptKey) ? getSkillHash() : undefined,
  })
}

/**
 * Generates a cache key for a codegen eval case.
 * Keyed on: instruction input, expected outcome, fixture *content* (not path), model ID,
 * and systemPromptKey. Using content instead of path means the cache is automatically
 * invalidated when a fixture changes. systemPromptKey distinguishes skill vs baseline runs.
 */
export function codegenKey(params: {
  expected: string
  fixtureContent: string
  input: string
  modelId: string
  systemPromptKey: string
}): string {
  return hashKey({
    type: 'codegen',
    input: params.input,
    expected: params.expected,
    fixtureContent: params.fixtureContent,
    modelId: params.modelId,
    systemPromptKey: params.systemPromptKey,
  })
}
