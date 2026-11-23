import type { RunnerKind } from '../../runner/types.js'
import type { EvalResult } from '../../types.js'
import type { EvalEntry } from './index.js'

/**
 * A configuration is the unit a pass rate is actually meaningful within:
 * the (runner, model, skill) triple that produced a result. Aggregating
 * across configurations (e.g. skill vs baseline, or model A vs model B)
 * averages apples and oranges, so the dashboard groups and scopes by this.
 */
export type Configuration = {
  /** Stable id for grouping/selection. */
  key: string
  /** Human label, e.g. "llm · claude-sonnet-4-6 · skill". */
  label: string
  /** Display model name (provider prefix stripped; CLI version dropped for agents). */
  model: string
  runner: RunnerKind
  skillOn: boolean
}

export type RunGroup = {
  config: Configuration
  entries: EvalEntry[]
  /** Stable run id. */
  key: string
  /** ISO timestamp for sorting. */
  timestamp: string
}

export function runKeyOf(result: { runId: string } & EvalResult): string {
  return result.runId
}

/** Formats an ISO timestamp in the computer's local timezone. */
export function formatLocalTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return timestamp
  }
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

/** Strips the provider prefix (llm: `anthropic.messages/x` → `x`) or CLI version (agent: `claude-code/x/1.2` → `x`). */
function shortModel(modelId: string | undefined, runner: RunnerKind): string {
  if (!modelId) {
    return 'unknown'
  }
  if (runner === 'claude-code') {
    // claude-code/<model>/<cli-version> — group by model, ignore the version.
    return modelId.split('/')[1] ?? modelId
  }
  // <provider>/<model>, e.g. anthropic.messages/claude-sonnet-4-6
  const segments = modelId.split('/')
  return segments[segments.length - 1] ?? modelId
}

export function getConfiguration(result: EvalResult): Configuration {
  const runner: RunnerKind = result.runnerKind ?? 'llm'
  const skillOn =
    runner === 'claude-code'
      ? result.skillInstall === 'embedded'
      : result.systemPromptKey === 'codegenWithSkill'
  const model = shortModel(result.modelId, runner)
  const skillLabel = skillOn ? 'skill' : 'baseline'
  return {
    key: `${runner}|${model}|${skillLabel}`,
    label: `${runner} · ${model} · ${skillLabel}`,
    model,
    runner,
    skillOn,
  }
}

/** Buckets entries into runs (one invocation each), most recent first. */
export function groupByRun(entries: EvalEntry[]): RunGroup[] {
  const map = new Map<string, RunGroup>()
  for (const entry of entries) {
    const key = runKeyOf(entry.result)
    let group = map.get(key)
    if (!group) {
      group = {
        config: getConfiguration(entry.result),
        entries: [],
        key,
        timestamp: entry.result.runId,
      }
      map.set(key, group)
    }
    group.entries.push(entry)
  }
  return [...map.values()].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

export type ConfigStats = {
  avgScore: null | number
  lastRun: string
  passed: number
  passRate: number
  total: number
  totalTokens: number
}

export function configStats(entries: EvalEntry[]): ConfigStats {
  const passed = entries.filter((e) => e.result.pass).length
  const scored = entries.filter((e) => e.result.score !== undefined)
  const avgScore =
    scored.length > 0
      ? scored.reduce((sum, e) => sum + (e.result.score ?? 0), 0) / scored.length
      : null
  const totalTokens = entries.reduce((sum, e) => sum + (e.result.usage?.total.totalTokens ?? 0), 0)
  const lastRun = entries.reduce((latest, e) => (e.createdAt > latest ? e.createdAt : latest), '')
  return {
    avgScore,
    lastRun,
    passed,
    passRate: entries.length > 0 ? passed / entries.length : 0,
    total: entries.length,
    totalTokens,
  }
}
