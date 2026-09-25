import { describe, expect, it } from 'vitest'

import { getVariant } from './variant.js'

describe('getVariant', () => {
  it('returns agent-skill for claude-code with embedded skill', () => {
    expect(getVariant({ runnerKind: 'claude-code', skillInstall: 'embedded' })).toBe('agent-skill')
  })

  it('returns agent-baseline for claude-code without embedded skill', () => {
    expect(getVariant({ runnerKind: 'claude-code', skillInstall: 'none' })).toBe('agent-baseline')
  })

  it('returns agent-baseline for claude-code with missing skillInstall', () => {
    expect(getVariant({ runnerKind: 'claude-code' })).toBe('agent-baseline')
  })

  it('returns baseline for llm with codegenNoSkill', () => {
    expect(
      getVariant({ modelId: 'openai/gpt-5', runnerKind: 'llm', systemPromptKey: 'codegenNoSkill' }),
    ).toBe('baseline')
  })

  it('returns baseline for codegenNoSkill even without modelId', () => {
    expect(getVariant({ runnerKind: 'llm', systemPromptKey: 'codegenNoSkill' })).toBe('baseline')
  })

  it('returns skill for llm with a modelId and no codegenNoSkill', () => {
    expect(getVariant({ modelId: 'openai/gpt-5', runnerKind: 'llm' })).toBe('skill')
  })

  it('returns skill for legacy entries missing runnerKind but with modelId', () => {
    expect(getVariant({ modelId: 'openai/gpt-5' })).toBe('skill')
  })

  it('returns null for unclassifiable entries (no modelId, no kind, no prompt key)', () => {
    expect(getVariant({})).toBeNull()
  })
})
