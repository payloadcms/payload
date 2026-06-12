import type { SuiteOptions } from './suites/types.js'

const DEFAULT_AGENT_MODEL = 'claude-opus-4-6'

export function resolveVariantOptions(): SuiteOptions {
  const variant = process.env.EVAL_VARIANT ?? 'skill'
  const agentModel = process.env.EVAL_AGENT_MODEL ?? DEFAULT_AGENT_MODEL

  switch (variant) {
    case 'agent-claude-code':
      return {
        agentModel,
        kind: 'claude-code',
        labelSuffix: ` (claude-code/${agentModel})`,
        skillInstall: 'embedded',
      }
    case 'agent-claude-code-baseline':
      return {
        agentModel,
        kind: 'claude-code',
        labelSuffix: ` (claude-code/${agentModel}, no skill)`,
        skillInstall: 'none',
      }
    case 'baseline':
      return { labelSuffix: ' (baseline)', systemPromptKey: 'codegenNoSkill' }
    default:
      return {}
  }
}
