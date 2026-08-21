import { describe, expect, it, vi } from 'vitest'

import type { Agent, DispatchChoice } from './selectAgent.js'

import { AGENTS, detectInstalledAgents, selectDispatch } from './selectAgent.js'

const claude = AGENTS.find((a) => a.id === 'claude')!
const codex = AGENTS.find((a) => a.id === 'codex')!

const neverPrompt = () => Promise.reject(new Error('picker should not be called'))

describe('selectDispatch', () => {
  it('honors --agent when the requested agent is installed', async () => {
    const choice = await selectDispatch({
      agentFlag: 'claude',
      installed: [claude, codex],
      isInteractive: true,
      prompt: neverPrompt,
    })

    expect(choice).toEqual({ agent: claude, kind: 'agent' })
  })

  it('throws when --agent names an unknown agent', async () => {
    await expect(
      selectDispatch({
        agentFlag: 'cursor',
        installed: [claude],
        isInteractive: true,
        prompt: neverPrompt,
      }),
    ).rejects.toThrow(/unknown agent/i)
  })

  it('throws when --agent names an agent that is not installed', async () => {
    await expect(
      selectDispatch({
        agentFlag: 'codex',
        installed: [claude],
        isInteractive: true,
        prompt: neverPrompt,
      }),
    ).rejects.toThrow(/not installed/i)
  })

  it('falls back to printing when not interactive', async () => {
    const choice = await selectDispatch({
      installed: [claude, codex],
      isInteractive: false,
      prompt: neverPrompt,
    })

    expect(choice).toEqual({ kind: 'print' })
  })

  it('falls back to printing when no agents are installed', async () => {
    const choice = await selectDispatch({
      installed: [],
      isInteractive: true,
      prompt: neverPrompt,
    })

    expect(choice).toEqual({ kind: 'print' })
  })

  it('opens the picker when interactive with at least one agent', async () => {
    const picked: DispatchChoice = { agent: codex, kind: 'agent' }
    const prompt = vi.fn(async (agents: Agent[]) => {
      expect(agents).toEqual([claude, codex])
      return picked
    })

    const choice = await selectDispatch({
      installed: [claude, codex],
      isInteractive: true,
      prompt,
    })

    expect(prompt).toHaveBeenCalledOnce()
    expect(choice).toBe(picked)
  })
})

describe('detectInstalledAgents', () => {
  it('keeps only agents whose command resolves on PATH', () => {
    const installed = detectInstalledAgents((command) => command === 'claude')

    expect(installed).toEqual([claude])
  })

  it('returns an empty list when nothing resolves', () => {
    expect(detectInstalledAgents(() => false)).toEqual([])
  })
})
