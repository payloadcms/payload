import { describe, expect, it } from 'vitest'

import { codegenKey } from './cache.js'

const base = {
  expected: 'expected',
  fixtureContent: 'starter',
  input: 'do the thing',
}

describe('codegenKey', () => {
  it('produces stable hex keys', () => {
    const a = codegenKey({ ...base, modelId: 'openai/gpt-5', runnerKind: 'llm' })
    const b = codegenKey({ ...base, modelId: 'openai/gpt-5', runnerKind: 'llm' })
    expect(a).toBe(b)
    expect(a).toMatch(/^[a-f0-9]{64}$/)
  })

  it('separates llm and claude-code runs for otherwise-identical inputs', () => {
    const llm = codegenKey({ ...base, modelId: 'openai/gpt-5', runnerKind: 'llm' })
    const agent = codegenKey({
      ...base,
      agentModel: 'claude-opus-4-6',
      agentVersion: '2.0.0',
      modelId: 'claude-code/claude-opus-4-6/2.0.0',
      runnerKind: 'claude-code',
      skillInstall: 'embedded',
    })
    expect(llm).not.toBe(agent)
  })

  it('separates llm codegenWithSkill from codegenNoSkill via skillHash inclusion', () => {
    const withSkill = codegenKey({
      ...base,
      modelId: 'openai/gpt-5',
      runnerKind: 'llm',
      systemPromptKey: 'codegenWithSkill',
    })
    const noSkill = codegenKey({
      ...base,
      modelId: 'openai/gpt-5',
      runnerKind: 'llm',
      systemPromptKey: 'codegenNoSkill',
    })
    expect(withSkill).not.toBe(noSkill)
  })

  it('separates claude-code embedded from claude-code none via skillHash inclusion', () => {
    const embedded = codegenKey({
      ...base,
      agentModel: 'claude-opus-4-6',
      agentVersion: '2.0.0',
      modelId: 'claude-code/claude-opus-4-6/2.0.0',
      runnerKind: 'claude-code',
      skillInstall: 'embedded',
    })
    const none = codegenKey({
      ...base,
      agentModel: 'claude-opus-4-6',
      agentVersion: '2.0.0',
      modelId: 'claude-code/claude-opus-4-6/2.0.0',
      runnerKind: 'claude-code',
      skillInstall: 'none',
    })
    expect(embedded).not.toBe(none)
  })

  it('separates two claude-code runs that differ only in agentModel', () => {
    const opus = codegenKey({
      ...base,
      agentModel: 'claude-opus-4-6',
      agentVersion: '2.0.0',
      modelId: 'claude-code/claude-opus-4-6/2.0.0',
      runnerKind: 'claude-code',
      skillInstall: 'embedded',
    })
    const sonnet = codegenKey({
      ...base,
      agentModel: 'claude-sonnet-4-6',
      agentVersion: '2.0.0',
      modelId: 'claude-code/claude-sonnet-4-6/2.0.0',
      runnerKind: 'claude-code',
      skillInstall: 'embedded',
    })
    expect(opus).not.toBe(sonnet)
  })

  it('separates two claude-code runs that differ only in agentVersion', () => {
    const v1 = codegenKey({
      ...base,
      agentModel: 'claude-opus-4-6',
      agentVersion: '2.0.0',
      modelId: 'claude-code/claude-opus-4-6/2.0.0',
      runnerKind: 'claude-code',
      skillInstall: 'embedded',
    })
    const v2 = codegenKey({
      ...base,
      agentModel: 'claude-opus-4-6',
      agentVersion: '2.0.1',
      modelId: 'claude-code/claude-opus-4-6/2.0.1',
      runnerKind: 'claude-code',
      skillInstall: 'embedded',
    })
    expect(v1).not.toBe(v2)
  })
})
