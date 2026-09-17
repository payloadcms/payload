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

    it('should not infer an action from unrecognized status values', () => {
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

    it('should use the active write locale to infer action', () => {
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

    it('should infer saveDraft for all locales from a draft status', () => {
      expect(
        resolveAction({
          draftsEnabled: true,
          localizedStatusEnabled: true,
          locale: 'all',
          operation: 'update',
          status: 'draft',
        }),
      ).toBe('saveDraft')
    })

    it('should require an explicit action for all-locale publication transitions', () => {
      expect(draftOps({ action: 'publish', locale: 'all', operation: 'update' })).toBe('publish')
      expect(draftOps({ action: 'unpublish', locale: 'all', operation: 'update' })).toBe(
        'unpublish',
      )
      expect(draftOps({ action: 'saveDraft', locale: 'all', operation: 'update' })).toBe(
        'saveDraft',
      )

      expect(() => draftOps({ locale: 'all', operation: 'update' })).toThrow(
        'Publishing all locales requires an explicit "publish" action.',
      )

      expect(() => draftOps({ locale: 'all', operation: 'update', status: 'published' })).toThrow(
        'Publishing all locales requires an explicit "publish" action.',
      )

      expect(draftOps({ locale: 'all', operation: 'create' })).toBe('saveDraft')
      expect(draftOps({ locale: 'all', operation: 'create', status: 'draft' })).toBe('saveDraft')
    })

    it('should not infer from localized status when no locale is provided', () => {
      expect(
        draftOps({
          operation: 'create',
          status: localizedStatus,
        }),
      ).toBe('saveDraft')
    })

    it('should not infer from a missing locale key', () => {
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
    it('should use publish when action and draft status conflict', () => {
      expect(
        draftOps({
          action: 'publish',
          operation: 'update',
          status: 'draft',
        }),
      ).toBe('publish')
    })

    it('should use saveDraft when action and published status conflict', () => {
      expect(
        draftOps({
          action: 'saveDraft',
          operation: 'create',
          status: 'published',
        }),
      ).toBe('saveDraft')
    })

    it('should use unpublish when action and published status conflict', () => {
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
    it('should not infer unpublish from any status value', () => {
      expect(draftOps({ operation: 'update', status: 'draft' })).toBe('saveDraft')
      expect(draftOps({ operation: 'update', status: 'published' })).toBe('publish')
      expect(draftOps({ operation: 'update', status: 'unpublished' })).toBe('publish')
    })

    it('should require an explicit unpublish action', () => {
      expect(draftOps({ action: 'unpublish', operation: 'update' })).toBe('unpublish')
    })
  })

  describe('non-draft entities', () => {
    it('should return undefined for omitted action', () => {
      expect(
        resolveAction({
          draftsEnabled: false,
          operation: 'update',
        }),
      ).toBeUndefined()
    })

    it('should return undefined for explicit publish', () => {
      expect(
        resolveAction({
          action: 'publish',
          draftsEnabled: false,
          operation: 'create',
        }),
      ).toBeUndefined()
    })

    it('should ignore recognized status because no publication transition occurs', () => {
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

    it('should reject unpublish when drafts are not enabled', () => {
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
    it('should reject unknown action strings', () => {
      expect(() => draftOps({ action: 'SAVE_DRAFT', operation: 'update' })).toThrow(
        'Invalid action "SAVE_DRAFT". Valid actions for update are: saveDraft, publish, unpublish.',
      )
    })

    it('should reject leftover boolean draft intent', () => {
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
    it('should allow autosave when the resolved action is saveDraft', () => {
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

    it('should reject autosave when the resolved action is not saveDraft', () => {
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

    it('should reject autosave on non-draft entities', () => {
      expect(() =>
        resolveAction({
          autosave: true,
          draftsEnabled: false,
          operation: 'create',
        }),
      ).toThrow('autosave is only valid when the resolved action is "saveDraft".')
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
    expect(statusFromAction({ action })).toBe(expected)
  })
})

describe('canonicalizeWriteStatus', () => {
  it('should not mutate the caller data object', () => {
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

  it('should not mutate nested localized status objects', () => {
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

  it('should replace conflicting caller status with the action-derived status', () => {
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

  it('should return the original data when no publication transition occurred', () => {
    const data = { title: 'Page' }

    expect(
      canonicalizeWriteStatus({
        action: undefined,
        data,
      }),
    ).toBe(data)
  })

  it.each([
    ['publish', 'published'],
    ['unpublish', 'draft'],
  ] as const)('should write every localized status key for all-locale %s', (action, expected) => {
    expect(
      canonicalizeWriteStatus({
        action,
        data: {
          _status: {
            en: 'draft',
            es: 'published',
          },
        },
        locale: 'all',
      })._status,
    ).toEqual({
      en: expected,
      es: expected,
    })
  })
})
