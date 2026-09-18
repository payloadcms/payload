import type { CliArgs } from './types.js'

import { beforeAll, describe, expect, it, vitest } from 'vitest'

import { applyYesDefaults } from './lib/apply-yes-defaults.js'
import { selectDb } from './lib/select-db.js'
import { getValidTemplates } from './lib/templates.js'

function makeArgs(overrides: Record<string, unknown> = {}): CliArgs {
  return { _: [], ...overrides } as unknown as CliArgs
}

describe('non-interactive (-y) run', () => {
  beforeAll(() => {
    // eslint-disable-next-line no-console
    console.log = vitest.fn()
  })

  it('should resolve all choices without prompting for `my-app --db sqlite -y`', async () => {
    const args = applyYesDefaults(
      makeArgs({ _: ['my-app'], '--db': 'sqlite', '--yes': true }),
      getValidTemplates(),
    )

    expect(args['--template']).toBe('blank')
    expect(args['--no-agent']).toBe(true)

    const dbDetails = await selectDb(args, 'my-app')
    expect(dbDetails.type).toBe('sqlite')
    expect(dbDetails.dbUri).toBe('file:./my-app.db')
  })

  it('should throw before prompting when --db is missing on a blank starter', () => {
    expect(() =>
      applyYesDefaults(makeArgs({ _: ['my-app'], '--yes': true }), getValidTemplates()),
    ).toThrow(/--db/)
  })
})
