import { createHash } from 'node:crypto'

import type { RunnerKind, SkillInstallMode } from './runner/types.js'
import type { SystemPromptKey } from './types.js'

import { SKILL_SYSTEM_PROMPT } from './runner/claudeCode.js'
import { getSkillTreeHash } from './runner/workdir.js'

function hashParams(params: Record<string, string | undefined>): string {
  const stable = JSON.stringify(params, Object.keys(params).sort())
  return createHash('sha256').update(stable).digest('hex')
}

/** Hashes every input that can affect a codegen result. */
export function codegenParamsHash(params: {
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

  const agentSystemPrompt =
    params.runnerKind === 'claude-code' && params.skillInstall === 'embedded'
      ? SKILL_SYSTEM_PROMPT
      : undefined

  return hashParams({
    type: 'codegen',
    agentSystemPrompt,
    expected: params.expected,
    fixtureContent: params.fixtureContent,
    input: params.input,
    modelId: params.modelId,
    runnerKind: params.runnerKind,
    skillHash: skillIncluded ? getSkillTreeHash() : undefined,
    skillInstall: params.skillInstall,
    systemPromptKey: params.systemPromptKey,
  })
}
