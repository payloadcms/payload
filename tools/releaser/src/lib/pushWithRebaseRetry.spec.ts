import { describe, expect, it, vi } from 'vitest'

import { pushWithRebaseRetry } from './pushWithRebaseRetry.js'

const NON_FF = '! [rejected] main -> main (non-fast-forward)'

describe('pushWithRebaseRetry', () => {
  it('should push once when there is no rejection', async () => {
    const run = vi.fn()

    await pushWithRebaseRetry({ tag: 'v4.0.0-canary.10', run })

    const cmds = run.mock.calls.map((call) => call[0] as string)
    expect(cmds).toEqual(['git push --atomic origin HEAD:main refs/tags/v4.0.0-canary.10'])
  })

  it('should rebase, recreate the tag, and re-push on a non-fast-forward rejection', async () => {
    let attempt = 0
    const run = vi.fn((cmd: string) => {
      if (cmd.startsWith('git push') && attempt++ === 0) {
        throw new Error(NON_FF)
      }
    })

    await pushWithRebaseRetry({ tag: 'v4.0.0-canary.10', run })

    const cmds = run.mock.calls.map((call) => call[0] as string)
    expect(cmds).toEqual([
      'git push --atomic origin HEAD:main refs/tags/v4.0.0-canary.10',
      'git pull --rebase origin main',
      'git tag -f -a v4.0.0-canary.10 -m v4.0.0-canary.10',
      'git push --atomic origin HEAD:main refs/tags/v4.0.0-canary.10',
    ])
  })

  it('should give up after maxRetries and throw', async () => {
    const run = vi.fn((cmd: string) => {
      if (cmd.startsWith('git push')) {
        throw new Error(NON_FF)
      }
    })

    await expect(
      pushWithRebaseRetry({ tag: 'v4.0.0-canary.10', maxRetries: 3, run }),
    ).rejects.toThrow(/after 3/)

    const pushes = run.mock.calls.filter((call) => (call[0] as string).startsWith('git push'))
    expect(pushes).toHaveLength(3)
  })

  it('should log commands and not run them in dry-run', async () => {
    const run = vi.fn()
    const log = vi.fn()

    await pushWithRebaseRetry({ tag: 'v4.0.0-canary.10', dryRun: true, run, log })

    expect(run).not.toHaveBeenCalled()
    expect(log).toHaveBeenCalled()
  })
})
