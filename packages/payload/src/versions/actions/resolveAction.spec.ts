import { describe, expect, it } from 'vitest'

import type { ResolveActionArgs } from './types.js'

import { APIError } from '../../errors/APIError.js'
import { canonicalizeWriteStatus, resolveAction, statusFromAction } from './resolveAction.js'

const draftOps = (overrides: Partial<ResolveActionArgs> & Pick<ResolveActionArgs, 'operation'>) =>
  resolveAction({
    draftsEnabled: true,
    ...overrides,
  })

describe('resolveAction', () => {
  describe('draft-enabled defaults', () => {
    it.each([
      ['create', 'saveDraft'],
      ['duplicate', 'saveDraft'],
      ['update', 'publish'],
      ['restore', 'publish'],
    ] as const)('%s defaults to %s when action and status are omitted', (operation, expected) => {
      expect(draftOps({ operation })).toBe(expected)
    })
  })

  describe('explicit actions', () => {
    it.each([
      ['create', 'saveDraft'],
      ['create', 'publish'],
      ['duplicate', 'saveDraft'],
      ['duplicate', 'publish'],
      ['update', 'saveDraft'],
      ['update', 'publish'],
      ['update', 'unpublish'],
      ['restore', 'saveDraft'],
      ['restore', 'publish'],
    ] as const)('%s honors explicit action %s', (operation, action) => {
      expect(draftOps({ action, operation })).toBe(action)
    })
  })

  describe('scalar status fallback', () => {
    it.each(['create', 'duplicate', 'update', 'restore'] as const)(
      '%s infers saveDraft from _status "draft" when action is omitted',
      (operation) => {
        expect(draftOps({ operation, status: 'draft' })).toBe('saveDraft')
      },
    )

    it.each(['create', 'duplicate', 'update', 'restore'] as const)(
      '%s infers publish from _status "published" when action is omitted',
      (operation) => {
        expect(draftOps({ operation, status: 'published' })).toBe('publish')
      },
    )

    it('does not infer an action from unrecognized status values', () => {
      expect(draftOps({ operation: 'update', status: 'archived' })).toBe('publish')
      expect(draftOps({ operation: 'create', status: true })).toBe('saveDraft')
      expect(draftOps({ operation: 'create', status: 1 })).toBe('saveDraft')
    })
  })

  describe('localized status fallback', () => {
    const localizedStatus = {
      en: 'draft',
      es: 'published',
    }

    it('uses the active write locale to infer action', () => {
      expect(
        draftOps({
          locale: 'en',
          operation: 'update',
          status: localizedStatus,
        }),
      ).toBe('saveDraft')

      expect(
        draftOps({
          locale: 'es',
          operation: 'update',
          status: localizedStatus,
        }),
      ).toBe('publish')
    })

    it('does not infer an all-locale transition from localized status', () => {
      expect(
        draftOps({
          locale: 'all',
          operation: 'update',
          status: localizedStatus,
        }),
      ).toBe('publish')
    })

    it('does not infer from localized status when no locale is provided', () => {
      expect(
        draftOps({
          operation: 'create',
          status: localizedStatus,
        }),
      ).toBe('saveDraft')
    })

    it('does not infer from a missing locale key', () => {
      expect(
        draftOps({
          locale: 'de',
          operation: 'update',
          status: localizedStatus,
        }),
      ).toBe('publish')
    })
  })

  describe('explicit action wins over status', () => {
    it('uses publish when action and draft status conflict', () => {
      expect(
        draftOps({
          action: 'publish',
          operation: 'update',
          status: 'draft',
        }),
      ).toBe('publish')
    })

    it('uses saveDraft when action and published status conflict', () => {
      expect(
        draftOps({
          action: 'saveDraft',
          operation: 'create',
          status: 'published',
        }),
      ).toBe('saveDraft')
    })

    it('uses unpublish when action and published status conflict', () => {
      expect(
        draftOps({
          action: 'unpublish',
          operation: 'update',
          status: 'published',
        }),
      ).toBe('unpublish')
    })
  })

  describe('unpublish is never inferred', () => {
    it('does not infer unpublish from any status value', () => {
      expect(draftOps({ operation: 'update', status: 'draft' })).toBe('saveDraft')
      expect(draftOps({ operation: 'update', status: 'published' })).toBe('publish')
      expect(draftOps({ operation: 'update', status: 'unpublished' })).toBe('publish')
    })

    it('requires an explicit unpublish action', () => {
      expect(draftOps({ action: 'unpublish', operation: 'update' })).toBe('unpublish')
    })
  })

  describe('non-draft entities', () => {
    it('returns undefined for omitted action', () => {
      expect(
        resolveAction({
          draftsEnabled: false,
          operation: 'update',
        }),
      ).toBeUndefined()
    })

    it('returns undefined for explicit publish', () => {
      expect(
        resolveAction({
          action: 'publish',
          draftsEnabled: false,
          operation: 'create',
        }),
      ).toBeUndefined()
    })

    it('ignores recognized status because no publication transition occurs', () => {
      expect(
        resolveAction({
          draftsEnabled: false,
          operation: 'update',
          status: 'draft',
        }),
      ).toBeUndefined()
    })

    it.each(['create', 'duplicate', 'update'] as const)(
      'rejects saveDraft on %s when drafts are not enabled',
      (operation) => {
        expect(() =>
          resolveAction({
            action: 'saveDraft',
            draftsEnabled: false,
            operation,
          }),
        ).toThrow(APIError)

        expect(() =>
          resolveAction({
            action: 'saveDraft',
            draftsEnabled: false,
            operation,
          }),
        ).toThrow('The action "saveDraft" cannot be used because drafts are not enabled.')
      },
    )

    it('rejects unpublish when drafts are not enabled', () => {
      expect(() =>
        resolveAction({
          action: 'unpublish',
          draftsEnabled: false,
          operation: 'update',
        }),
      ).toThrow('The action "unpublish" cannot be used because drafts are not enabled.')
    })
  })

  describe('invalid runtime values', () => {
    it('rejects unknown action strings', () => {
      expect(() => draftOps({ action: 'SAVE_DRAFT', operation: 'update' })).toThrow(
        'Invalid action "SAVE_DRAFT". Valid actions for update are: saveDraft, publish, unpublish.',
      )
    })

    it('rejects leftover boolean draft intent', () => {
      expect(() => draftOps({ action: true, operation: 'create' })).toThrow(
        'Invalid action true. Valid actions for create are: saveDraft, publish.',
      )
    })

    it.each([
      ['create', 'unpublish'],
      ['duplicate', 'unpublish'],
      ['restore', 'unpublish'],
    ] as const)('rejects %s action %s', (operation, action) => {
      expect(() => draftOps({ action, operation })).toThrow(
        `Invalid action "${action}". Valid actions for ${operation} are: saveDraft, publish.`,
      )
    })
  })

  describe('autosave', () => {
    it('allows autosave when the resolved action is saveDraft', () => {
      expect(
        draftOps({
          action: 'saveDraft',
          autosave: true,
          operation: 'update',
        }),
      ).toBe('saveDraft')

      expect(
        draftOps({
          autosave: true,
          operation: 'create',
        }),
      ).toBe('saveDraft')
    })

    it('rejects autosave when the resolved action is not saveDraft', () => {
      expect(() =>
        draftOps({
          action: 'publish',
          autosave: true,
          operation: 'update',
        }),
      ).toThrow('autosave is only valid when the resolved action is "saveDraft".')

      expect(() =>
        draftOps({
          autosave: true,
          operation: 'update',
        }),
      ).toThrow('autosave is only valid when the resolved action is "saveDraft".')
    })

    it('rejects autosave on non-draft entities', () => {
      expect(() =>
        resolveAction({
          autosave: true,
          draftsEnabled: false,
          operation: 'create',
        }),
      ).toThrow('autosave is only valid when the resolved action is "saveDraft".')
    })
  })

  describe('locale modifiers', () => {
    it('allows publishAllLocales with publish', () => {
      expect(
        draftOps({
          action: 'publish',
          operation: 'update',
          publishAllLocales: true,
        }),
      ).toBe('publish')
    })

    it('allows unpublishAllLocales with unpublish', () => {
      expect(
        draftOps({
          action: 'unpublish',
          operation: 'update',
          unpublishAllLocales: true,
        }),
      ).toBe('unpublish')
    })

    it('rejects publishAllLocales when the resolved action is not publish', () => {
      expect(() =>
        draftOps({
          action: 'saveDraft',
          operation: 'update',
          publishAllLocales: true,
        }),
      ).toThrow('publishAllLocales is only valid when the resolved action is "publish".')

      expect(() =>
        draftOps({
          operation: 'create',
          publishAllLocales: true,
        }),
      ).toThrow('publishAllLocales is only valid when the resolved action is "publish".')
    })

    it('rejects unpublishAllLocales when the resolved action is not unpublish', () => {
      expect(() =>
        draftOps({
          operation: 'update',
          unpublishAllLocales: true,
        }),
      ).toThrow('unpublishAllLocales is only valid when the resolved action is "unpublish".')
    })

    it('rejects combining both locale modifiers', () => {
      expect(() =>
        draftOps({
          action: 'publish',
          operation: 'update',
          publishAllLocales: true,
          unpublishAllLocales: true,
        }),
      ).toThrow('publishAllLocales and unpublishAllLocales cannot both be true.')
    })

    it('does not infer all-locale unpublish from status', () => {
      expect(() =>
        draftOps({
          operation: 'update',
          status: 'draft',
          unpublishAllLocales: true,
        }),
      ).toThrow('unpublishAllLocales is only valid when the resolved action is "unpublish".')
    })
  })
})

