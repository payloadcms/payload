import type { SuiteOptions } from './suites/index.js'

import { MODELS } from './models.js'

/**
 * Reads the EVAL_VARIANT env var and returns the matching SuiteOptions.
 *
 * EVAL_VARIANT=skill      (default) — high-power model, with-skill prompts
 * EVAL_VARIANT=baseline             — high-power model, no-skill prompts
 * EVAL_VARIANT=low-power            — low-power model (gpt-4o), with-skill prompts
 */
export function resolveVariantOptions(): SuiteOptions {
  const variant = process.env.EVAL_VARIANT ?? 'skill'

  if (variant === 'baseline') {
    return { labelSuffix: ' (baseline)', systemPromptKey: 'qaNoSkill' }
  }

  if (variant === 'low-power') {
    return { labelSuffix: ' (low-power)', runnerModel: MODELS['openai:gpt-4o'] }
  }

  return {}
}
