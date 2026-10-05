import { describe, expect, it, vi } from 'vitest'

import { runInstall } from './runInstall.js'

describe('runInstall', () => {
  it('invokes the detected package manager install with corepack prompt disabled', async () => {
    const spawn = vi.fn().mockResolvedValue({ code: 0 })

    const result = await runInstall({ packageManager: 'pnpm', path: '/project', spawn })

    expect(result).toEqual({ code: 0 })
    expect(spawn).toHaveBeenCalledWith('pnpm', ['install'], {
      cwd: '/project',
      env: expect.objectContaining({ COREPACK_ENABLE_DOWNLOAD_PROMPT: '0' }),
    })
  })

  it('uses the right binary for each package manager', async () => {
    const spawn = vi.fn().mockResolvedValue({ code: 0 })

    for (const pm of ['npm', 'yarn', 'bun'] as const) {
      await runInstall({ packageManager: pm, path: '/p', spawn })
    }

    expect(spawn.mock.calls.map((c) => c[0])).toEqual(['npm', 'yarn', 'bun'])
  })
})