describe('statusFromAction', () => {
  it.each([
    ['saveDraft', 'draft'],
    ['publish', 'published'],
    ['unpublish', 'draft'],
    [undefined, undefined],
  ] as const)('%s derives status %s', (action, expected) => {
    expect(statusFromAction(action)).toBe(expected)
  })
})

describe('canonicalizeWriteStatus', () => {
  it('does not mutate the caller data object', () => {
    const data = {
      _status: 'published' as const,
      title: 'Hello',
    }

    const result = canonicalizeWriteStatus({
      action: 'saveDraft',
      data,
    })

    expect(data._status).toBe('published')
    expect(result).not.toBe(data)
    expect(result._status).toBe('draft')
    expect(result.title).toBe('Hello')
  })

  it('does not mutate nested localized status objects', () => {
    const data = {
      _status: {
        en: 'published',
        es: 'draft',
      },
    }

    const result = canonicalizeWriteStatus({
      action: 'saveDraft',
      data,
      locale: 'en',
    })

    expect(data._status.en).toBe('published')
    expect(result._status).toEqual({
      en: 'draft',
      es: 'draft',
    })
    expect(result._status).not.toBe(data._status)
  })

  it('replaces conflicting caller status with the action-derived status', () => {
    expect(
      canonicalizeWriteStatus({
        action: 'publish',
        data: { _status: 'draft', title: 'Post' },
      })._status,
    ).toBe('published')

    expect(
      canonicalizeWriteStatus({
        action: 'unpublish',
        data: { _status: 'published' },
      })._status,
    ).toBe('draft')
  })

  it('returns the original data when no publication transition occurred', () => {
    const data = { title: 'Page' }

    expect(
      canonicalizeWriteStatus({
        action: undefined,
        data,
      }),
    ).toBe(data)
  })

  it('writes all locale keys when publishing or unpublishing all locales', () => {
    const data = {
      _status: {
        en: 'draft',
        es: 'draft',
      },
    }

    expect(
      canonicalizeWriteStatus({
        action: 'publish',
        data,
        publishAllLocales: true,
      })._status,
    ).toEqual({
      en: 'published',
      es: 'published',
    })

    expect(
      canonicalizeWriteStatus({
        action: 'unpublish',
        data,
        unpublishAllLocales: true,
      })._status,
    ).toEqual({
      en: 'draft',
      es: 'draft',
    })
  })

  it('writes all locale keys when locale is all', () => {
    expect(
      canonicalizeWriteStatus({
        action: 'publish',
        data: {
          _status: {
            en: 'draft',
            es: 'draft',
          },
        },
        locale: 'all',
      })._status,
    ).toEqual({
      en: 'published',
      es: 'published',
    })
  })
})
