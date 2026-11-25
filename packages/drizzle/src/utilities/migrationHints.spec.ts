import { describe, expect, it } from 'vitest'

import { getMissingHints, invertMigrationHints } from './migrationHints.js'

describe('migrationHints', () => {
  it('should read the unresolved decisions from a missing_hints error', () => {
    const missingHints = [
      { type: 'rename_or_create', kind: 'column', entity: ['public', 'posts', 'heading'] },
      { type: 'confirm_data_loss', kind: 'column', entity: ['public', 'posts', 'title'] },
    ]

    expect(getMissingHints({ error: { code: 'missing_hints', missingHints } })).toEqual(
      missingHints,
    )
  })

  it('should ignore errors that are not missing_hints errors', () => {
    expect(getMissingHints({ error: new Error('connection refused') })).toBeUndefined()
    expect(
      getMissingHints({ error: { code: 'missing_hints', missingHints: [{ type: 'unknown' }] } }),
    ).toBeUndefined()
  })

  it('should reverse renames and drop other hints for the DOWN migration', () => {
    expect(
      invertMigrationHints({
        hints: [
          {
            type: 'rename',
            kind: 'column',
            from: ['public', 'posts', 'a'],
            to: ['public', 'posts', 'b'],
          },
          { type: 'create', kind: 'table', entity: ['public', 'authors'] },
        ],
      }),
    ).toEqual([
      {
        type: 'rename',
        kind: 'column',
        from: ['public', 'posts', 'b'],
        to: ['public', 'posts', 'a'],
      },
    ])
  })
})
