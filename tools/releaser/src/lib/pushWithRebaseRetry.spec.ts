import { describe, expect, it, vi } from 'vitest'

import { pushWithRebaseRetry } from './pushWithRebaseRetry.js'

const NON_FF = '! [rejected] 3.x -> 3.x (non-fast-forward)'

describe('pushWithRebaseRetry', () => {
  it('should push once when there is no rejection', async () => {
    const run = vi.fn()

    await pushWithRebaseRetry({ tag: 'v3.90.3', run })

    const cmds = run.mock.calls.map((call) => call[0] as string)
    expect(cmds).toEqual(['git push --atomic origin HEAD:3.x refs/tags/v3.90.3'])
  })

  it('should rebase, recreate the tag, and re-push on a non-fast-forward rejection', async () => {
    let attempt = 0
    const run = vi.fn((cmd: string) => {
      if (cmd.startsWith('git push') && attempt++ === 0) {
        throw new Error(NON_FF)
      }
    })

    await pushWithRebaseRetry({ tag: 'v3.90.3', run })

    const cmds = run.mock.calls.map((call) => call[0] as string)
    expect(cmds).toEqual([
      'git push --atomic origin HEAD:3.x refs/tags/v3.90.3',
      'git pull --rebase origin 3.x',
      'git tag -f -a v3.90.3 -m v3.90.3',
      'git push --atomic origin HEAD:3.x refs/tags/v3.90.3',
    ])
  })

  it('should give up after maxRetries and throw', async () => {
    const run = vi.fn((cmd: string) => {
      if (cmd.startsWith('git push')) {
        throw new Error(NON_FF)
      }
    })

    await expect(pushWithRebaseRetry({ tag: 'v3.90.3', maxRetries: 3, run })).rejects.toThrow(
      /after 3/,
    )

    const pushes = run.mock.calls.filter((call) => (call[0] as string).startsWith('git push'))
    expect(pushes).toHaveLength(3)
  })

  it('should log commands and not run them in dry-run', async () => {
    const run = vi.fn()
    const log = vi.fn()

    await pushWithRebaseRetry({ tag: 'v3.90.3', dryRun: true, run, log })

    expect(run).not.toHaveBeenCalled()
    expect(log).toHaveBeenCalled()
  })

  it('should rethrow a non-fast-forward-unrelated error immediately without rebasing', async () => {
    const run = vi.fn(() => {
      throw new Error('fatal: Authentication failed')
    })

    let thrownMessage = ''

    await pushWithRebaseRetry({ tag: 'v3.90.3', run }).catch((err: unknown) => {
      thrownMessage = err instanceof Error ? err.message : String(err)
    })

    expect(thrownMessage).toMatch(/Authentication failed/)
    expect(thrownMessage).not.toMatch(/after \d+ attempts/)

    // Exactly one call — the initial push — means no rebase/retag/re-push occurred.
    expect(run).toHaveBeenCalledTimes(1)
    expect(run).toHaveBeenCalledWith('git push --atomic origin HEAD:3.x refs/tags/v3.90.3')
  })

  it('should throw when maxRetries is less than 1', async () => {
    const run = vi.fn()

    await expect(pushWithRebaseRetry({ tag: 'v3.90.3', maxRetries: 0, run })).rejects.toThrow(
      /at least 1/,
    )

    expect(run).not.toHaveBeenCalled()
  })
})
