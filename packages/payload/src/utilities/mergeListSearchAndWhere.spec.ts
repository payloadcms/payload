import type { I18nClient } from '@payloadcms/translations'

import { describe, expect, it } from 'vitest'
import { createElement } from 'react'

import type { ClientCollectionConfig } from '../collections/config/client.js'
import type { ClientField } from '../fields/config/types.js'

import { mergeListSearchAndWhere } from './mergeListSearchAndWhere.js'

const i18n = {
  fallbackLanguage: 'en',
  language: 'en',
  t: (key: string) => key,
} as I18nClient

const statusField: ClientField = {
  name: 'status',
  type: 'select',
  options: [
    { label: { de: 'Aktiver Benutzer', en: 'Active User' }, value: 'active' },
    { label: 'Expired User', value: 'expired' },
    { label: 'Active Administrator', value: 'admin' },
    'other',
  ],
}

const collectionConfig = {
  admin: { listSearchableFields: ['status', 'title'] },
  fields: [statusField, { name: 'title', type: 'text' }],
} as ClientCollectionConfig

describe('mergeListSearchAndWhere', () => {
  it('should search displayed labels while retaining stored-value and text searches', () => {
    expect(mergeListSearchAndWhere({ collectionConfig, i18n, search: 'ACTIVE USER' })).toEqual({
      or: [
        { status: { like: 'ACTIVE USER' } },
        { status: { in: ['active'] } },
        { title: { like: 'ACTIVE USER' } },
      ],
    })
  })

  it('should include all values whose labels contain the search text', () => {
    const result = mergeListSearchAndWhere({ collectionConfig, i18n, search: 'active' })

    expect(result.or).toContainEqual({ status: { in: ['active', 'admin'] } })
  })

  it('should match the admin language rather than other translations', () => {
    const germanI18n = { ...i18n, language: 'de' } as I18nClient
    const germanResult = mergeListSearchAndWhere({
      collectionConfig,
      i18n: germanI18n,
      search: 'Benutzer',
    })
    const englishResult = mergeListSearchAndWhere({ collectionConfig, i18n, search: 'Benutzer' })

    expect(germanResult.or).toContainEqual({ status: { in: ['active'] } })
    expect(englishResult.or).not.toContainEqual({ status: { in: ['active'] } })
  })

  it('should use the fallback translation when the admin language is unavailable', () => {
    const result = mergeListSearchAndWhere({
      collectionConfig,
      i18n: { ...i18n, language: 'fr' } as I18nClient,
      search: 'Active User',
    })

    expect(result.or).toContainEqual({ status: { in: ['active'] } })
  })

  it('should preserve existing filters when matching a label', () => {
    const where = { and: [{ title: { equals: 'restricted' } }] }
    const result = mergeListSearchAndWhere({ collectionConfig, i18n, search: 'Active User', where })

    expect(result.and?.[0]).toEqual({ title: { equals: 'restricted' } })
    expect(result.and?.[1]).toHaveProperty('or')
  })

  it('should retain value-only matching when no admin language is provided', () => {
    expect(mergeListSearchAndWhere({ collectionConfig, search: 'active' })).toEqual({
      or: [{ status: { like: 'active' } }, { title: { like: 'active' } }],
    })
  })

  it('should preserve the existing query when the search is empty', () => {
    const where = { title: { equals: 'existing' } }

    expect(mergeListSearchAndWhere({ collectionConfig, i18n, search: '', where })).toBe(where)
  })

  it('should not match every select option for whitespace-only searches', () => {
    const result = mergeListSearchAndWhere({ collectionConfig, i18n, search: ' ' })

    expect(result.or).toEqual([{ status: { like: ' ' } }, { title: { like: ' ' } }])
  })

  it('should resolve select fields nested in layout fields, named tabs, and arrays', () => {
    const nestedConfig = {
      admin: { listSearchableFields: ['details.rows.status'] },
      fields: [
        {
          type: 'tabs',
          tabs: [
            {
              name: 'details',
              fields: [
                {
                  type: 'row',
                  fields: [{ name: 'rows', type: 'array', fields: [statusField] }],
                },
              ],
            },
          ],
        },
      ],
    } as ClientCollectionConfig
    const result = mergeListSearchAndWhere({
      collectionConfig: nestedConfig,
      i18n,
      search: 'Active User',
    })

    expect(result.or).toContainEqual({ 'details.rows.status': { in: ['active'] } })
  })

  it('should retain queries for paths that do not resolve to a local field', () => {
    const result = mergeListSearchAndWhere({
      collectionConfig: {
        ...collectionConfig,
        admin: { listSearchableFields: ['author.name'] },
      },
      i18n,
      search: 'user',
    })

    expect(result).toEqual({ or: [{ 'author.name': { like: 'user' } }] })
  })

  it('should search select labels when useAsTitle supplies the default search field', () => {
    const result = mergeListSearchAndWhere({
      collectionConfig: { ...collectionConfig, admin: { useAsTitle: 'status' } },
      i18n,
      search: 'Active User',
    })

    expect(result.or).toContainEqual({ status: { in: ['active'] } })
  })

  it('should ignore non-text option labels without changing string-option searches', () => {
    const result = mergeListSearchAndWhere({
      collectionConfig: {
        ...collectionConfig,
        fields: [
          {
            name: 'status',
            type: 'select',
            options: [{ label: createElement('span', null, 'Other'), value: 'jsx' }, 'other'],
          },
        ],
      },
      i18n,
      search: 'other',
    })

    expect(result.or).toEqual([{ status: { like: 'other' } }, { title: { like: 'other' } }])
  })
})
