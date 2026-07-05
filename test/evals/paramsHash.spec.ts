import { describe, expect, it, vi } from 'vitest'

import { codegenParamsHash } from './paramsHash.js'
import * as workdir from './runner/workdir.js'

const base = {
  expected: 'expected',
  fixtureContent: 'starter',
  input: 'do the thing',
}

describe('codegenParamsHash', () => {
  it('should produce stable hex hashes', () => {
    const a = codegenParamsHash({ ...base, modelId: 'openai/gpt-5', runnerKind: 'llm' })
    const b = codegenParamsHash({ ...base, modelId: 'openai/gpt-5', runnerKind: 'llm' })
    expect(a).toBe(b)
    expect(a).toMatch(/^[a-f0-9]{64}$/)
  })

  it('should separate llm and claude-code runs for otherwise-identical inputs', () => {
    const llm = codegenParamsHash({ ...base, modelId: 'openai/gpt-5', runnerKind: 'llm' })
    const agent = codegenParamsHash({
      ...base,
      modelId: 'claude-code/claude-opus-4-6/2.0.0',
      runnerKind: 'claude-code',
      skillInstall: 'embedded',
    })
    expect(llm).not.toBe(agent)
  })

  it('should separate llm codegenWithSkill from codegenNoSkill via skillHash inclusion', () => {
    const withSkill = codegenParamsHash({
      ...base,
      modelId: 'openai/gpt-5',
      runnerKind: 'llm',
      systemPromptKey: 'codegenWithSkill',
    })
    const noSkill = codegenParamsHash({
      ...base,
      modelId: 'openai/gpt-5',
      runnerKind: 'llm',
      systemPromptKey: 'codegenNoSkill',
    })
    expect(withSkill).not.toBe(noSkill)
  })

  it('should separate claude-code embedded from claude-code none', () => {
    const embedded = codegenParamsHash({
      ...base,
      modelId: 'claude-code/claude-opus-4-6/2.0.0',
      runnerKind: 'claude-code',
      skillInstall: 'embedded',
    })
    const none = codegenParamsHash({
      ...base,
      modelId: 'claude-code/claude-opus-4-6/2.0.0',
      runnerKind: 'claude-code',
      skillInstall: 'none',
    })
    expect(embedded).not.toBe(none)
  })

  it('should separate two claude-code runs that differ only in model (via modelId)', () => {
    const opus = codegenParamsHash({
      ...base,
      modelId: 'claude-code/claude-opus-4-6/2.0.0',
      runnerKind: 'claude-code',
      skillInstall: 'embedded',
    })
    const sonnet = codegenParamsHash({
      ...base,
      modelId: 'claude-code/claude-sonnet-4-6/2.0.0',
      runnerKind: 'claude-code',
      skillInstall: 'embedded',
    })
    expect(opus).not.toBe(sonnet)
  })

  it('should separate two claude-code runs that differ only in CLI version (via modelId)', () => {
    const v1 = codegenParamsHash({
      ...base,
      modelId: 'claude-code/claude-opus-4-6/2.0.0',
      runnerKind: 'claude-code',
      skillInstall: 'embedded',
    })
    const v2 = codegenParamsHash({
      ...base,
      modelId: 'claude-code/claude-opus-4-6/2.0.1',
      runnerKind: 'claude-code',
      skillInstall: 'embedded',
    })
    expect(v1).not.toBe(v2)
  })

  describe('skill content', () => {
    it('should change the parameter hash for llm codegenWithSkill when skill files change', () => {
      const spy = vi.spyOn(workdir, 'getSkillTreeHash')

      spy.mockReturnValueOnce('aaaaaaaa')
      const before = codegenParamsHash({
        ...base,
        modelId: 'openai/gpt-5',
        runnerKind: 'llm',
        systemPromptKey: 'codegenWithSkill',
      })

      spy.mockReturnValueOnce('bbbbbbbb')
      const after = codegenParamsHash({
        ...base,
        modelId: 'openai/gpt-5',
        runnerKind: 'llm',
        systemPromptKey: 'codegenWithSkill',
      })

      expect(before).not.toBe(after)
      spy.mockRestore()
    })

    it('should change the parameter hash for claude-code embedded when skill files change', () => {
      const spy = vi.spyOn(workdir, 'getSkillTreeHash')

      spy.mockReturnValueOnce('aaaaaaaa')
      const before = codegenParamsHash({
        ...base,
        modelId: 'claude-code/claude-opus-4-6/2.0.0',
        runnerKind: 'claude-code',
        skillInstall: 'embedded',
      })

      spy.mockReturnValueOnce('bbbbbbbb')
      const after = codegenParamsHash({
        ...base,
        modelId: 'claude-code/claude-opus-4-6/2.0.0',
        runnerKind: 'claude-code',
        skillInstall: 'embedded',
      })

      expect(before).not.toBe(after)
      spy.mockRestore()
    })

    it('should not change the parameter hash for llm codegenNoSkill when skill files change', () => {
      const spy = vi.spyOn(workdir, 'getSkillTreeHash')

      // getSkillTreeHash should not even be called; if it is, two different
      // mock values would still produce identical hashes since the skill hash is not included.
      spy.mockReturnValueOnce('aaaaaaaa')
      const before = codegenParamsHash({
        ...base,
        modelId: 'openai/gpt-5',
        runnerKind: 'llm',
        systemPromptKey: 'codegenNoSkill',
      })

      spy.mockReturnValueOnce('bbbbbbbb')
      const after = codegenParamsHash({
        ...base,
        modelId: 'openai/gpt-5',
        runnerKind: 'llm',
        systemPromptKey: 'codegenNoSkill',
      })

      expect(before).toBe(after)
      expect(spy).not.toHaveBeenCalled()
      spy.mockRestore()
    })

    it('should not change the parameter hash for claude-code skillInstall=none when skill files change', () => {
      const spy = vi.spyOn(workdir, 'getSkillTreeHash')

      spy.mockReturnValueOnce('aaaaaaaa')
      const before = codegenParamsHash({
        ...base,
        modelId: 'claude-code/claude-opus-4-6/2.0.0',
        runnerKind: 'claude-code',
        skillInstall: 'none',
      })

      spy.mockReturnValueOnce('bbbbbbbb')
      const after = codegenParamsHash({
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
