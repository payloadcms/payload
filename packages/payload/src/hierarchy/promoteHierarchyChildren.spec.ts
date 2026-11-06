import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it, vi } from 'vitest'

import { promoteHierarchyChildren } from './promoteHierarchyChildren.js'

describe('hierarchy structural promotion', () => {
  it('should retain native request headers while isolating the structural locale', async () => {
    const find = vi.fn(async ({ req }: { req: PayloadRequest }) => {
      expect(req.headers.get('x-test')).toBe('preserved')
      expect(req.locale).toBe('all')
      return { docs: [] }
    })
    const req = Object.assign(
      new Request('http://localhost', { headers: { 'x-test': 'preserved' } }),
      {
        context: {},
        locale: 'en',
        payload: { db: { find } },
      },
    ) as unknown as PayloadRequest

    await promoteHierarchyChildren({
      id: 0,
      collection: { slug: 'pages', versions: false } as SanitizedCollectionConfig,
      parentFieldName: 'parent',
      req,
    })
    expect(req.locale).toBe('en')
  })

  it('should reject localized publication status before modifying any child', async () => {
    const find = vi.fn().mockResolvedValue({ docs: [{ id: 1 }] })
    const findOne = vi.fn()
    const update = vi.fn()
    const req = {
      context: {},
      payload: { db: { find, findOne, queryDrafts: find }, update },
    } as unknown as PayloadRequest

    await expect(
      promoteHierarchyChildren({
        id: 0,
        collection: {
          slug: 'pages',
          versions: { drafts: { localizeStatus: true } },
        } as SanitizedCollectionConfig,
        parentFieldName: 'parent',
        req,
      }),
    ).rejects.toThrow('localized draft status')
    expect(update).not.toHaveBeenCalled()
    expect(findOne).not.toHaveBeenCalled()
  })

  it('should allow removal of a leaf with localized publication status', async () => {
    const find = vi.fn().mockResolvedValue({ docs: [] })
    const req = {
      context: {},
      payload: { db: { find, queryDrafts: find } },
    } as unknown as PayloadRequest

    const ids = await promoteHierarchyChildren({
      id: 0,
      collection: {
        slug: 'pages',
        versions: { drafts: { localizeStatus: true } },
      } as SanitizedCollectionConfig,
      parentFieldName: 'parent',
      req,
    })

    expect(ids.size).toBe(0)
  })
})
