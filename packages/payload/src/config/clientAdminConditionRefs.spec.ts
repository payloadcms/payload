import { describe, expect, it } from 'vitest'

import type { SanitizedConfig } from './types.js'

import { collectAdminConditionRefs } from './client.js'

function makeConfig(entries: SanitizedConfig['importMaps']['client']['entries']): SanitizedConfig {
  return {
    importMaps: { client: { entries }, server: { entries: [] } },
  } as unknown as SanitizedConfig
}

describe('collectAdminConditionRefs', () => {
  it('returns string-form refs for path-valued admin-condition entries (no exportName)', () => {
    const refs = collectAdminConditionRefs(
      makeConfig([
        {
          fieldPath: 'posts.advancedNote',
          kind: 'admin-condition',
          path: './conditions/showAdvanced.js#showAdvanced',
        },
      ]),
    )
    expect(refs).toEqual([
      { fieldPath: 'posts.advancedNote', ref: './conditions/showAdvanced.js#showAdvanced' },
    ])
  })

  it('returns object-form refs when an explicit exportName is recorded', () => {
    const refs = collectAdminConditionRefs(
      makeConfig([
        {
          exportName: 'showAdvanced',
          fieldPath: 'posts.advancedNote',
          kind: 'admin-condition',
          path: '@/conditions/showAdvanced',
        },
      ]),
    )
    expect(refs).toEqual([
      {
        fieldPath: 'posts.advancedNote',
        ref: { exportName: 'showAdvanced', path: '@/conditions/showAdvanced' },
      },
    ])
  })

  it('drops inline-marked admin-condition entries', () => {
    const refs = collectAdminConditionRefs(
      makeConfig([
        { fieldPath: 'posts.advancedNote', kind: 'admin-condition', path: '<inline>' },
        {
          fieldPath: 'posts.publishNote',
          kind: 'admin-condition',
          path: './conditions/canPublish.js#canPublish',
        },
      ]),
    )
    expect(refs).toEqual([
      { fieldPath: 'posts.publishNote', ref: './conditions/canPublish.js#canPublish' },
    ])
  })

  it('ignores non-admin-condition entries', () => {
    const refs = collectAdminConditionRefs(
      makeConfig([
        {
          fieldPath: 'posts.handle',
          kind: 'admin-validate',
          path: './validators/handleMin3.js#handleMin3',
        },
        { fieldPath: 'posts.title', kind: 'component', path: '@/MyField', slot: 'Field' },
      ]),
    )
    expect(refs).toEqual([])
  })

  it('skips entries missing a fieldPath', () => {
    const refs = collectAdminConditionRefs(
      makeConfig([{ kind: 'admin-condition', path: './conditions/orphan.js#orphan' } as never]),
    )
    expect(refs).toEqual([])
  })
})
