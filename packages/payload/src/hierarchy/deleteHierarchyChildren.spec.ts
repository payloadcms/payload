import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it, vi } from 'vitest'

import { deleteHierarchyChildren } from './deleteHierarchyChildren.js'

describe('hierarchy deletion request propagation', () => {
  it('should keep native request headers and isolate the cascade recursion path', async () => {
    const remove = vi.fn(async ({ req }: { req: PayloadRequest }) => {
      expect(req.headers.get('x-test')).toBe('preserved')
      expect(req.context._payloadHierarchyDeletionPath).toEqual(['["pages","0"]'])
    })
    const req = Object.assign(
      new Request('http://localhost', { headers: { 'x-test': 'preserved' } }),
      {
        context: { hierarchyDeleteStrategy: 'cascade' },
        payload: { delete: remove, find: vi.fn().mockResolvedValue({ docs: [{ id: 1 }] }) },
      },
    ) as unknown as PayloadRequest

    await deleteHierarchyChildren({
      id: 0,
      collection: { slug: 'pages', versions: false } as SanitizedCollectionConfig,
      parentFieldName: 'parent',
      req,
    })
    expect(remove).toHaveBeenCalledWith(expect.objectContaining({ overrideAccess: false }))
    expect(req.context).not.toHaveProperty('_payloadHierarchyDeletionPath')
  })
})
