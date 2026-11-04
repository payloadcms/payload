import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { pushWithRebaseRetry } from './pushWithRebaseRetry.js'
import { runCommand } from './runCommand.js'

const rejection = '! [rejected]        HEAD -> main (fetch first)'
// The rejection text comes from the environment so it is never part of the command string.
const failWithRejectionCmd = 'echo "$FAKE_GIT_STDERR" >&2; exit 1'

describe('runCommand', () => {
  beforeEach(() => {
    vi.stubEnv('FAKE_GIT_STDERR', rejection)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('should include stderr in the error when the command fails', () => {
    expect(() => runCommand({ cmd: failWithRejectionCmd, cwd: process.cwd() })).toThrow(
      /fetch first/,
    )
  })

  it('should print stderr', () => {
    expect(() => runCommand({ cmd: failWithRejectionCmd, cwd: process.cwd() })).toThrow()

    expect(process.stderr.write).toHaveBeenCalledWith(expect.stringContaining(rejection))
  })

  it('should not throw when the command succeeds', () => {
    expect(() => runCommand({ cmd: 'exit 0', cwd: process.cwd() })).not.toThrow()
  })

  it('should not throw when a successful command writes to stderr', () => {
    expect(() =>
      runCommand({ cmd: 'echo "$FAKE_GIT_STDERR" >&2; exit 0', cwd: process.cwd() }),
    ).not.toThrow()
    expect(process.stderr.write).toHaveBeenCalledWith(expect.stringContaining(rejection))
  })

  it('should let pushWithRebaseRetry rebase after a real rejected push', async () => {
    let pushAttempts = 0
    const run = vi.fn((cmd: string) => {
      if (cmd.startsWith('git push') && pushAttempts++ === 0) {
        runCommand({ cmd: failWithRejectionCmd, cwd: process.cwd() })
      }
    })

    await pushWithRebaseRetry({ log: () => {}, run, tag: 'v4.0.0-beta.3' })

    expect(run.mock.calls.map(([cmd]) => cmd)).toEqual([
      'git push --atomic origin HEAD:main refs/tags/v4.0.0-beta.3',
      'git pull --rebase origin main',
      'git tag -f -a v4.0.0-beta.3 -m v4.0.0-beta.3',
      'git push --atomic origin HEAD:main refs/tags/v4.0.0-beta.3',
    ])
  })
})
