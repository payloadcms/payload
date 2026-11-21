import type { TFunction } from '@payloadcms/translations'

import { describe, expect, it } from 'vitest'

import { getVersionLabel } from './getVersionLabel.js'

const t = ((key: string) => key) as unknown as TFunction

describe('getVersionLabel', () => {
  it('returns currentDraft for the latest draft when _status is a string', () => {
    const result = getVersionLabel({
      currentLocale: 'en',
      latestDraftVersion: {
        id: 'v3',
        updatedAt: '2026-01-03T00:00:00.000Z',
      },
      t,
      version: {
        id: 'v3',
        version: {
          _status: 'draft',
          updatedAt: '2026-01-03T00:00:00.000Z',
        },
      },
    })

    expect(result.name).toBe('currentDraft')
    expect(result.label).toBe('version:currentDraft')
  })

  it('resolves per-locale _status object using currentLocale when versions are fetched with locale: all', () => {
    const latestDraft = {
      id: 'v3',
      updatedAt: '2026-01-03T00:00:00.000Z',
    }
    const currentlyPublished = {
      id: 'v2',
      updatedAt: '2026-01-02T00:00:00.000Z',
      version: {
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    }

    const draftResult = getVersionLabel({
      currentLocale: 'en',
      currentlyPublishedVersion: currentlyPublished,
      latestDraftVersion: latestDraft,
      t,
      version: {
        id: 'v3',
        version: {
          _status: { de: 'published', en: 'draft' },
          updatedAt: '2026-01-03T00:00:00.000Z',
        },
      },
    })

    expect(draftResult.name).toBe('currentDraft')
    expect(draftResult.label).toBe('version:currentDraft')

    const publishedResult = getVersionLabel({
      currentLocale: 'en',
      currentlyPublishedVersion: currentlyPublished,
      latestDraftVersion: latestDraft,
      t,
      version: {
        id: 'v2',
        version: {
          _status: { de: 'draft', en: 'published' },
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      },
    })

    expect(publishedResult.name).toBe('currentlyPublished')
    expect(publishedResult.label).toBe('version:currentlyPublished')
  })
})
