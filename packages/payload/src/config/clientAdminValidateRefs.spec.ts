import { describe, expect, it } from 'vitest'

import type { SanitizedConfig } from './types.js'

import { collectAdminValidateRefs } from './client.js'

function makeConfig(entries: SanitizedConfig['importMaps']['client']['entries']): SanitizedConfig {
  return {
    importMaps: { client: { entries }, server: { entries: [] } },
  } as unknown as SanitizedConfig
}

describe('collectAdminValidateRefs', () => {
  it('returns string-form refs for path-valued admin-validate entries (no exportName)', () => {
    const refs = collectAdminValidateRefs(
      makeConfig([
        {
          fieldPath: 'posts.handle',
          kind: 'admin-validate',
          path: './validators/handleMin3.js#handleMin3',
        },
      ]),
    )
    expect(refs).toEqual([
      { fieldPath: 'posts.handle', ref: './validators/handleMin3.js#handleMin3' },
    ])
  })

  it('returns object-form refs when an explicit exportName is recorded', () => {
    const refs = collectAdminValidateRefs(
      makeConfig([
        {
          exportName: 'handleMin3',
          fieldPath: 'posts.handle',
          kind: 'admin-validate',
          path: '@/validators/handleMin3',
        },
      ]),
    )
    expect(refs).toEqual([
      {
        fieldPath: 'posts.handle',
        ref: { exportName: 'handleMin3', path: '@/validators/handleMin3' },
      },
    ])
  })

  it('drops inline-marked admin-validate entries', () => {
    const refs = collectAdminValidateRefs(
      makeConfig([
        { fieldPath: 'posts.handle', kind: 'admin-validate', path: '<inline>' },
        {
          fieldPath: 'posts.slug',
          kind: 'admin-validate',
          path: './validators/slug.js#slug',
        },
      ]),
    )
    expect(refs).toEqual([{ fieldPath: 'posts.slug', ref: './validators/slug.js#slug' }])
  })

  it('ignores non-admin-validate entries', () => {
    const refs = collectAdminValidateRefs(
      makeConfig([
        {
          fieldPath: 'posts.advancedNote',
          kind: 'admin-condition',
          path: './conditions/showAdvanced.js#showAdvanced',
        },
        { fieldPath: 'posts.title', kind: 'component', path: '@/MyField', slot: 'Field' },
      ]),
    )
    expect(refs).toEqual([])
  })

  it('skips entries missing a fieldPath', () => {
    const refs = collectAdminValidateRefs(
      makeConfig([{ kind: 'admin-validate', path: './validators/orphan.js#orphan' } as never]),
    )
    expect(refs).toEqual([])
  })
})
