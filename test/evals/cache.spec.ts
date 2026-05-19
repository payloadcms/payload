import { describe, expect, it, vi } from 'vitest'

import { codegenKey } from './cache.js'
import * as workdir from './runner/workdir.js'

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

  it('separates claude-code embedded from claude-code none', () => {
    const embedded = codegenKey({
      ...base,
      modelId: 'claude-code/claude-opus-4-6/2.0.0',
      runnerKind: 'claude-code',
      skillInstall: 'embedded',
    })
    const none = codegenKey({
      ...base,
      modelId: 'claude-code/claude-opus-4-6/2.0.0',
      runnerKind: 'claude-code',
      skillInstall: 'none',
    })
    expect(embedded).not.toBe(none)
  })

  it('separates two claude-code runs that differ only in model (via modelId)', () => {
    const opus = codegenKey({
      ...base,
      modelId: 'claude-code/claude-opus-4-6/2.0.0',
      runnerKind: 'claude-code',
      skillInstall: 'embedded',
    })
    const sonnet = codegenKey({
      ...base,
      modelId: 'claude-code/claude-sonnet-4-6/2.0.0',
      runnerKind: 'claude-code',
      skillInstall: 'embedded',
    })
    expect(opus).not.toBe(sonnet)
  })

  it('separates two claude-code runs that differ only in CLI version (via modelId)', () => {
    const v1 = codegenKey({
      ...base,
      modelId: 'claude-code/claude-opus-4-6/2.0.0',
      runnerKind: 'claude-code',
      skillInstall: 'embedded',
    })
    const v2 = codegenKey({
      ...base,
      modelId: 'claude-code/claude-opus-4-6/2.0.1',
      runnerKind: 'claude-code',
      skillInstall: 'embedded',
    })
    expect(v1).not.toBe(v2)
  })

  describe('skill content invalidation', () => {
    it('busts the cache for llm codegenWithSkill when skill files change', () => {
      const spy = vi.spyOn(workdir, 'getSkillTreeHash')

      spy.mockReturnValueOnce('aaaaaaaa')
      const before = codegenKey({
        ...base,
        modelId: 'openai/gpt-5',
        runnerKind: 'llm',
        systemPromptKey: 'codegenWithSkill',
      })

      spy.mockReturnValueOnce('bbbbbbbb')
      const after = codegenKey({
        ...base,
        modelId: 'openai/gpt-5',
        runnerKind: 'llm',
        systemPromptKey: 'codegenWithSkill',
      })

      expect(before).not.toBe(after)
      spy.mockRestore()
    })

    it('busts the cache for claude-code embedded when skill files change', () => {
      const spy = vi.spyOn(workdir, 'getSkillTreeHash')

      spy.mockReturnValueOnce('aaaaaaaa')
      const before = codegenKey({
        ...base,
        modelId: 'claude-code/claude-opus-4-6/2.0.0',
        runnerKind: 'claude-code',
        skillInstall: 'embedded',
      })

      spy.mockReturnValueOnce('bbbbbbbb')
      const after = codegenKey({
        ...base,
        modelId: 'claude-code/claude-opus-4-6/2.0.0',
        runnerKind: 'claude-code',
        skillInstall: 'embedded',
      })

      expect(before).not.toBe(after)
      spy.mockRestore()
    })

    it('does NOT bust cache for llm codegenNoSkill when skill files change', () => {
      const spy = vi.spyOn(workdir, 'getSkillTreeHash')

      // getSkillTreeHash should not even be called; if it is, two different
      // mock values would still produce identical keys since hash isn't in payload.
      spy.mockReturnValueOnce('aaaaaaaa')
      const before = codegenKey({
        ...base,
        modelId: 'openai/gpt-5',
        runnerKind: 'llm',
        systemPromptKey: 'codegenNoSkill',
      })

      spy.mockReturnValueOnce('bbbbbbbb')
      const after = codegenKey({
        ...base,
        modelId: 'openai/gpt-5',
        runnerKind: 'llm',
        systemPromptKey: 'codegenNoSkill',
      })

      expect(before).toBe(after)
      expect(spy).not.toHaveBeenCalled()
      spy.mockRestore()
    })

    it('does NOT bust cache for claude-code skillInstall=none when skill files change', () => {
      const spy = vi.spyOn(workdir, 'getSkillTreeHash')

      spy.mockReturnValueOnce('aaaaaaaa')
      const before = codegenKey({
        ...base,
        modelId: 'claude-code/claude-opus-4-6/2.0.0',
        runnerKind: 'claude-code',
        skillInstall: 'none',
      })

      spy.mockReturnValueOnce('bbbbbbbb')
      const after = codegenKey({
        ...base,
        modelId: 'claude-code/claude-opus-4-6/2.0.0',
        runnerKind: 'claude-code',
        skillInstall: 'none',
      })

      expect(before).toBe(after)
      expect(spy).not.toHaveBeenCalled()
      spy.mockRestore()
    })
  })
})
