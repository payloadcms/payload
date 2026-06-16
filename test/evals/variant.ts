import type { RunnerKind, SkillInstallMode } from './runner/types.js'

export type Variant = 'agent-baseline' | 'agent-skill' | 'baseline' | 'skill'

/** The reporting lane for a (runner, skill) combination — the inverse of how getVariant reads it back off a result. */
export function variantLane(runner: RunnerKind, skillOn: boolean): Variant {
  if (runner === 'claude-code') {
    return skillOn ? 'agent-skill' : 'agent-baseline'
  }
  return skillOn ? 'skill' : 'baseline'
}

type VariantInput = {
  modelId?: string
  runnerKind?: RunnerKind
  skillInstall?: SkillInstallMode
  systemPromptKey?: string
}

/**
 * Classifies a cached result into one of the four eval lanes.
 *
 * Returns `null` for entries that pre-date the variant taxonomy (no `modelId`
 * and not explicitly tagged `codegenNoSkill`) — they show up as "—" in the
 * dashboard rather than being silently bucketed.
 */
export function getVariant(result: VariantInput): null | Variant {
  if (result.runnerKind === 'claude-code') {
    return result.skillInstall === 'embedded' ? 'agent-skill' : 'agent-baseline'
  }
  if (result.systemPromptKey === 'codegenNoSkill') {
    return 'baseline'
  }
  // Only classify as the LLM-skill lane if we're sure it's the LLM runner.
  // Unknown future RunnerKind values fall through to `null` rather than silently bucket here.
  if ((result.runnerKind === 'llm' || result.runnerKind === undefined) && result.modelId) {
    return 'skill'
  }
  return null
}
