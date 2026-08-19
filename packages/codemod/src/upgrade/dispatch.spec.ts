import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { DispatchDeps } from './dispatch.js'
import type { Agent } from './selectAgent.js'

import { runDispatch } from './dispatch.js'
import { AGENTS } from './selectAgent.js'

const claude = AGENTS.find((a) => a.id === 'claude')!

function makeDeps(overrides: Partial<DispatchDeps> = {}): DispatchDeps {
  return {
    detectAgents: () => [claude],
    isInteractive: true,
    promptChoice: async () => ({ agent: claude, kind: 'agent' }),
    renderPrompt: () => 'PROMPT-TEXT',
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

    const result = await runDispatch({ path: '.' }, makeDeps({ isInteractive: false, spawnAgent }))

    expect(result).toEqual({ failed: false })
    expect(log).toHaveBeenCalledWith('PROMPT-TEXT')
    expect(spawnAgent).not.toHaveBeenCalled()
  })

  it('writes the prompt file and spawns the chosen agent with the resolved cwd', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const writePromptFile = vi.fn(() => '/tmp/prompt.md')
    const spawnAgent = vi.fn(async () => ({ code: 0 }))

    const result = await runDispatch({ path: './app' }, makeDeps({ spawnAgent, writePromptFile }))

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
      { path: '.' },
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
      { agentFlag: 'codex', path: '.' },
      makeDeps({ detectAgents, spawnAgent }),
    )

    expect(result).toEqual({ failed: true })
    expect(spawnAgent).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledOnce()
  })
})
