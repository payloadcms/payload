import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { resolveSelfCommand } from './selfCommand.js'

describe('resolveSelfCommand', () => {
  it('prefers the explicit override', () => {
    expect(resolveSelfCommand({ argv1: '/x/bin/cli.js', override: 'pnpm codemod' })).toBe(
      'pnpm codemod',
    )
  })

  it('uses npx for an installed copy under node_modules', () => {
    expect(
      resolveSelfCommand({
        argv1: '/home/me/proj/node_modules/@payloadcms/codemod/bin/cli.js',
        override: undefined,
      }),
    ).toBe('npx @payloadcms/codemod')
  })

  it('points at the local build for a source checkout', () => {
    const argv1 = '/repo/packages/codemod/bin/cli.js'

    expect(resolveSelfCommand({ argv1, override: undefined })).toBe(`node ${resolve(argv1)}`)
  })

  it('falls back to npx when argv1 is missing', () => {
    expect(resolveSelfCommand({ argv1: undefined, override: undefined })).toBe(
      'npx @payloadcms/codemod',
    )
  })
})
