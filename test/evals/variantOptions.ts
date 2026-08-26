import type { LanguageModel } from 'ai'

import type { RunnerKind } from './runner/types.js'
import type { SuiteOptions } from './suites/types.js'

import { MODELS } from './models.js'
import { RUNNER_CAPABILITIES } from './runner/types.js'

const DEFAULT_AGENT_MODEL = 'claude-opus-4-6'

export type ResolvedVariant = {
  /** Model override. For `llm` a MODELS key; for `claude-code` a `claude --model` name. Undefined = per-runner default. */
  model?: string
  runner: RunnerKind
  skillOn: boolean
}

/**
 * Reads the three orthogonal eval knobs:
 * - `EVAL_RUNNER` — `llm` (default) | `claude-code` — the harness
 * - `EVAL_SKILL`  — `on` (default) | `off` — whether the Payload skill is provided
 * - `EVAL_MODEL`  — optional model override, interpreted per-runner (see ResolvedVariant)
 */
export function resolveVariant(): ResolvedVariant {
  const runner = (process.env.EVAL_RUNNER ?? 'llm') as RunnerKind
  if (runner !== 'llm' && runner !== 'claude-code') {
    throw new Error(`EVAL_RUNNER must be "llm" or "claude-code", got "${process.env.EVAL_RUNNER}"`)
  }

  const skill = (process.env.EVAL_SKILL ?? 'on').toLowerCase()
  if (skill !== 'on' && skill !== 'off') {
    throw new Error(`EVAL_SKILL must be "on" or "off", got "${process.env.EVAL_SKILL}"`)
  }

  return {
    model: process.env.EVAL_MODEL || undefined,
    runner,
    skillOn: skill === 'on',
  }
}

/**
 * Maps the resolved knobs into the per-suite options the runners consume.
 * `EVAL_MODEL` overrides only the runner — the LLM scorer keeps its own default.
 */
export function resolveVariantOptions(): SuiteOptions {
  const { model, runner, skillOn } = resolveVariant()

  if (runner === 'claude-code') {
    const agentModel = model ?? DEFAULT_AGENT_MODEL
    return {
      agentModel,
      capabilities: RUNNER_CAPABILITIES[runner],
      kind: 'claude-code',
      labelSuffix: ` (claude-code/${agentModel}${skillOn ? '' : ', no skill'})`,
      skillInstall: skillOn ? 'embedded' : 'none',
    }
  }

  let runnerModel: LanguageModel | undefined
  if (model) {
    runnerModel = MODELS[model as keyof typeof MODELS]
    if (!runnerModel) {
      throw new Error(
        `EVAL_MODEL "${model}" is not a known llm model. Valid keys: ${Object.keys(MODELS).join(', ')}`,
      )
    }
  }

  return {
    capabilities: RUNNER_CAPABILITIES[runner],
    kind: 'llm',
    labelSuffix: skillOn ? '' : ' (baseline)',
    // Undefined falls back to DEFAULT_RUNNER_MODEL (key-based) in runCodegenCase.
    runnerModel,
    systemPromptKey: skillOn ? 'codegenWithSkill' : 'codegenNoSkill',
  }
}
