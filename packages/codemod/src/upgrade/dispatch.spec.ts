import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { DispatchDeps } from './dispatch.js'
import type { Agent } from './selectAgent.js'

import { runDispatch } from './dispatch.js'
import { AGENTS } from './selectAgent.js'

const claude = AGENTS.find((a) => a.id === 'claude')!

const FLAGS = { dry: false, force: false, tag: 'canary' }

function makeDeps(overrides: Partial<DispatchDeps> = {}): DispatchDeps {
  return {
    detectAgents: () => [claude],
    isInteractive: true,
    promptChoice: async () => ({ agent: claude, kind: 'agent' }),
    renderPrompt: () => 'PROMPT-TEXT',
    runMechanical: async () => ({ failed: false }),
    spawnAgent: async () => ({ code: 0 }),
    writePromptFile: () => '/tmp/prompt.md',
    ...overrides,
  }
}

describe('runDispatch', () => {
  afterEach(() => vi.restoreAllMocks())

  it('prints the prompt and does not spawn when the choice is print', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const spawnAgent = vi.fn()

    const result = await runDispatch(
      { path: '.', upgradeFlags: FLAGS },
      makeDeps({ isInteractive: false, spawnAgent }),
    )

    expect(result).toEqual({ failed: false })
    expect(log).toHaveBeenCalledWith('PROMPT-TEXT')
    expect(spawnAgent).not.toHaveBeenCalled()
  })

  it('runs the mechanical slice and does not spawn or print when the choice is run', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const runMechanical = vi.fn(async () => ({ failed: false }))
    const spawnAgent = vi.fn()

    const result = await runDispatch(
      { path: './app', upgradeFlags: FLAGS },
      makeDeps({ promptChoice: async () => ({ kind: 'run' }), runMechanical, spawnAgent }),
    )

    expect(runMechanical).toHaveBeenCalledWith({ flags: FLAGS, path: './app' })
    expect(spawnAgent).not.toHaveBeenCalled()
    expect(log).not.toHaveBeenCalledWith('PROMPT-TEXT')
    expect(result).toEqual({ failed: false })
  })

  it('propagates a mechanical-slice failure', async () => {
    const result = await runDispatch(
      { path: '.', upgradeFlags: FLAGS },
      makeDeps({
        promptChoice: async () => ({ kind: 'run' }),
        runMechanical: async () => ({ failed: true }),
      }),
    )

    expect(result).toEqual({ failed: true })
  })

  it('writes the prompt file and spawns the chosen agent with the resolved cwd', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const writePromptFile = vi.fn(() => '/tmp/prompt.md')
    const spawnAgent = vi.fn(async () => ({ code: 0 }))

    const result = await runDispatch(
      { path: './app', upgradeFlags: FLAGS },
      makeDeps({ spawnAgent, writePromptFile }),
    )

    expect(writePromptFile).toHaveBeenCalledWith('PROMPT-TEXT')
    expect(spawnAgent).toHaveBeenCalledWith({
      agent: claude,
      cwd: resolve('./app'),
      promptFilePath: '/tmp/prompt.md',
    })
    expect(result).toEqual({ failed: false })
  })

  it('reports failure when the spawned agent exits non-zero', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    const result = await runDispatch(
      { path: '.', upgradeFlags: FLAGS },
      makeDeps({ spawnAgent: async () => ({ code: 2 }) }),
    )

    expect(result).toEqual({ failed: true })
  })

  it('reports failure and does not spawn when selection throws', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const spawnAgent = vi.fn()
    const detectAgents = (): Agent[] => [claude]

    const result = await runDispatch(
      { agentFlag: 'codex', path: '.', upgradeFlags: FLAGS },
      makeDeps({ detectAgents, spawnAgent }),
    )

    expect(result).toEqual({ failed: true })
    expect(spawnAgent).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledOnce()
  })
})
