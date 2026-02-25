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
  })
}

/**
 * Generates a cache key for a codegen eval case.
 * Keyed on: instruction input, expected outcome, fixture *content* (not path), and model ID.
 * Using content instead of path means the cache is automatically invalidated when a fixture changes.
 * systemPromptKey is intentionally excluded — codegen always uses configModify regardless of
 * which suite variant (qaWithSkill / qaNoSkill) triggered it, so the result is shared.
 */
export function codegenKey(params: {
  expected: string
  fixtureContent: string
  input: string
  modelId: string
}): string {
  return hashKey({
    type: 'codegen',
    input: params.input,
    expected: params.expected,
    fixtureContent: params.fixtureContent,
    modelId: params.modelId,
  })
}
