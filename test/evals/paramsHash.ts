import { createHash } from 'node:crypto'

import type { RunnerKind, SkillInstallMode } from './runner/types.js'
import type { EvalCategory, SystemPromptKey } from './types.js'

import { SKILL_SYSTEM_PROMPT } from './runner/claudeCode.js'
import { getMCPEvalConfigHash, getSkillTreeHash } from './runner/workdir.js'

function hashParams(params: Record<string, string | undefined>): string {
  const stable = JSON.stringify(params, Object.keys(params).sort())
  return createHash('sha256').update(stable).digest('hex')
}

/** Hashes the stable inputs used to identify a reusable codegen result. */
export function codegenParamsHash(params: {
  category: EvalCategory
  configPath: string
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

  const agentSystemPrompt =
    params.runnerKind === 'claude-code' && params.skillInstall === 'embedded'
      ? SKILL_SYSTEM_PROMPT
      : undefined

  return hashParams({
    type: 'codegen',
    agentSystemPrompt,
    category: params.category,
    configPath: params.configPath,
    fixtureContent: params.fixtureContent,
    fixtureDependencyHash: params.configPath.startsWith('mcp/')
      ? getMCPEvalConfigHash()
      : undefined,
    input: params.input,
    modelId: params.modelId,
    runnerKind: params.runnerKind,
    skillHash: skillIncluded ? getSkillTreeHash() : undefined,
    skillInstall: params.skillInstall,
    systemPromptKey: params.systemPromptKey,
  })
}
