import { describe, expect, it } from 'vitest'

import { applyReplacePolicy } from './replaceWithVersion.js'
import { getDraftStatusWhere } from './getDraftStatusWhere.js'

describe('applyReplacePolicy', () => {
  const published = { id: '1', title: 'Published' }
  const draft = { id: '1', title: 'Draft' }

  it('returns the draft when one exists for latest and draft policies', () => {
    expect(
      applyReplacePolicy({
        draftVersion: draft,
        policy: 'latest',
        publishedDoc: published,
      }),
    ).toBe(draft)

    expect(
      applyReplacePolicy({
        draftVersion: draft,
        policy: 'draft',
        publishedDoc: published,
      }),
    ).toBe(draft)
  })

  it('falls back to published content for latest when no draft exists', () => {
    expect(
      applyReplacePolicy({
        draftVersion: undefined,
        policy: 'latest',
        publishedDoc: published,
      }),
    ).toBe(published)
  })

  it('returns no result for draft-only when no draft exists', () => {
    expect(
      applyReplacePolicy({
        draftVersion: undefined,
        policy: 'draft',
        publishedDoc: published,
      }),
    ).toBeNull()
  })
})

describe('getDraftStatusWhere', () => {
  const payload = {
    config: {
      localization: {
        localeCodes: ['en', 'es'],
      },
    },
  } as Parameters<typeof getDraftStatusWhere>[0]['payload']

  const collection = {
    versions: {
      drafts: true,
    },
  } as Parameters<typeof getDraftStatusWhere>[0]['entity']

  const localizedCollection = {
    versions: {
      drafts: {
        localizeStatus: true,
      },
    },
  } as Parameters<typeof getDraftStatusWhere>[0]['entity']

  it('constrains scalar status to draft', () => {
    expect(getDraftStatusWhere({ entity: collection, payload })).toEqual({
      'version._status': {
        equals: 'draft',
      },
    })
  })

  it('uses the active locale for localized status', () => {
    expect(
      getDraftStatusWhere({
        entity: localizedCollection,
        locale: 'es',
        payload,
      }),
    ).toEqual({
      'version._status.es': {
        equals: 'draft',
      },
    })
  })

  it('matches any locale when locale is all', () => {
    expect(
      getDraftStatusWhere({
        entity: localizedCollection,
        locale: 'all',
        payload,
      }),
    ).toEqual({
      or: [
        { 'version._status.en': { equals: 'draft' } },
        { 'version._status.es': { equals: 'draft' } },
      ],
    })
  })
})
