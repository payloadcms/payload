import type { Field } from 'payload'

import { pgTable, text } from 'drizzle-orm/pg-core'
import { flattenAllFields } from 'payload'
import { describe, expect, it } from 'vitest'

import type { DrizzleAdapter } from '../../types.js'

import { branchProjectionLocaleKey } from '../../branching/projectionLocaleNamespace.js'
import { transform } from '../read/index.js'
import { transformForWrite } from './index.js'

const branchKey = `bp2:${'a'.repeat(43)}`
const fields: Field[] = [
  { name: 'id', type: 'text' },
  { name: 'title', type: 'text', localized: true },
  { name: '_branchProjection_branchKey', type: 'text', localized: true },
  {
    name: '_branchProjection',
    type: 'group',
    fields: [{ name: 'branchKey', type: 'text', required: true }],
  },
]
const flattenedFields = flattenAllFields({ fields })

const createAdapter = ({ isPrivate = true, name = 'postgres' } = {}): DrizzleAdapter =>
  ({
    name,
    localesSuffix: '_locales',
    payload: { config: { localization: { localeCodes: ['en', 'fr', 'de'] } } },
    tableNameMap: new Map(),
    tables: {
      projection_locales: pgTable('projection_locales', {
        ...(isPrivate ? { [branchProjectionLocaleKey]: text(branchProjectionLocaleKey) } : {}),
      }),
    },
  }) as unknown as DrizzleAdapter

describe('private PostgreSQL projection locale namespaces', () => {
  it('should namespace only existing locale rows while preserving a source metadata lookalike', () => {
    const row = transformForWrite({
      adapter: createAdapter(),
      data: {
        title: { en: 'English', fr: null },
        _branchProjection_branchKey: { en: 'source value' },
        _branchProjection: { branchKey },
      },
      fields: flattenedFields,
      tableName: 'projection',
    })

    expect(row.locales).toEqual({
      en: {
        title: 'English',
        _branchProjection_branchKey: 'source value',
        [branchProjectionLocaleKey]: branchKey,
      },
      fr: { title: null, [branchProjectionLocaleKey]: branchKey },
    })
    expect(row.row._branchProjection_branchKey).toBe(branchKey)
  })

  it.each([undefined, null, '', 'untrusted', `bp2:${'a'.repeat(3000)}`])(
    'should reject a localized private write with invalid encoded branch key %s',
    (key) => {
      expect(() =>
        transformForWrite({
          adapter: createAdapter(),
          data: { title: { en: 'English' }, _branchProjection: { branchKey: key } },
          fields: flattenedFields,
          tableName: 'projection',
        }),
      ).toThrow('require an encoded branch key')
    },
  )

  it('should allow a skeleton without generating translated rows', () => {
    const row = transformForWrite({
      adapter: createAdapter(),
      data: { id: 'skeleton' },
      fields: flattenedFields,
      tableName: 'projection',
    })

    expect(row.locales).toEqual({})
  })

  it.each([
    { isPrivate: false, name: 'postgres' },
    { isPrivate: true, name: 'sqlite' },
  ])('should preserve the existing $name write path with isPrivate=$isPrivate', (options) => {
    const row = transformForWrite({
      adapter: createAdapter(options),
      data: { title: { en: 'English' }, _branchProjection_branchKey: { en: 'source value' } },
      fields: flattenedFields,
      tableName: 'projection',
    })

    expect(row.locales).toEqual({
      en: { title: 'English', _branchProjection_branchKey: 'source value' },
    })
  })

  it('should omit the raw locale namespace from transformed content', () => {
    const adapter = createAdapter()
    const data = {
      id: 'projection',
      _locales: [
        {
          _locale: 'en',
          title: 'English',
          _branchProjection_branchKey: 'source value',
          [branchProjectionLocaleKey]: branchKey,
        },
      ],
    }
    const result = transform({
      adapter,
      config: adapter.payload.config,
      data,
      fields: flattenedFields,
      tableName: 'projection',
    })

    expect(result).toMatchObject({
      id: 'projection',
      title: { en: 'English' },
      _branchProjection_branchKey: { en: 'source value' },
    })
    expect(JSON.stringify(result)).not.toContain(branchProjectionLocaleKey)
  })
})
