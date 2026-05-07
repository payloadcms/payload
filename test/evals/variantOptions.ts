import type { SuiteOptions } from './suites/types.js'

/**
 * Reads the EVAL_VARIANT env var and returns the matching SuiteOptions.
 *
 * EVAL_VARIANT=skill      (default) — codegen with SKILL.md injected
 * EVAL_VARIANT=baseline             — codegen with no skill context (uplift comparison)
 */
export function resolveVariantOptions(): SuiteOptions {
  const variant = process.env.EVAL_VARIANT ?? 'skill'

  if (variant === 'baseline') {
    return { labelSuffix: ' (baseline)', systemPromptKey: 'codegenNoSkill' }
  }

  return {}
}
