import type { CliArgs } from '../types.js'

import { beforeAll, describe, expect, it, vitest } from 'vitest'

import { selectDb } from './select-db.js'

function makeArgs(overrides: Record<string, unknown> = {}): CliArgs {
  return { _: [], ...overrides } as unknown as CliArgs
}

describe('selectDb', () => {
  beforeAll(() => {
    // eslint-disable-next-line no-console
    console.log = vitest.fn()
  })

  it('should accept the recommended connection string when --yes is set (no prompt)', async () => {
    const args = makeArgs({ '--db': 'sqlite', '--yes': true })

    const result = await selectDb(args, 'my-app')

    expect(result.type).toBe('sqlite')
    expect(result.dbUri).toBe('file:./my-app.db')
  })

  it('should prefer an explicit --db-connection-string over --yes', async () => {
    const args = makeArgs({
      '--db': 'sqlite',
      '--db-connection-string': 'file:./custom.db',
      '--yes': true,
    })

    const result = await selectDb(args, 'my-app')

    expect(result.dbUri).toBe('file:./custom.db')
  })
})
